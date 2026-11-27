const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Fixture = require("../models/Fixture");

function cleanPlayerName(str) {
  if (!str) return "Unknown Player";
  const cleaned = String(str)
    // Proper JSON-style escapes, e.g. "ø"
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Escapes whose backslash was stripped upstream, e.g. "Mu00fcller".
    // Limited to the Latin letter ranges (U+00A0-U+024F) so ordinary surnames
    // that merely contain a "u" followed by four hex-like letters are never rewritten.
    .replace(
      /u(00[a-fA-F][0-9a-fA-F]|01[0-9a-fA-F]{2}|02[0-4][0-9a-fA-F])/g,
      (_, hex) => String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Unknown Player";
}

/**
 * Parses raw FootballData match events into normalized goal events.
 * Correctly pairs and deduplicates own goals, assigning them to the benefiting team.
 * Extracts base minute and extra minute (stoppage time).
 * 
 * @param {Array} rawEvents 
 * @param {Number|null} homeScore 
 * @param {Number|null} awayScore 
 * @param {String} homeTeamName 
 * @param {String} awayTeamName 
 * @returns {Array} Array of normalized goal event objects
 */
function parseGoalEvents(rawEvents, homeScore, awayScore, homeTeamName, awayTeamName) {
  const goalEvents = [];
  const rawGoals = (rawEvents || []).filter(e => e.event_type === "goal");
  
  if (rawGoals.length === 0) {
    return [];
  }

  // Group paired duplicate events (e.g. own goals which have home and away entries)
  const processedIndices = new Set();
  const goalGroups = [];

  for (let i = 0; i < rawGoals.length; i++) {
    if (processedIndices.has(i)) continue;
    const g1 = rawGoals[i];
    const group = [g1];
    processedIndices.add(i);

    const time1 = g1.minute ?? g1.raw?.time ?? g1.raw?.event_time;
    const p1 = g1.player?.player_name || g1.player?.player_id;

    for (let j = i + 1; j < rawGoals.length; j++) {
      if (processedIndices.has(j)) continue;
      const g2 = rawGoals[j];
      const time2 = g2.minute ?? g2.raw?.time ?? g2.raw?.event_time;
      const p2 = g2.player?.player_name || g2.player?.player_id;

      if (time1 === time2 && p1 === p2) {
        group.push(g2);
        processedIndices.add(j);
      }
    }
    goalGroups.push(group);
  }

  // Pre-calculate non-OG goals to determine benefiting side for own goals
  let nonOgHome = 0;
  let nonOgAway = 0;
  goalGroups.forEach(group => {
    const isOg = group.some(g =>
      (g.detail && g.detail.toLowerCase().includes("own goal")) ||
      (g.raw?.type && g.raw.type.toLowerCase().includes("own goal"))
    );
    if (!isOg && group.length === 1) {
      if (group[0].team_side === "home") nonOgHome++;
      else nonOgAway++;
    }
  });

  let remainingHomeNeeded = (homeScore !== null && homeScore !== undefined) ? homeScore - nonOgHome : null;
  let remainingAwayNeeded = (awayScore !== null && awayScore !== undefined) ? awayScore - nonOgAway : null;

  for (const group of goalGroups) {
    const isOg = group.some(g =>
      (g.detail && g.detail.toLowerCase().includes("own goal")) ||
      (g.raw?.type && g.raw.type.toLowerCase().includes("own goal"))
    );
    
    let chosenEvent = group[0];
    let side = chosenEvent.team_side;

    if (isOg && group.length > 1) {
      if (remainingHomeNeeded !== null && remainingAwayNeeded !== null) {
        if (remainingHomeNeeded > 0) {
          side = "home";
          remainingHomeNeeded--;
        } else if (remainingAwayNeeded > 0) {
          side = "away";
          remainingAwayNeeded--;
        }
      } else {
        const shotEvent = group.find(g => !g.detail?.toLowerCase().includes("own goal"));
        if (shotEvent) {
          side = shotEvent.team_side;
        } else {
          side = chosenEvent.team_side;
        }
      }
    }

    // Time parsing
    const rawTime = String(chosenEvent.raw?.time || chosenEvent.raw?.event_time || chosenEvent.minute || "");
    let minute = chosenEvent.minute;
    let extraMinute = chosenEvent.extra_minute ?? null;
    let displayMinute = "";

    if (rawTime.includes("+")) {
      const parts = rawTime.split("+");
      minute = parseInt(parts[0], 10);
      extraMinute = parseInt(parts[1], 10);
      displayMinute = `${minute}+${extraMinute}'`;
    } else {
      minute = parseInt(rawTime, 10) || chosenEvent.minute || 0;
      displayMinute = `${minute}'`;
    }

    const playerName = cleanPlayerName(chosenEvent.player?.player_name);
    const playerId = chosenEvent.player?.player_id || null;
    const teamName = side === "home" ? homeTeamName : awayTeamName;

    goalEvents.push({
      minute,
      extraMinute,
      displayMinute,
      teamSide: side,
      teamId: chosenEvent.team_id || null,
      teamName,
      playerId,
      playerName,
      eventType: "goal",
      detail: isOg ? "Own Goal" : (chosenEvent.detail || "Goal"),
      isOwnGoal: isOg
    });
  }

  // Sort chronologically: base minute first, then extraMinute
  goalEvents.sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    return (a.extraMinute || 0) - (b.extraMinute || 0);
  });

  return goalEvents;
}

