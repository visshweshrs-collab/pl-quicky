const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Fixture = require("../models/Fixture");
const Team = require("../models/Team");
const Standing = require("../models/Standing");
const { fetchGoalEventsForMatch } = require("./backfill_goal_events");

const decodeHtmlEntities = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&amp;/gi, "&")
    .replace(/&#0*39;|&apos;|&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
};

const parseFootballDataDate = (value, unixValue = null) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  if (value !== null && value !== undefined && value !== "") {
    const text = String(value).trim();
    if (text.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(text)) {
      const parsed = new Date(text);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text)) {
      const utcText = text.replace(/\s+/, "T");
      const parsed = new Date(`${utcText}Z`);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    const fallback = new Date(text);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }
  if (unixValue !== null && unixValue !== undefined && Number.isFinite(Number(unixValue)) && Number(unixValue) > 0) {
    const rawNum = Number(unixValue);
    const ms = rawNum > 1e12 ? rawNum : rawNum * 1000;
    const parsedUnix = new Date(ms);
    return Number.isNaN(parsedUnix.getTime()) ? null : parsedUnix;
  }
  return null;
};

/**
 * Synchronizes Premier League standings from FootballData.io into MongoDB.
 */
async function syncStandings() {
  const seasonId = 103535;
  const leagueId = 15;
  const apiKey = process.env.FOOTBALLDATA_API_KEY;
  if (!apiKey) return { standingsSaved: 0 };

  const response = await fetch(
    `https://footballdata.io/api/v1/leagues/${leagueId}/standings?season_id=${seasonId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch standings: HTTP ${response.status}`);
  }

  const data = await response.json();
  const standingsData = data?.data?.standings || data?.standings || [];
  if (!Array.isArray(standingsData) || standingsData.length === 0) {
    return { standingsSaved: 0 };
  }

  const teams = await Team.find().lean();
  const teamMap = {};
  for (const t of teams) {
    if (t.teamId != null) teamMap[Number(t.teamId)] = t;
  }

  let standingsSaved = 0;
  for (const row of standingsData) {
    const apiTeamId = row.team?.team_id ?? row.team?.id ?? row.team_id ?? row.teamId;
    const rawTeamName = row.team?.team_name ?? row.team?.name ?? row.team_name ?? row.teamName ?? "";
    if (!apiTeamId || !rawTeamName) continue;

    const team = teamMap[Number(apiTeamId)];
    const teamName = decodeHtmlEntities(team?.name || rawTeamName);

    let form = [];
    if (Array.isArray(row.form)) {
      form = row.form.slice(-5);
    } else if (typeof row.form === "string") {
      form = row.form.split("").slice(-5);
    }

    await Standing.findOneAndUpdate(
      { seasonId, teamId: Number(apiTeamId) },
      {
        seasonId,
        leagueId,
        position: Number(row.position || 0),
        teamId: Number(apiTeamId),
        teamName,
        shortName: decodeHtmlEntities(team?.shortName || row.team?.short_name || ""),
        logo: team?.logo || row.team?.logo || "",
        played: Number(row.record?.matches_played || 0),
        won: Number(row.record?.wins || 0),
        drawn: Number(row.record?.draws || 0),
        lost: Number(row.record?.losses || 0),
        goalsFor: Number(row.goals?.for || 0),
        goalsAgainst: Number(row.goals?.against || 0),
        goalDifference: Number(row.goals?.difference || 0),
        points: Number(row.record?.points || 0),
        form
      },
      { upsert: true, new: true }
    );
    standingsSaved++;
  }

  console.log(`Synced ${standingsSaved} standings rows`);
  return { standingsSaved };
}

/**
 * Full fixture synchronization for the current Premier League season.
 * Updates existing fixtures and inserts newly discovered fixtures using matchId upsert.
 * Never assigns 0-0 to upcoming matches.
 */