// ---------------------------------------------------------------------------
// Known (display) names
//
// The match events endpoint only returns the provider's legal name, e.g.
// "Bukayo Ayoyinka Saka". The players endpoint returns the name fans know
// ("Bukayo Saka") as `known_name`, keyed by the same player_id. One squad
// lookup per team is cached so a full sync costs ~20 extra calls, not one per goal.
// ---------------------------------------------------------------------------
const SEASON_ID = 103535;
const LEAGUE_ID = 15;
const KNOWN_NAME_TTL_MS = 6 * 60 * 60 * 1000;
const KNOWN_NAME_RETRY_MS = 10 * 60 * 1000;
const knownNameCache = new Map(); // teamId -> { expiresAt, names: Map<playerId, knownName> }

async function getKnownNames(teamId, apiKey) {
  const id = Number(teamId);
  if (!id) return new Map();

  const cached = knownNameCache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.names;

  const names = new Map();
  let ok = false;
  try {
    const response = await fetch(
      `https://footballdata.io/api/v1/teams/${id}/players?season_id=${SEASON_ID}&league_id=${LEAGUE_ID}&page=1&limit=100`,
      { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } }
    );
    if (response.ok) {
      ok = true;
      const data = await response.json();
      const list = Array.isArray(data.data?.players)
        ? data.data.players
        : Array.isArray(data.data)
          ? data.data
          : [];
      for (const p of list) {
        const playerId = Number(p?.player_id ?? p?.id);
        if (playerId && p?.known_name) {
          names.set(playerId, cleanPlayerName(p.known_name));
        }
      }
    }
  } catch (err) {
    console.warn(`Could not load squad names for team ${id}:`, err.message);
  }

  // Failed lookups are retried sooner than successful ones.
  knownNameCache.set(id, {
    expiresAt: Date.now() + (ok ? KNOWN_NAME_TTL_MS : KNOWN_NAME_RETRY_MS),
    names
  });
  return names;
}

/**
 * Adds `knownName` (always a non-empty string; falls back to the full name) and
 * fills `teamId` from the side the goal is credited to. Own goals look the
 * scorer up in both squads because the player belongs to the opposing team.
 */