async function syncFixtures() {
  const seasonId = 103535;
  const leagueId = 15;
  const apiKey = process.env.FOOTBALLDATA_API_KEY;

  if (!apiKey) {
    throw new Error("FOOTBALLDATA_API_KEY is missing from environment (.env)");
  }

  console.log("Fixture sync started");

  // Pre-fetch all teams to map stadiums and details quickly
  const teams = await Team.find().lean();
  const teamMap = {};
  for (const t of teams) {
    if (t.teamId != null) {
      teamMap[Number(t.teamId)] = t;
    }
  }

  // Pre-fetch all existing fixtures to avoid N+1 queries and preserve verified fields
  const existingFixtures = await Fixture.find().lean();
  const existingMap = new Map(existingFixtures.map((f) => [Number(f.matchId), f]));

  let page = 1;
  let totalPages = 1;
  let allMatches = [];

  while (page <= totalPages) {
    const url = `https://footballdata.io/api/v1/seasons/${seasonId}/matches?league_id=${leagueId}&page=${page}&limit=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`API fetch error on page ${page}: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch season matches");
    }

    const matches = data.data?.matches || [];
    allMatches.push(...matches);

    totalPages = data.meta?.pagination?.total_pages || 1;
    page++;
  }

  // Build deterministic date -> gameweek lookup for matches on the same matchround date where API omits game_week
  const dateToGameweek = {};
  for (const m of allMatches) {
    const gw = m.game_week ?? m.gameweek;
    const rawDateStr = String(m.match_date || "").trim().slice(0, 10);
    if (gw != null && /^\d{4}-\d{2}-\d{2}$/.test(rawDateStr)) {
      dateToGameweek[rawDateStr] = String(gw);
    }
  }

  let insertedCount = 0;
  let updatedCount = 0;
  let completedCount = 0;
  let upcomingCount = 0;

  for (const match of allMatches) {
    const matchId = Number(match.match_id);
    if (!matchId) continue;

    const existing = existingMap.get(matchId) || null;
    const parsedDate = parseFootballDataDate(match.match_date, match.date_unix);
    const matchDate = parsedDate || (existing?.matchDate ? new Date(existing.matchDate) : null);
    if (!matchDate) {
      console.warn(`Skipping match ${matchId} due to invalid match_date:`, match.match_date);
      continue;
    }

    // Determine completion status
    const rawStatus = String(match.status_localized || match.status || "").toLowerCase();
    const isCompleted =
      rawStatus === "complete" ||
      rawStatus === "completed" ||
      rawStatus === "finished" ||
      rawStatus === "ft" ||
      rawStatus === "full time" ||
      rawStatus === "full_time";

    const isLive =
      rawStatus === "live" ||
      rawStatus === "1h" ||
      rawStatus === "2h" ||
      rawStatus === "ht" ||
      rawStatus === "half time" ||
      rawStatus === "in_play" ||
      rawStatus === "inplay";

    const isPostponed = rawStatus.includes("postponed");
    const isCancelled = rawStatus.includes("cancelled") || rawStatus.includes("canceled");

    let status = isCompleted
      ? "Finished"
      : isLive
        ? "LIVE"
        : isPostponed
          ? "Postponed"
          : isCancelled
            ? "Cancelled"
            : "Scheduled";
    let homeScore = null;
    let awayScore = null;

    if (isCompleted || isLive) {
      if (isCompleted) completedCount++;
      homeScore = match.score?.home !== null && match.score?.home !== undefined ? Number(match.score.home) : null;
      awayScore = match.score?.away !== null && match.score?.away !== undefined ? Number(match.score.away) : null;
    } else {
      upcomingCount++;
      // Genuinely unplayed / upcoming matches MUST have homeScore: null and awayScore: null
      homeScore = null;
      awayScore = null;
    }

    const homeTeamId = match.home_team?.team_id != null ? Number(match.home_team.team_id) : (existing?.homeTeamId ?? null);
    const awayTeamId = match.away_team?.team_id != null ? Number(match.away_team.team_id) : (existing?.awayTeamId ?? null);
    const homeTeamDoc = homeTeamId ? teamMap[homeTeamId] : null;
    const awayTeamDoc = awayTeamId ? teamMap[awayTeamId] : null;

    const venue = decodeHtmlEntities(
      match.venue?.stadium_name ||
      match.venue?.name ||
      match.stadium_name ||
      match.stadiumName ||
      homeTeamDoc?.stadiumName ||
      homeTeamDoc?.stadium ||
      existing?.venue ||
      ""
    );

    const venueAddress = decodeHtmlEntities(
      match.venue?.stadium_location ||
      match.stadium_address ||
      match.stadiumAddress ||
      homeTeamDoc?.stadiumAddress ||
      existing?.venueAddress ||
      ""
    );

    const rawDatePrefix = String(match.match_date || "").trim().slice(0, 10);
    const gameweek =
      match.game_week != null
        ? String(match.game_week)
        : match.gameweek != null
          ? String(match.gameweek)
          : dateToGameweek[rawDatePrefix] || existing?.gameweek || null;

    const homeTeamName = decodeHtmlEntities(
      homeTeamDoc?.name || match.home_team?.team_name || existing?.homeTeam || ""
    );
    const awayTeamName = decodeHtmlEntities(
      awayTeamDoc?.name || match.away_team?.team_name || existing?.awayTeam || ""
    );

    const fixtureDoc = {
      matchId,
      matchDate,
      status,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeTeamId,
      awayTeamId,
      homeScore,
      awayScore,
      venue,
      venueAddress,
      gameweek
    };

    if (existing) {
      // Preserve completed results already stored if API ever had missing scores
      if (
        (existing.status === "Finished" || existing.status === "Completed") &&
        existing.homeScore !== null &&
        existing.awayScore !== null &&
        !isCompleted
      ) {
        fixtureDoc.status = "Finished";
        fixtureDoc.homeScore = existing.homeScore;
        fixtureDoc.awayScore = existing.awayScore;
      }

      // Preserve or fetch goalEvents for completed matches
      const expectedGoals = (fixtureDoc.homeScore || 0) + (fixtureDoc.awayScore || 0);
      if (
        existing.goalEvents &&
        existing.goalEvents.length > 0 &&
        existing.goalEvents.length === expectedGoals
      ) {
        fixtureDoc.goalEvents = existing.goalEvents;
      } else if ((isCompleted || fixtureDoc.status === "Finished") && expectedGoals > 0) {
        try {
          const goals = await fetchGoalEventsForMatch(
            matchId,
            fixtureDoc.homeScore,
            fixtureDoc.awayScore,
            fixtureDoc.homeTeam,
            fixtureDoc.awayTeam
          );
          if (goals && goals.length > 0) {
            fixtureDoc.goalEvents = goals;
          } else if (existing.goalEvents && existing.goalEvents.length > 0) {
            fixtureDoc.goalEvents = existing.goalEvents;
          }
        } catch (eventErr) {
          console.warn(`Could not fetch goal events for completed match ${matchId}:`, eventErr.message);
        }
      } else if (isCompleted && expectedGoals === 0) {
        fixtureDoc.goalEvents = [];
      }

      await Fixture.updateOne({ matchId }, { $set: fixtureDoc });
      updatedCount++;
    } else {
      if (isCompleted && ((homeScore || 0) + (awayScore || 0) > 0)) {
        try {
          const goals = await fetchGoalEventsForMatch(
            matchId,
            homeScore,
            awayScore,
            fixtureDoc.homeTeam,
            fixtureDoc.awayTeam
          );
          fixtureDoc.goalEvents = goals;
        } catch (eventErr) {
          console.warn(`Could not fetch goal events for new completed match ${matchId}:`, eventErr.message);
        }
      }
      await Fixture.create(fixtureDoc);
      insertedCount++;
    }
  }

  try {
    await syncStandings();
  } catch (standingsErr) {
    console.warn("Standings sync warning during fixture sync:", standingsErr.message);
  }

  console.log(`Updated ${updatedCount} fixtures`);
  console.log(`Inserted ${insertedCount} new fixtures`);
  console.log("Sync completed");

  return {
    totalProcessed: allMatches.length,
    insertedCount,
    updatedCount,
    completedCount,
    upcomingCount
  };
}

/**
 * Synchronizes actively live matches and any past-kickoff matches not yet marked Finished.
 * Runs frequently (every 2 minutes) and on server startup to capture score changes,
 * goal events, and completed match transitions.
 * Conserves API quota when no matches are currently in progress or overdue.
 */
async function syncLiveMatches() {
  const now = new Date();
  // Check any match whose kickoff is in the past or starting within the next 5 minutes
  // that is not yet marked Finished / Postponed / Cancelled.
  const windowEnd = new Date(now.getTime() + 5 * 60 * 1000);

  const activeMatches = await Fixture.find({
    $or: [
      { status: { $in: ["LIVE", "1H", "2H", "HT", "IN_PLAY", "INPLAY", "live"] } },
      {
        matchDate: { $lte: windowEnd },
        status: { $nin: ["Finished", "FT", "Postponed", "Cancelled", "Canceled", "COMPLETED", "Completed", "Complete"] }
      }
    ]
  });

  if (activeMatches.length === 0) {
    return { activeCount: 0, updatedCount: 0 };
  }

  console.log(`[Live Sync] ${activeMatches.length} active/overdue match(es) detected. Checking updates...`);

  let liveUpdated = 0;
  let anyNewlyCompleted = false;

  for (const fixture of activeMatches) {
    try {
      const response = await fetch(`https://footballdata.io/api/v1/matches/${fixture.matchId}`, {
        headers: {
          Authorization: `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        console.warn(`[Live Sync] Failed to fetch match ${fixture.matchId}: HTTP ${response.status}`);
        continue;
      }

      const resData = await response.json();
      if (!resData.success || !resData.data) continue;

      const match = resData.data.match || resData.data;
      const rawStatus = String(match.status_localized || match.status || "").toLowerCase();
      const isCompleted =
        rawStatus === "complete" ||
        rawStatus === "completed" ||
        rawStatus === "finished" ||
        rawStatus === "ft" ||
        rawStatus === "full time" ||
        rawStatus === "full_time";

      const isLive =
        rawStatus === "live" ||
        rawStatus === "1h" ||
        rawStatus === "2h" ||
        rawStatus === "ht" ||
        rawStatus === "half time" ||
        rawStatus === "in_play" ||
        rawStatus === "inplay";

      const isPostponed = rawStatus.includes("postponed");
      const isCancelled = rawStatus.includes("cancelled") || rawStatus.includes("canceled");

      let status = isCompleted
        ? "Finished"
        : isLive
          ? "LIVE"
          : isPostponed
            ? "Postponed"
            : isCancelled
              ? "Cancelled"
              : fixture.status;
      let homeScore = fixture.homeScore;
      let awayScore = fixture.awayScore;

      if (isCompleted || isLive) {
        if (match.score?.home !== null && match.score?.home !== undefined) {
          homeScore = Number(match.score.home);
        }
        if (match.score?.away !== null && match.score?.away !== undefined) {
          awayScore = Number(match.score.away);
        }
      }

      const updateFields = {
        status,
        homeScore,
        awayScore
      };

      const parsedLiveDate = parseFootballDataDate(match.match_date, match.date_unix);
      if (parsedLiveDate) {
        updateFields.matchDate = parsedLiveDate;
      }

      // Synchronize goal events whenever match is live or transitioning to finished
      if (isCompleted || isLive) {
        const totalGoals = (homeScore || 0) + (awayScore || 0);
        if (totalGoals > 0) {
          try {
            const goals = await fetchGoalEventsForMatch(
              fixture.matchId,
              homeScore,
              awayScore,
              fixture.homeTeam,
              fixture.awayTeam
            );
            if (goals && goals.length > 0) {
              updateFields.goalEvents = goals;
            }
          } catch (eventErr) {
            console.warn(`[Live Sync] Could not fetch goal events for match ${fixture.matchId}:`, eventErr.message);
          }
        } else if (isCompleted && totalGoals === 0) {
          updateFields.goalEvents = [];
        }
      }

      if (isCompleted && fixture.status !== "Finished") {
        anyNewlyCompleted = true;
      }

      await Fixture.updateOne(
        { matchId: fixture.matchId },
        { $set: updateFields }
      );

      liveUpdated++;
      console.log(`[Live Sync] Updated match ${fixture.matchId} (${fixture.homeTeam} vs ${fixture.awayTeam}): Status ${status}, Score: ${homeScore} - ${awayScore}`);
    } catch (err) {
      console.error(`[Live Sync] Error updating match ${fixture.matchId}:`, err.message);
    }
  }

  if (anyNewlyCompleted) {
    try {
      await syncStandings();
    } catch (standingsErr) {
      console.warn("[Live Sync] Standings sync warning:", standingsErr.message);
    }
  }

  return { activeCount: activeMatches.length, updatedCount: liveUpdated };
}

module.exports = {
  syncFixtures,
  syncLiveMatches,
  syncStandings,
  parseFootballDataDate,
  decodeHtmlEntities,
  fetchGoalEventsForMatch
};

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await syncFixtures();
      await mongoose.disconnect();
      console.log("Database connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("Sync failed:", err);
      process.exit(1);
    }
  })();
}