async function enrichGoalEvents(goals, homeTeamId, awayTeamId, apiKey) {
  if (!goals.length) return goals;

  let nameMaps = [];
  try {
    nameMaps = await Promise.all([
      getKnownNames(homeTeamId, apiKey),
      getKnownNames(awayTeamId, apiKey)
    ]);
  } catch (err) {
    console.warn("Known-name enrichment skipped:", err.message);
  }

  return goals.map((goal) => {
    let knownName = "";
    for (const map of nameMaps) {
      const found = map.get(Number(goal.playerId));
      if (found) {
        knownName = found;
        break;
      }
    }

    return {
      ...goal,
      knownName: knownName || goal.playerName,
      teamId:
        goal.teamId ?? (goal.teamSide === "home" ? homeTeamId : awayTeamId) ?? null
    };
  });
}

/**
 * Fetches and parses goal events for a given match ID from FootballData API.
 */
async function fetchGoalEventsForMatch(matchId, homeScore, awayScore, homeTeamName, awayTeamName) {
  const apiKey = process.env.FOOTBALLDATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALLDATA_API_KEY is missing from environment");
  }

  const url = `https://footballdata.io/api/v1/matches/${matchId}/events`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`API fetch error for match ${matchId}: HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawEvents = data.data?.events || [];
  const goals = parseGoalEvents(rawEvents, homeScore, awayScore, homeTeamName, awayTeamName);

  const matchInfo = data.data?.match || {};
  return enrichGoalEvents(
    goals,
    matchInfo.home_team?.team_id ?? null,
    matchInfo.away_team?.team_id ?? null,
    apiKey
  );
}

/**
 * Runs a complete idempotent backfill of goal events for all finished fixtures.
 */
async function backfillGoalEvents() {
  console.log("=== Starting Historical Goal Events Backfill ===");
  const completedFixtures = await Fixture.find({ status: "Finished" }).sort({ matchDate: 1 });
  console.log(`Found ${completedFixtures.length} completed fixtures to inspect.`);

  let totalProcessed = 0;
  let matchesWithGoals = 0;
  let matchesZeroZero = 0;
  let matchesUnavailable = 0;
  let totalGoalsStored = 0;

  for (const fixture of completedFixtures) {
    try {
      const goals = await fetchGoalEventsForMatch(
        fixture.matchId,
        fixture.homeScore,
        fixture.awayScore,
        fixture.homeTeam,
        fixture.awayTeam
      );

      // Check if match was genuinely 0 - 0
      const isZeroZero = fixture.homeScore === 0 && fixture.awayScore === 0;

      if (goals.length > 0) {
        matchesWithGoals++;
        totalGoalsStored += goals.length;
      } else if (isZeroZero) {
        matchesZeroZero++;
      } else {
        matchesUnavailable++;
      }

      // Idempotently store goalEvents array on the fixture
      await Fixture.updateOne(
        { matchId: fixture.matchId },
        { $set: { goalEvents: goals } }
      );

      totalProcessed++;
      if (totalProcessed % 10 === 0 || totalProcessed === completedFixtures.length) {
        console.log(`Processed ${totalProcessed}/${completedFixtures.length} fixtures...`);
      }
    } catch (err) {
      console.error(`Error backfilling match ${fixture.matchId}:`, err.message);
      matchesUnavailable++;
    }
  }

  console.log("\n=== Backfill Summary ===");
  console.log(`Total completed matches processed: ${totalProcessed}`);
  console.log(`Matches with goal events stored:    ${matchesWithGoals}`);
  console.log(`Matches with 0–0 scorelines:       ${matchesZeroZero}`);
  console.log(`Matches with events unavailable:    ${matchesUnavailable}`);
  console.log(`Total individual goal events:      ${totalGoalsStored}`);
  console.log("========================\n");

  return {
    totalProcessed,
    matchesWithGoals,
    matchesZeroZero,
    matchesUnavailable,
    totalGoalsStored
  };
}

module.exports = {
  backfillGoalEvents,
  fetchGoalEventsForMatch,
  parseGoalEvents
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await backfillGoalEvents();
      await mongoose.disconnect();
      console.log("Database connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("Backfill failed:", err);
      process.exit(1);
    }
  })();
}
