const express = require("express");
const cors = require("cors");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Team = require("./models/Team");
const Fixture = require("./models/Fixture");
const Standing = require("./models/Standing");
const Player = require("./models/Player");
const { syncFixtures, parseFootballDataDate } = require("./scripts/sync_fixtures");
const { initScheduler, runFullSync, getSchedulerStatus } = require("./services/scheduler");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());


// ==========================================
// HELPER - FORMAT DATE/TIME IN IST
// ==========================================

const formatIST = (date, unixValue = null) => {
  const matchDate = parseFootballDataDate(date, unixValue);

  if (!matchDate) {
    return {
      date: null,
      time: null
    };
  }

  return {
    date: matchDate.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),

    time: matchDate.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  };
};


// ==========================================
// HELPER - GET VALUE FROM NESTED API OBJECT
// ==========================================

const findNestedValue = (object, keys) => {
  if (!object || typeof object !== "object") {
    return "";
  }

  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {
      return object[key];
    }
  }

  for (const value of Object.values(object)) {
    if (value && typeof value === "object") {
      const result = findNestedValue(value, keys);

      if (
        result !== undefined &&
        result !== null &&
        result !== ""
      ) {
        return result;
      }
    }
  }

  return "";
};


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "PL Quicky Backend is running!"
  });
});


// ==========================================
// GET SAVED TEAMS
// ==========================================

app.get("/api/teams", async (req, res) => {
  try {

    const teams = await Team.find({
      teamId: {
        $exists: true,
        $ne: null
      }
    }).sort({
      name: 1
    });

    res.json(teams);

  } catch (error) {

    console.error(
      "Fetch teams error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch teams",
      error: error.message
    });
  }
});


// ==========================================
// IMPORT 2026/27 PREMIER LEAGUE TEAMS
// ==========================================

app.get("/api/teams/import-season", async (req, res) => {

  try {

    const seasonId = 103535;

    const response = await fetch(
      `https://footballdata.io/api/v1/seasons/${seasonId}/teams?league_id=15&page=1&limit=100`,
      {
        headers: {
          "Authorization":
            `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,

          "Accept":
            "application/json"
        }
      }
    );

    const data =
      await response.json();


    console.log(
      "TEAMS API RESPONSE:",
      JSON.stringify(data, null, 2)
    );


    if (!data.success) {

      throw new Error(
        data.message ||
        "Failed to fetch teams"
      );

    }


    // ------------------------------------------
    // FIND TEAMS
    // ------------------------------------------

    let teams = [];

    const rawTeams =
      data.data?.teams ??
      data.data;


    if (Array.isArray(rawTeams)) {

      teams = rawTeams;

    } else if (
      rawTeams &&
      typeof rawTeams === "object"
    ) {

      teams =
        Object.values(rawTeams);

    }


    if (!Array.isArray(teams)) {

      throw new Error(
        "Could not find teams array in API response"
      );

    }


    console.log(
      `Found ${teams.length} teams from API`
    );


    // ------------------------------------------
    // SAVE TEAMS
    // ------------------------------------------

    let totalSaved = 0;


    for (const item of teams) {

      const team =
        item.team ||
        item;


      const teamId =
        team.team_id;


      const teamName =
        team.team_name ||
        team.team_name_clean ||
        team.full_name;


      const shortName =
        team.team_name_clean ||
        team.team_name ||
        team.full_name ||
        "Unknown";


      if (!teamName || !teamId) {

        console.log(
          "Skipping invalid team:",
          item
        );

        continue;

      }


      const logo =
        team.team_logo ||
        "";


      const stadiumName =
        findNestedValue(
          team,
          [
            "stadium_name",
            "stadiumName"
          ]
        );


      const stadiumAddress =
        findNestedValue(
          team,
          [
            "stadium_address",
            "stadiumAddress"
          ]
        );


      await Team.findOneAndUpdate(

        {
          teamId:
            teamId
        },

        {

          teamId:
            teamId,

          name:
            teamName,

          shortName:
            shortName,

          logo:
            logo,

          stadiumName:
            stadiumName,

          stadiumAddress:
            stadiumAddress

        },

        {

          upsert:
            true,

          new:
            true

        }

      );


      console.log(
        `Saved team: ${teamName} | ID: ${teamId}`
      );


      totalSaved++;

    }


    res.json({

      message:
        "2026/27 Premier League teams imported successfully",

      seasonId:
        seasonId,

      teamsFound:
        teams.length,

      teamsSaved:
        totalSaved

    });


  } catch (error) {

    console.error(
      "Team import error:",
      error
    );

    res.status(500).json({

      message:
        "Failed to import teams",

      error:
        error.message

    });

  }

});


// ==========================================
// IMPORT DETAILED TEAM PROFILES
// ==========================================

app.get("/api/teams/import-profiles", async (req, res) => {

  try {

    // IMPORTANT:
    // Only use current API teams.
    // This prevents the old 20 records
    // from being processed.

    const teams = await Team.find({

      teamId: {
        $exists: true,
        $ne: null
      }

    });


    let totalUpdated = 0;


    console.log(
      `Found ${teams.length} current teams in MongoDB`
    );


    // ------------------------------------------
    // FETCH PROFILE FOR EACH TEAM
    // ------------------------------------------

    for (const savedTeam of teams) {

      try {

        const response = await fetch(

          `https://footballdata.io/api/v1/teams/${savedTeam.teamId}`,

          {

            headers: {

              "Authorization":
                `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,

              "Accept":
                "application/json"

            }

          }

        );


        const data =
          await response.json();


        console.log(
          `\n========== ${savedTeam.name} ==========`
        );


        console.log(
          JSON.stringify(
            data,
            null,
            2
          )
        );


        if (!data.success) {

          console.log(
            `Profile failed for ${savedTeam.name}:`,
            data.message
          );

          continue;

        }


        // ------------------------------------------
        // API MAY RETURN:
        //
        // data.data
        // data.data.team
        // data.team
        // ------------------------------------------

        const team =
          data.data?.team ||
          data.data ||
          data.team ||
          {};


        // ------------------------------------------
        // TEAM NAME
        // ------------------------------------------

        const teamName =
          findNestedValue(
            team,
            [
              "team_name",
              "team_name_clean",
              "full_name"
            ]
          ) ||
          savedTeam.name;


        // ------------------------------------------
        // SHORT NAME
        // ------------------------------------------

        const shortName =
          findNestedValue(
            team,
            [
              "short_name",
              "shortName",
              "team_name_clean"
            ]
          ) ||
          savedTeam.shortName;


        // ------------------------------------------
        // LOGO
        // ------------------------------------------

        const logo =
          findNestedValue(
            team,
            [
              "team_logo",
              "logo"
            ]
          ) ||
          savedTeam.logo;


        // ------------------------------------------
        // STADIUM
        // ------------------------------------------

        const stadiumName =
          findNestedValue(
            team,
            [
              "stadium_name",
              "stadiumName"
            ]
          ) ||
          "";


        // ------------------------------------------
        // STADIUM ADDRESS
        // ------------------------------------------

        const stadiumAddress =
          findNestedValue(
            team,
            [
              "stadium_address",
              "stadiumAddress"
            ]
          ) ||
          "";


        console.log(
          `TEAM: ${teamName}`
        );

        console.log(
          `STADIUM: ${stadiumName || "NOT AVAILABLE"}`
        );

        console.log(
          `ADDRESS: ${stadiumAddress || "NOT AVAILABLE"}`
        );


        // ------------------------------------------
        // UPDATE MONGODB
        // ------------------------------------------

        await Team.findOneAndUpdate(

          {
            teamId:
              savedTeam.teamId
          },

          {

            name:
              teamName,

            shortName:
              shortName,

            logo:
              logo,

            stadiumName:
              stadiumName,

            stadiumAddress:
              stadiumAddress

          },

          {

            new:
              true

          }

        );


        totalUpdated++;


      } catch (teamError) {

        console.error(
          `Error updating ${savedTeam.name}:`,
          teamError.message
        );

      }

    }


    // ------------------------------------------
    // RESPONSE
    // ------------------------------------------

    res.json({

      message:
        "Detailed team profiles imported successfully",

      teamsFound:
        teams.length,

      teamsUpdated:
        totalUpdated

    });


  } catch (error) {

    console.error(
      "Team profile import error:",
      error
    );


    res.status(500).json({

      message:
        "Failed to import team profiles",

      error:
        error.message

    });

  }

});


// ==========================================
// GET CURRENT PREMIER LEAGUE SEASON
// ==========================================

app.get("/api/football/season", async (req, res) => {

  try {

    const response = await fetch(

      "https://footballdata.io/api/v1/seasons?league_id=15",

      {

        headers: {

          "Authorization":
            `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,

          "Accept":
            "application/json"

        }

      }

    );


    const data =
      await response.json();


    res.json(data);


  } catch (error) {

    console.error(
      "Season fetch error:",
      error
    );


    res.status(500).json({

      message:
        "Failed to fetch seasons",

      error:
        error.message

    });

  }

});


// ==========================================
// IMPORT FULL 2026/27 PREMIER LEAGUE SEASON
// ==========================================

app.get("/api/fixtures/import-season", async (req, res) => {
  try {
    const seasonId = 103535;
    const result = await runFullSync("import_season");

    res.json({
      message: "2026/27 Premier League season imported successfully",
      seasonId: seasonId,
      pagesProcessed: 3,
      matchesSaved: (result?.insertedCount || 0) + (result?.updatedCount || 0),
      ...result
    });
  } catch (error) {
    console.error("Season fixture import error:", error);
    res.status(500).json({
      message: "Failed to import full season",
      error: error.message
    });
  }
});
// TEST ONE MATCH VENUE
app.get("/api/fixtures/test-venue", async (req, res) => {
  try {
    const fixture = await Fixture.findOne().sort({ matchDate: 1 });

    if (!fixture) {
      return res.status(404).json({
        message: "No saved fixtures found"
      });
    }

    const response = await fetch(
      `https://footballdata.io/api/v1/matches/${fixture.matchId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    res.json({
      savedMatchId: fixture.matchId,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      apiResponse: data
    });

  } catch (error) {
    console.error("Test venue error:", error.message);

    res.status(500).json({
      message: "Failed to test match venue",
      error: error.message
    });
  }
});
// ==========================================
// TEST MATCH STATS VENUE
// ==========================================

app.get("/api/fixtures/test-stats-venue", async (req, res) => {
  try {
    const fixture = await Fixture.findOne().sort({ matchDate: 1 });

    if (!fixture) {
      return res.status(404).json({
        message: "No saved fixtures found"
      });
    }

    const response = await fetch(
      `https://footballdata.io/api/v1/matches/${fixture.matchId}/stats`,
      {
        headers: {
          "Authorization":
            `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
          "Accept":
            "application/json"
        }
      }
    );

    const data = await response.json();

    res.json({
      savedMatchId: fixture.matchId,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      apiResponse: data
    });

  } catch (error) {
    console.error(
      "Test stats venue error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to test match stats venue",
      error:
        error.message
    });
  }
});
// ==========================================
// TEST UPCOMING MATCH VENUE
// ==========================================

app.get("/api/fixtures/test-upcoming-venue", async (req, res) => {
  try {
    const fixture = await Fixture.findOne({
      matchDate: { $gte: new Date() }
    }).sort({
      matchDate: 1
    });

    if (!fixture) {
      return res.status(404).json({
        message: "No upcoming fixtures found"
      });
    }

    const response = await fetch(
      `https://footballdata.io/api/v1/matches/${fixture.matchId}`,
      {
        headers: {
          "Authorization":
            `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
          "Accept":
            "application/json"
        }
      }
    );

    const data = await response.json();

    res.json({
      savedMatchId: fixture.matchId,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      matchDate: fixture.matchDate,
      apiResponse: data
    });

  } catch (error) {
    console.error(
      "Test upcoming venue error:",
      error.message
    );

    res.status(500).json({
      message:
        "Failed to test upcoming match venue",
      error:
        error.message
    });
  }
});
// ==========================================
// TEST UPCOMING SCHEDULE
// ==========================================

app.get("/api/fixtures/test-upcoming-schedule", async (req, res) => {
  try {
    const response = await fetch(
      "https://footballdata.io/api/v1/fixtures/upcoming?league_id=15&season_id=103535&limit=5",
      {
        headers: {
          "Authorization":
            `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
          "Accept":
            "application/json"
        }
      }
    );

    const data = await response.json();

    res.json(data);

  } catch (error) {
    console.error(
      "Upcoming schedule test error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to test upcoming schedule",
      error: error.message
    });
  }
});
// ==========================================
// ENRICH FIXTURES WITH STADIUM VENUE
// ==========================================

// ==========================================
// UPDATE TEAM STADIUMS
// ==========================================

app.get("/api/teams/update-stadiums", async (req, res) => {
  try {
    const stadiums = {
      132: {
        name: "Vitality Stadium",
        address: "Dean Court, Bournemouth"
      },

      57: {
        name: "Emirates Stadium",
        address: "Hornsey Road, London"
      },

      142: {
        name: "Villa Park",
        address: "Trinity Road, Birmingham"
      },

      189: {
        name: "Gtech Community Stadium",
        address: "166 Lionel Road North, Brentford"
      },

      180: {
        name: "Amex Stadium",
        address: "Village Way, Brighton"
      },

      136: {
        name: "Stamford Bridge",
        address: "Fulham Road, London"
      },

      209: {
        name: "Coventry Building Society Arena",
        address: "Judds Lane, Coventry"
      },

      127: {
        name: "Selhurst Park",
        address: "Holmesdale Road, London"
      },

      128: {
        name: "Hill Dickinson Stadium",
        address: "Bramley-Moore Dock, Liverpool"
      },

      146: {
        name: "Craven Cottage",
        address: "Stevenage Road, London"
      },

      134: {
        name: "MKM Stadium",
        address: "Anlaby Road, Hull"
      },

      191: {
        name: "Portman Road",
        address: "Portman Road, Ipswich"
      },

      193: {
        name: "Elland Road",
        address: "Elland Road, Leeds"
      },

      135: {
        name: "Anfield",
        address: "Anfield Road, Liverpool"
      },

      87: {
        name: "Etihad Stadium",
        address: "Ashton New Road, Manchester"
      },

      133: {
        name: "Old Trafford",
        address: "Sir Matt Busby Way, Manchester"
      },

      141: {
        name: "St James' Park",
        address: "Barrack Road, Newcastle upon Tyne"
      },

      182: {
        name: "The City Ground",
        address: "Pavilion Road, Nottingham"
      },

      140: {
        name: "Stadium of Light",
        address: "Millenium Way, Sunderland"
      },

      86: {
        name: "Tottenham Hotspur Stadium",
        address: "Bill Nicholson Way, London"
      }
    };

    let teamsUpdated = 0;
    let fixturesUpdated = 0;

    // ------------------------------------------
    // UPDATE TEAM COLLECTION
    // ------------------------------------------

    for (const [teamId, stadium] of Object.entries(stadiums)) {
      const result = await Team.findOneAndUpdate(
        {
          teamId: Number(teamId)
        },
        {
          stadiumName: stadium.name,
          stadiumAddress: stadium.address
        },
        {
          new: true
        }
      );

      if (result) {
        teamsUpdated++;

        console.log(
          `STADIUM UPDATED: ${result.name} → ${stadium.name}`
        );
      }
    }

    // ------------------------------------------
    // UPDATE FIXTURES USING HOME TEAM ID
    // ------------------------------------------

    const fixtures = await Fixture.find({
      homeTeamId: {
        $in: Object.keys(stadiums).map(Number)
      }
    });

    for (const fixture of fixtures) {
      const stadium = stadiums[fixture.homeTeamId];

      if (stadium) {
        await Fixture.findOneAndUpdate(
          {
            matchId: fixture.matchId
          },
          {
            venue: stadium.name,
            venueAddress: stadium.address
          }
        );

        fixturesUpdated++;
      }
    }

    res.json({
      message: "Team stadiums and fixture venues updated successfully",
      teamsUpdated: teamsUpdated,
      fixturesUpdated: fixturesUpdated
    });

  } catch (error) {
    console.error(
      "Stadium update error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to update stadiums",
      error: error.message
    });
  }
});
// ==========================================
// SYNC FIXTURE DATES & TIMES
// ==========================================
// Uses Footballdata as the single source of truth.
// Footballdata match_date values are stored explicitly as UTC.
// This prevents timezone shifts caused by parsing a timezone-less
// date string using the server's local timezone.

app.all(["/api/fixtures/sync", "/api/fixtures/sync-schedule"], async (req, res) => {
  try {
    const result = await runFullSync("manual_api");
    res.json({
      success: true,
      message: "Fixture dates and times synchronized from Footballdata successfully",
      source: "Footballdata API",
      seasonId: 103535,
      leagueId: 15,
      ...result
    });
  } catch (error) {
    console.error("Fixture schedule sync error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to synchronize fixture dates and times",
      error: error.message
    });
  }
});

app.get("/api/scheduler/status", (req, res) => {
  res.json(getSchedulerStatus());
});

app.post("/api/fixtures/backfill-goals", async (req, res) => {
  try {
    const { backfillGoalEvents } = require("./scripts/backfill_goal_events");
    const summary = await backfillGoalEvents();
    res.json({
      success: true,
      message: "Goal events backfilled successfully",
      ...summary
    });
  } catch (error) {
    console.error("Backfill goal events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to backfill goal events",
      error: error.message
    });
  }
});

// ==========================================
// UPCOMING PREMIER LEAGUE FIXTURES
// ==========================================

app.get("/api/fixtures", async (req, res) => {

  try {

    const response = await fetch(

      "https://footballdata.io/api/v1/fixtures/upcoming?league_id=15&limit=10",

      {

        headers: {

          "Authorization":
            `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,

          "Accept":
            "application/json"

        }

      }

    );


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(

        data.message ||
        "Failed to fetch upcoming fixtures"

      );

    }


    const fixtures =
      data.data?.matches ||
      [];


    // ------------------------------------------
    // SAVE UPCOMING FIXTURES
    // ------------------------------------------

    for (const match of fixtures) {

      const homeTeamName =
        match.home_team?.team_name ||
        "";


      const homeTeam =
        await Team.findOne({

          teamId:
            match.home_team?.team_id

        });


      const venueName =

        findNestedValue(

          match,

          [
            "stadium_name",
            "stadiumName"
          ]

        ) ||

        homeTeam?.stadiumName ||

        "";


      const venueAddress =

        findNestedValue(

          match,

          [
            "stadium_address",
            "stadiumAddress"
          ]

        ) ||

        homeTeam?.stadiumAddress ||

        "";


      const existingFixture = await Fixture.findOne({ matchId: match.match_id }).lean();
      const rawStatus = String(match.status_localized || match.status || "scheduled").toLowerCase();
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
        rawStatus === "in_play" ||
        rawStatus === "inplay";

      await Fixture.findOneAndUpdate(
        {
          matchId: match.match_id
        },
        {
          matchId: match.match_id,
          matchDate:
            parseFootballDataDate(match.match_date, match.date_unix) ||
            existingFixture?.matchDate ||
            match.match_date,
          status: isCompleted ? "Finished" : isLive ? "LIVE" : (existingFixture?.status || "Scheduled"),
          homeTeam: decodeHtmlEntities(homeTeam?.name || homeTeamName),
          awayTeam: decodeHtmlEntities(match.away_team?.team_name || existingFixture?.awayTeam || ""),
          homeTeamId: match.home_team?.team_id || existingFixture?.homeTeamId || null,
          awayTeamId: match.away_team?.team_id || existingFixture?.awayTeamId || null,
          homeScore: isCompleted || isLive ? (match.score?.home ?? null) : null,
          awayScore: isCompleted || isLive ? (match.score?.away ?? null) : null,
          venue: decodeHtmlEntities(venueName || existingFixture?.venue || ""),
          venueAddress: decodeHtmlEntities(venueAddress || existingFixture?.venueAddress || ""),
          gameweek:
            match.game_week != null
              ? String(match.game_week)
              : match.gameweek != null
                ? String(match.gameweek)
                : existingFixture?.gameweek ?? null
        },
        {
          upsert: true,
          new: true
        }
      );

    }


    res.json({

      message:
        "Upcoming fixtures fetched and saved successfully",

      count:
        fixtures.length

    });


  } catch (error) {

    console.error(
      "Upcoming fixture error:",
      error
    );


    res.status(500).json({

      message:
        "Failed to fetch upcoming fixtures",

      error:
        error.message

    });

  }

});


// ==========================================
// GET FIXTURES FROM MONGODB
// ==========================================

app.get("/api/fixtures/saved", async (req, res) => {

  try {

    const fixtures =
      await Fixture.find()
        .sort({

          matchDate:
            1

        });

    const teams = await Team.find().lean();
    const teamMap = {};
    for (const t of teams) {
      if (t.teamId != null) {
        teamMap[t.teamId] = t;
      }
    }

    // ------------------------------------------
    // ADD IST DATE + TIME & TEAM DETAILS
    // ------------------------------------------

    const formattedFixtures =

      fixtures.map(

        (fixture) => {

          const ist =
            formatIST(
              fixture.matchDate
            );

          const homeTeamDoc = teamMap[fixture.homeTeamId];
          const awayTeamDoc = teamMap[fixture.awayTeamId];

          const homeName = decodeHtmlEntities(fixture.homeTeam || homeTeamDoc?.name || "");
          const awayName = decodeHtmlEntities(fixture.awayTeam || awayTeamDoc?.name || "");
          const cleanVenue = decodeHtmlEntities(fixture.venue || homeTeamDoc?.stadiumName || "");
          const cleanVenueAddress = decodeHtmlEntities(fixture.venueAddress || homeTeamDoc?.stadiumAddress || "");

          return {

            ...fixture.toObject(),

            homeTeam:
              homeName,

            homeTeamName:
              homeName,

            awayTeam:
              awayName,

            awayTeamName:
              awayName,

            homeTeamLogo:
              homeTeamDoc?.logo || "",

            awayTeamLogo:
              awayTeamDoc?.logo || "",

            homeTeamShortName:
              homeTeamDoc?.shortName || "",

            awayTeamShortName:
              awayTeamDoc?.shortName || "",

            venue:
              cleanVenue,

            venueAddress:
              cleanVenueAddress,

            dateIST:
              ist.date,

            timeIST:
              ist.time

          };

        }

      );


    res.json(
      formattedFixtures
    );


  } catch (error) {

    console.error(
      "Fetch saved fixtures error:",
      error
    );


    res.status(500).json({

      message:
        "Failed to fetch saved fixtures",

      error:
        error.message

    });

  }

});

// ==========================================
// SYNC PREMIER LEAGUE STANDINGS
// ==========================================

app.get("/api/standings/sync", async (req, res) => {
  try {
    const seasonId = 103535;
    const leagueId = 15;

    const apiKey = process.env.FOOTBALLDATA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: "FOOTBALLDATA_API_KEY is missing from .env"
      });
    }

    const response = await fetch(
      `https://footballdata.io/api/v1/leagues/${leagueId}/standings?season_id=${seasonId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();
console.log("========== NEW STANDINGS CODE ==========");
console.log("DATA SUCCESS:", data?.success);
console.log("STANDINGS COUNT:", data?.data?.standings?.length);

    console.log("STANDINGS API STATUS:", response.status);
    console.log(
      "STANDINGS API RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Failed to fetch standings from Footballdata API",
        error: data
      });
    }

const standingsData =
  data?.data?.standings ||
  data?.standings ||
  [];

console.log(
  "STANDINGS COUNT:",
  Array.isArray(standingsData)
    ? standingsData.length
    : "NOT AN ARRAY"
);
    if (standingsData.length === 0) {
      return res.status(404).json({
        message: "No standings data found",
        apiResponse: data
      });
    }

    let standingsSaved = 0;

    for (const row of standingsData) {
const apiTeamId =
  row.team?.team_id ??
  row.team?.id ??
  row.team_id ??
  row.teamId;

const teamName =
  row.team?.team_name ??
  row.team?.name ??
  row.team_name ??
  row.teamName ??
  "";

      if (!apiTeamId || !teamName) {
        console.log(
          "Skipping invalid standings row:",
          row
        );
        continue;
      }

      // Get logo and short name from our Teams collection
      const team = await Team.findOne({
        teamId: Number(apiTeamId)
      });

      // Normalize form
      let form = [];

      if (Array.isArray(row.form)) {
        form = row.form.slice(-5);
      } else if (typeof row.form === "string") {
        form = row.form.split("").slice(-5);
      }

      await Standing.findOneAndUpdate(
        {
          seasonId: seasonId,
          teamId: Number(apiTeamId)
        },
        {
          seasonId: seasonId,
          leagueId: leagueId,

          position: Number(row.position || 0),

          teamId: Number(apiTeamId),
          teamName: teamName,

          shortName:
            team?.shortName ||
            row.team?.short_name ||
            "",

          logo:
            team?.logo ||
            row.team?.logo ||
            "",

played: Number(row.record?.matches_played || 0),
won: Number(row.record?.wins || 0),
drawn: Number(row.record?.draws || 0),
lost: Number(row.record?.losses || 0),

goalsFor: Number(row.goals?.for || 0),
goalsAgainst: Number(row.goals?.against || 0),
goalDifference: Number(row.goals?.difference || 0),

points: Number(row.record?.points || 0),

          form: form
        },
        {
          upsert: true,
          new: true
        }
      );

      standingsSaved++;
    }

    res.json({
      message: "Premier League standings synced successfully",
      seasonId: seasonId,
      leagueId: leagueId,
      standingsSaved: standingsSaved
    });

  } catch (error) {
    console.error("Standings sync error:", error);
    console.error("Error cause:", error.cause);

    res.status(500).json({
      message: "Failed to sync standings",
      error: error.message,
      cause: error.cause?.message || null
    });
  }
});
// ==========================================
// GET SAVED STANDINGS FROM MONGODB
// ==========================================

// ==========================================
// GET PREMIER LEAGUE STANDINGS
// overall / home / away
// ==========================================

app.get("/api/standings", async (req, res) => {
  try {
    const type = String(req.query.type || "overall").toLowerCase();

    if (!["overall", "home", "away"].includes(type)) {
      return res.status(400).json({
        message: "Invalid standings type. Use overall, home, or away."
      });
    }

    // ------------------------------------------
    // GET ALL TEAMS
    // ------------------------------------------

    const teams = await Team.find({
      teamId: {
        $exists: true,
        $ne: null
      }
    });

    // ------------------------------------------
    // GET SAVED OVERALL STANDINGS
    // ------------------------------------------

    const savedStandings = await Standing.find({
      seasonId: 103535,
      leagueId: 15
    }).sort({ position: 1 });

    // ------------------------------------------
    // OVERALL
    // ------------------------------------------

    if (type === "overall") {
      const formatted = savedStandings.map((team) => ({
        position: Number(team.position || 0),

        teamId: Number(team.teamId),
        teamName: team.teamName,
        shortName: team.shortName || "",
        logo: team.logo || "",

        played: Number(team.played || 0),
        won: Number(team.won || 0),
        drawn: Number(team.drawn || 0),
        lost: Number(team.lost || 0),

        goalsFor: Number(team.goalsFor || 0),
        goalsAgainst: Number(team.goalsAgainst || 0),
        goalDifference: Number(team.goalDifference || 0),

        points: Number(team.points || 0),

        form: Array.isArray(team.form)
          ? team.form
          : []
      }));

      return res.json(formatted);
    }

    // ------------------------------------------
    // HOME / AWAY
    // ------------------------------------------

    /*
      Home and Away tables are calculated from
      completed fixtures saved in MongoDB.

      Home:
        team is homeTeamId

      Away:
        team is awayTeamId
    */

    const now = new Date();

    const fixtures = await Fixture.find({
      matchDate: {
        $lte: now
      }
    }).sort({
      matchDate: 1
    });

    // ------------------------------------------
    // CHECK WHETHER A MATCH IS COMPLETED
    // ------------------------------------------

    const isCompletedMatch = (fixture) => {
      const status = String(
        fixture.status || ""
      ).toLowerCase();

      const completedStatuses = [
        "complete",
        "completed",
        "finished",
        "ft",
        "full time",
        "full-time",
        "ended"
      ];

      if (
        completedStatuses.some((value) =>
          status.includes(value)
        )
      ) {
        return true;
      }

      /*
        Some API responses may not have a clean
        finished status. If the match date is in
        the past and the status is not clearly
        scheduled/live/postponed/cancelled,
        we can safely treat it as completed.
      */

      const unfinishedStatuses = [
        "scheduled",
        "upcoming",
        "postponed",
        "cancelled",
        "canceled",
        "live",
        "1h",
        "2h",
        "ht",
        "half time",
        "half-time"
      ];

      if (
        unfinishedStatuses.some((value) =>
          status.includes(value)
        )
      ) {
        return false;
      }

      return (
        fixture.matchDate &&
        new Date(fixture.matchDate) <= now &&
        fixture.homeScore !== null &&
        fixture.awayScore !== null
      );
    };

    const completedFixtures =
      fixtures.filter(isCompletedMatch);

    // ------------------------------------------
    // CREATE EMPTY TABLE
    // ------------------------------------------

    const table = new Map();

    for (const team of teams) {
      const teamId = Number(team.teamId);

      if (!teamId) {
        continue;
      }

      const savedTeam = savedStandings.find(
        (row) =>
          Number(row.teamId) === teamId
      );

      table.set(teamId, {
        teamId,

        teamName:
          savedTeam?.teamName ||
          team.name ||
          "",

        shortName:
          savedTeam?.shortName ||
          team.shortName ||
          "",

        logo:
          savedTeam?.logo ||
          team.logo ||
          "",

        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,

        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,

        points: 0,

        form: [],

        originalPosition:
          Number(
            savedTeam?.position || 999
          )
      });
    }

    // ------------------------------------------
    // CALCULATE HOME / AWAY RESULTS
    // ------------------------------------------

    for (const fixture of completedFixtures) {
      const homeId = Number(
        fixture.homeTeamId
      );

      const awayId = Number(
        fixture.awayTeamId
      );

      const homeScore = Number(
        fixture.homeScore ?? 0
      );

      const awayScore = Number(
        fixture.awayScore ?? 0
      );

      if (!homeId || !awayId) {
        continue;
      }

      const homeTeam = table.get(homeId);
      const awayTeam = table.get(awayId);

      if (!homeTeam || !awayTeam) {
        continue;
      }

      // ----------------------------------------
      // HOME TABLE
      // ----------------------------------------

      if (type === "home") {
        homeTeam.played += 1;

        homeTeam.goalsFor += homeScore;
        homeTeam.goalsAgainst += awayScore;

        if (homeScore > awayScore) {
          homeTeam.won += 1;
          homeTeam.points += 3;
          homeTeam.form.push("W");
        } else if (homeScore === awayScore) {
          homeTeam.drawn += 1;
          homeTeam.points += 1;
          homeTeam.form.push("D");
        } else {
          homeTeam.lost += 1;
          homeTeam.form.push("L");
        }
      }

      // ----------------------------------------
      // AWAY TABLE
      // ----------------------------------------

      if (type === "away") {
        awayTeam.played += 1;

        awayTeam.goalsFor += awayScore;
        awayTeam.goalsAgainst += homeScore;

        if (awayScore > homeScore) {
          awayTeam.won += 1;
          awayTeam.points += 3;
          awayTeam.form.push("W");
        } else if (awayScore === homeScore) {
          awayTeam.drawn += 1;
          awayTeam.points += 1;
          awayTeam.form.push("D");
        } else {
          awayTeam.lost += 1;
          awayTeam.form.push("L");
        }
      }
    }

    // ------------------------------------------
    // CALCULATE GD + LAST 5 FORM
    // ------------------------------------------

    let result = Array.from(table.values());

    result = result.map((team) => ({
      ...team,

      goalDifference:
        team.goalsFor -
        team.goalsAgainst,

      form:
        team.form.slice(-5)
    }));

    // ------------------------------------------
    // SORT TABLE
    // ------------------------------------------

    result.sort((a, b) => {
      const pointsDiff =
        b.points - a.points;

      if (pointsDiff !== 0) {
        return pointsDiff;
      }

      const goalDifferenceDiff =
        b.goalDifference -
        a.goalDifference;

      if (goalDifferenceDiff !== 0) {
        return goalDifferenceDiff;
      }

      const goalsForDiff =
        b.goalsFor -
        a.goalsFor;

      if (goalsForDiff !== 0) {
        return goalsForDiff;
      }

      const winsDiff =
        b.won - a.won;

      if (winsDiff !== 0) {
        return winsDiff;
      }

      return (
        a.originalPosition -
        b.originalPosition
      );
    });

    // ------------------------------------------
    // ASSIGN POSITIONS
    // ------------------------------------------

    result = result.map((team, index) => ({
      ...team,
      position: index + 1
    }));

    res.json(result);

  } catch (error) {
    console.error(
      "Fetch standings error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch standings",
      error: error.message
    });
  }
});
// ==========================================
// START SERVER
// ==========================================

connectDB();

// ============================================================
// DYNAMIC TEAM PROFILE + REAL PLAYERS
// 2026/27 PREMIER LEAGUE
// ============================================================

const teamProfileCache = new Map();

const TEAM_PROFILE_CACHE_TIME = 10 * 60 * 1000;

const getFootballData = async (url) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
      Accept: "application/json"
    }
  });

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.error?.message ||
      data?.message ||
      `Footballdata request failed: ${response.status}`
    );
  }

  return data;
};

const getFirstValue = (object, keys, fallback = null) => {
  if (!object || typeof object !== "object") {
    return fallback;
  }

  for (const key of keys) {
    if (
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {
      return object[key];
    }
  }

  return fallback;
};

const getNestedValue = (object, keys, fallback = null) => {
  const direct = getFirstValue(object, keys, undefined);

  if (direct !== undefined && direct !== null && direct !== "") {
    return direct;
  }

  if (!object || typeof object !== "object") {
    return fallback;
  }

  for (const value of Object.values(object)) {
    if (value && typeof value === "object") {
      const result = getNestedValue(value, keys, undefined);

      if (
        result !== undefined &&
        result !== null &&
        result !== ""
      ) {
        return result;
      }
    }
  }

  return fallback;
};

const normalizePlayer = (rawPlayer, profile, seasonStats, teamId) => {
  const profileData =
    profile?.data?.player ??
    profile?.data ??
    profile?.player ??
    profile ??
    {};

  const rawData =
    rawPlayer?.player ??
    rawPlayer ??
    {};

  const player = {
    ...rawData,
    ...profileData
  };

  const statsContainer =
    seasonStats?.data?.stats ??
    seasonStats?.data ??
    seasonStats?.stats ??
    seasonStats ??
    {};

  const statsArray =
    Array.isArray(statsContainer)
      ? statsContainer
      : Array.isArray(statsContainer?.stats)
        ? statsContainer.stats
        : [];

  const stats =
    statsArray.find((item) => {
      const statTeamId =
        item?.team?.team_id ??
        item?.team?.id ??
        item?.team_id ??
        item?.teamId;

      const statSeasonId =
        item?.season?.season_id ??
        item?.season?.id ??
        item?.season_id ??
        item?.seasonId;

      return (
        Number(statTeamId) === Number(teamId) &&
        Number(statSeasonId) === 103535
      );
    }) ||
    statsArray.find((item) => {
      const statSeasonId =
        item?.season?.season_id ??
        item?.season?.id ??
        item?.season_id ??
        item?.seasonId;

      return Number(statSeasonId) === 103535;
    }) ||
    statsArray[0] ||
    {};

  const appearances =
    stats?.appearances?.total ??
    stats?.appearances ??
    stats?.apps ??
    stats?.matches_played ??
    0;

  const goals =
    stats?.goals?.total ??
    stats?.goals ??
    stats?.goals_scored ??
    0;

  const assists =
    stats?.assists?.total ??
    stats?.assists ??
    stats?.assists_count ??
    0;

  const minutes =
    stats?.minutes_played?.total ??
    stats?.minutes_played ??
    stats?.minutes ??
    0;

  const playerId =
    player?.player_id ??
    player?.id ??
    rawData?.player_id ??
    rawData?.id;

  const playerName =
    player?.player_name ??
    player?.name ??
    player?.display_name ??
    rawData?.player_name ??
    rawData?.name ??
    "Unknown Player";

  const nationality =
    player?.nationality ??
    player?.country ??
    player?.nationality_name ??
    "Unknown";

  const position =
    player?.position ??
    player?.position_name ??
    "Player";

  const age =
    player?.age ??
    null;

  const image =
    getNestedValue(
      profile,
      [
        "profile_image",
        "profileImage",
        "player_image",
        "playerImage",
        "image",
        "photo",
        "photo_url",
        "photoUrl",
        "picture",
        "avatar"
      ],
      ""
    ) ||
    getNestedValue(
      player,
      [
        "profile_image",
        "profileImage",
        "player_image",
        "playerImage",
        "image",
        "photo",
        "photo_url",
        "photoUrl",
        "picture",
        "avatar"
      ],
      ""
    ) ||
    "";

  return {
    id: playerId,
    playerId: playerId,
    teamId: Number(teamId),

    name: playerName,
    nationality,
    position,
    age,

    image,

    appearances: Number(appearances || 0),
    goals: Number(goals || 0),
    assists: Number(assists || 0),
    minutes: Number(minutes || 0)
  };
};


// ============================================================
// HELPERS FOR PLAYER + MATCH API RESPONSES
// ============================================================

const extractPlayerArray = (response) => {
  const candidates = [
    response?.data?.players,
    response?.data,
    response?.players
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate;
    }
  }

  const walk = (value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      const players = value.filter((item) => {
        return (
          item?.player_id != null ||
          item?.id != null ||
          item?.player?.player_id != null ||
          item?.player?.id != null
        );
      });

      if (players.length) {
        return players;
      }

      for (const item of value) {
        const nested = walk(item);

        if (nested.length) {
          return nested;
        }
      }

      return [];
    }

    if (typeof value === "object") {
      for (const child of Object.values(value)) {
        const nested = walk(child);

        if (nested.length) {
          return nested;
        }
      }
    }

    return [];
  };

  return walk(response);
};


const extractMatchArray = (response) => {
  const candidates = [
    response?.data?.matches,
    response?.data?.fixtures,
    response?.matches,
    response?.fixtures,
    response?.data
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate;
    }
  }

  const walk = (value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      const matches = value.filter((item) => {
        return (
          item?.match_id != null ||
          item?.fixture_id != null ||
          item?.home_team != null ||
          item?.away_team != null
        );
      });

      if (matches.length) {
        return matches;
      }

      for (const item of value) {
        const nested = walk(item);

        if (nested.length) {
          return nested;
        }
      }

      return [];
    }

    if (typeof value === "object") {
      for (const child of Object.values(value)) {
        const nested = walk(child);

        if (nested.length) {
          return nested;
        }
      }
    }

    return [];
  };

  return walk(response);
};


// ============================================================
// GET TEAM PLAYERS
// ============================================================

const getPlayerRoster = async (
  teamId,
  seasonId,
  leagueId
) => {
  const urls = [
    `https://footballdata.io/api/v1/teams/${teamId}/players?season_id=${seasonId}&league_id=${leagueId}&page=1&limit=100`,

    `https://footballdata.io/api/v1/teams/${teamId}/players?season_id=${seasonId}&page=1&limit=100`,

    `https://footballdata.io/api/v1/teams/${teamId}/players?page=1&limit=100`,

    `https://footballdata.io/api/v1/players?team_id=${teamId}&season_id=${seasonId}&league_id=${leagueId}&page=1&limit=100`,

    `https://footballdata.io/api/v1/players?team_id=${teamId}&league_id=${leagueId}&page=1&limit=100`,

    `https://footballdata.io/api/v1/players?team_id=${teamId}&page=1&limit=100`
  ];

  for (const url of urls) {
    try {
      const response = await getFootballData(url);

      const players =
        extractPlayerArray(response);

      console.log(
        `PLAYER ROSTER: ${url} -> ${players.length}`
      );

      if (players.length > 0) {
        return players;
      }

    } catch (error) {
      console.warn(
        `Player roster failed: ${url}`,
        error.message
      );
    }
  }

  return [];
};


// ============================================================
// NORMALIZE MATCH
// Handles MongoDB + Footballdata API matches
// ============================================================

const normalizeTeamMatch = (match) => {
  if (!match) {
    return null;
  }

  // ----------------------------------------------------------
  // HOME TEAM
  // ----------------------------------------------------------

  const homeTeamObject =
    match?.home_team &&
    typeof match.home_team === "object"
      ? match.home_team
      : (
          match?.homeTeam &&
          typeof match.homeTeam === "object"
            ? match.homeTeam
            : {}
        );

  // ----------------------------------------------------------
  // AWAY TEAM
  // ----------------------------------------------------------

  const awayTeamObject =
    match?.away_team &&
    typeof match.away_team === "object"
      ? match.away_team
      : (
          match?.awayTeam &&
          typeof match.awayTeam === "object"
            ? match.awayTeam
            : {}
        );

  // ----------------------------------------------------------
  // TEAM IDs
  // ----------------------------------------------------------

  const homeTeamId =
    homeTeamObject?.team_id ??
    homeTeamObject?.id ??
    match?.home_team_id ??
    match?.homeTeamId ??
    null;

  const awayTeamId =
    awayTeamObject?.team_id ??
    awayTeamObject?.id ??
    match?.away_team_id ??
    match?.awayTeamId ??
    null;

  // ----------------------------------------------------------
  // TEAM NAMES
  // ----------------------------------------------------------

  const homeTeamName =
    homeTeamObject?.team_name ??
    homeTeamObject?.name ??
    (
      typeof match?.homeTeam === "string"
        ? match.homeTeam
        : null
    ) ??
    match?.home_team_name ??
    match?.homeTeamName ??
    "";

  const awayTeamName =
    awayTeamObject?.team_name ??
    awayTeamObject?.name ??
    (
      typeof match?.awayTeam === "string"
        ? match.awayTeam
        : null
    ) ??
    match?.away_team_name ??
    match?.awayTeamName ??
    "";

  // ----------------------------------------------------------
  // TEAM LOGOS
  // ----------------------------------------------------------

  const homeTeamLogo =
    homeTeamObject?.team_logo ??
    homeTeamObject?.logo ??
    homeTeamObject?.logo_url ??
    match?.home_team_logo ??
    match?.homeTeamLogo ??
    "";

  const awayTeamLogo =
    awayTeamObject?.team_logo ??
    awayTeamObject?.logo ??
    awayTeamObject?.logo_url ??
    match?.away_team_logo ??
    match?.awayTeamLogo ??
    "";

  // ----------------------------------------------------------
  // SCORE
  // ----------------------------------------------------------

  const score =
    match?.score ??
    match?.scores ??
    {};

  const rawHomeScore =
    score?.home ??
    score?.home_score ??
    match?.home_score ??
    match?.homeScore ??
    null;

  const rawAwayScore =
    score?.away ??
    score?.away_score ??
    match?.away_score ??
    match?.awayScore ??
    null;

  const homeScore =
    rawHomeScore !== null &&
    rawHomeScore !== undefined &&
    rawHomeScore !== ""
      ? Number(rawHomeScore)
      : null;


  const awayScore =
    rawAwayScore !== null &&
    rawAwayScore !== undefined &&
    rawAwayScore !== ""
      ? Number(rawAwayScore)
      : null;

  // ----------------------------------------------------------
  // DATE
  // ----------------------------------------------------------

  const rawMatchDate =
    match?.match_date ??
    match?.matchDate ??
    match?.date ??
    match?.fixture_date ??
    null;

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  const rawStatus =
    match?.status_localized ??
    match?.status ??
    match?.fixture_status ??
    "scheduled";

  const status =
    String(rawStatus || "")
      .toLowerCase()
      .trim();

  // ----------------------------------------------------------
  // MATCH ID
  // ----------------------------------------------------------

  const matchId =
    match?.matchId ??
    match?.match_id ??
    match?.fixture_id ??
    match?.fixtureId ??
    match?.id ??
    null;

  // ----------------------------------------------------------
  // DATE CHECK
  // ----------------------------------------------------------

  const dateObject =
    parseFootballDataDate(
      rawMatchDate,
      match?.date_unix
    );

  const validDate =
    dateObject &&
    !Number.isNaN(
      dateObject.getTime()
    );

  const matchDate =
    validDate
      ? dateObject.toISOString()
      : rawMatchDate;

  const now = new Date();

  // ----------------------------------------------------------
  // SCORE CHECK
  // ----------------------------------------------------------

  const hasScore =
    homeScore !== null &&
    awayScore !== null &&
    Number.isFinite(homeScore) &&
    Number.isFinite(awayScore);

  // ----------------------------------------------------------
  // COMPLETED / UPCOMING
  // ----------------------------------------------------------

  const finishedStatuses = [
    "finished",
    "complete",
    "completed",
    "ft",
    "ended",
    "full time",
    "full-time"
  ];

  const liveStatuses = [
    "live",
    "1h",
    "2h",
    "ht",
    "half time",
    "half-time",
    "in_play",
    "inplay"
  ];

  const unfinishedStatuses = [
    "scheduled",
    "upcoming",
    "not started",
    "pending",
    "postponed",
    "cancelled",
    "canceled",
    ...liveStatuses
  ];

  const statusIsLive =
    liveStatuses.some(
      (value) =>
        status === value || status.includes(value)
    );

  const statusIsFinished =
    !status.includes("incomplete") &&
    finishedStatuses.some(
      (value) =>
        status.includes(value)
    );

  const statusIsUnfinished =
    unfinishedStatuses.some(
      (value) =>
        status.includes(value)
    );

  const isCompleted =
    hasScore &&
    (
      statusIsFinished ||
      (
        validDate &&
        dateObject <= now &&
        !statusIsUnfinished
      )
    );

  const isUpcoming =
    !isCompleted && !statusIsLive;

  const finalHomeScore = (isCompleted || statusIsLive) ? homeScore : null;
  const finalAwayScore = (isCompleted || statusIsLive) ? awayScore : null;

  // ----------------------------------------------------------
  // RESULT
  // ----------------------------------------------------------

  let result = null;

  if (isCompleted && finalHomeScore !== null && finalAwayScore !== null) {
    if (
      finalHomeScore >
      finalAwayScore
    ) {
      result = "HOME_WIN";
    } else if (
      finalHomeScore ===
      finalAwayScore
    ) {
      result = "DRAW";
    } else {
      result = "AWAY_WIN";
    }
  }

  // ----------------------------------------------------------
  // VENUE
  // ----------------------------------------------------------

  const venue = decodeHtmlEntities(
    findNestedValue(
      match,
      [
        "stadium_name",
        "stadiumName",
        "venue",
        "stadium"
      ]
    ) || ""
  );

  // ----------------------------------------------------------
  // GAMEWEEK
  // ----------------------------------------------------------

  const gameweek =
    match?.game_week ??
    match?.gameweek ??
    match?.gameWeek ??
    match?.game_week_number ??
    null;

  // ----------------------------------------------------------
  // FINAL NORMALIZED MATCH
  // ----------------------------------------------------------

  const ist = formatIST(dateObject || matchDate);
  const cleanHomeName = decodeHtmlEntities(homeTeamName);
  const cleanAwayName = decodeHtmlEntities(awayTeamName);

  return {
    id: matchId,

    matchId,

    date: matchDate,

    matchDate,

    dateIST: ist.date,

    timeIST: ist.time,

    status: isCompleted ? "Finished" : statusIsLive ? "LIVE" : rawStatus,

    rawStatus:
      rawStatus,

    homeTeamId:
      homeTeamId !== null
        ? Number(homeTeamId)
        : null,

    awayTeamId:
      awayTeamId !== null
        ? Number(awayTeamId)
        : null,

    homeTeamName: cleanHomeName,

    awayTeamName: cleanAwayName,

    homeTeam:
      cleanHomeName,

    awayTeam:
      cleanAwayName,

    homeTeamLogo,

    awayTeamLogo,

    homeLogo:
      homeTeamLogo,

    awayLogo:
      awayTeamLogo,

    homeScore: finalHomeScore,

    awayScore: finalAwayScore,

    venue,

    gameweek,

    result,

    isCompleted,

    isLive: statusIsLive,

    isUpcoming
  };
};
const getTeamMatches = async (
  teamId,
  seasonId,
  leagueId
) => {

  const primaryUrls = [

    `https://footballdata.io/api/v1/teams/${teamId}/matches?season_id=${seasonId}&league_id=${leagueId}&page=1&limit=100`,

    `https://footballdata.io/api/v1/matches?team_id=${teamId}&season_id=${seasonId}&league_id=${leagueId}&page=1&limit=100`

  ];


  for (const url of primaryUrls) {

    try {

      const response =
        await getFootballData(url);

      const matches =
        extractMatchArray(response);

      console.log(
        `TEAM MATCHES: ${url} -> ${matches.length}`
      );

      if (matches.length > 0) {
        return matches;
      }

    } catch (error) {

      console.warn(
        `Team matches failed: ${url}`,
        error.message
      );

    }
  }


  // FALLBACK:
  // Recent results + upcoming fixtures

  const resultsPromise =
    getFootballData(
      `https://footballdata.io/api/v1/fixtures/results?team_id=${teamId}&league_id=${leagueId}&season_id=${seasonId}&page=1&limit=100`
    ).catch(() => null);


  const upcomingPromise =
    getFootballData(
      `https://footballdata.io/api/v1/fixtures/upcoming?team_id=${teamId}&league_id=${leagueId}&season_id=${seasonId}&page=1&limit=100`
    ).catch(() => null);


  const [
    resultsResponse,
    upcomingResponse
  ] = await Promise.all([
    resultsPromise,
    upcomingPromise
  ]);


  const results =
    resultsResponse
      ? extractMatchArray(resultsResponse)
      : [];


  const upcoming =
    upcomingResponse
      ? extractMatchArray(upcomingResponse)
      : [];


  return [
    ...results,
    ...upcoming
  ];
};



// ============================================================
// DYNAMIC TEAM PROFILE
// WORKS FOR ALL 20 PREMIER LEAGUE TEAMS
// ============================================================

app.get(
  "/api/teams/:teamKey/profile",
  async (req, res) => {
    try {
      const teamKey = String(
        req.params.teamKey || ""
      ).trim();

      let teamId = Number(teamKey);

      // ------------------------------------------------------
      // FIND TEAM BY SLUG / NAME
      // ------------------------------------------------------

      if (!Number.isFinite(teamId) || teamId <= 0) {
        const teams = await Team.find({
          teamId: {
            $exists: true,
            $ne: null
          }
        }).lean();

        const normalize = (value) =>
          String(value || "")
            .toLowerCase()
            .trim()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const aliases = {
          arsenal: ["arsenal"],
          "aston-villa": ["aston-villa"],
          bournemouth: [
            "bournemouth",
            "afc-bournemouth"
          ],
          brentford: ["brentford"],
          brighton: [
            "brighton",
            "brighton-and-hove-albion"
          ],
          chelsea: ["chelsea"],
          coventry: [
            "coventry",
            "coventry-city"
          ],
          "crystal-palace": [
            "crystal-palace"
          ],
          everton: ["everton"],
          fulham: ["fulham"],
          hull: [
            "hull",
            "hull-city"
          ],
          "hull-city": [
            "hull",
            "hull-city"
          ],
          ipswich: [
            "ipswich",
            "ipswich-town"
          ],
          leeds: [
            "leeds",
            "leeds-united"
          ],
          liverpool: ["liverpool"],
          "man-city": [
            "man-city",
            "manchester-city"
          ],
          "manchester-city": [
            "man-city",
            "manchester-city"
          ],
          "man-utd": [
            "man-utd",
            "manchester-united"
          ],
          "manchester-united": [
            "man-utd",
            "manchester-united"
          ],
          newcastle: [
            "newcastle",
            "newcastle-united"
          ],
          "nottingham-forest": [
            "nottingham-forest",
            "nottm-forest"
          ],
          "nottm-forest": [
            "nottingham-forest",
            "nottm-forest"
          ],
          sunderland: ["sunderland"],
          tottenham: [
            "tottenham",
            "tottenham-hotspur",
            "spurs"
          ],
          "tottenham-hotspur": [
            "tottenham",
            "tottenham-hotspur",
            "spurs"
          ]
        };

        const normalizedKey =
          normalize(teamKey);

        const possibleKeys =
          aliases[normalizedKey] ||
          [normalizedKey];

        const foundTeam = teams.find(
          (team) => {
            const teamKeys = [
              normalize(team.name),
              normalize(team.shortName),
              normalize(team.slug)
            ];

            return possibleKeys.some(
              (key) =>
                teamKeys.some(
                  (teamKeyValue) =>
                    teamKeyValue === key ||
                    teamKeyValue.includes(key)
                )
            );
          }
        );

        if (!foundTeam?.teamId) {
          return res.status(404).json({
            message:
              `Team "${teamKey}" not found`
          });
        }

        teamId = Number(
          foundTeam.teamId
        );
      }

      const seasonId = 103535;
      const leagueId = 15;

      // ------------------------------------------------------
      // GET DATA
      // ------------------------------------------------------

      const [
        teamApi,
        playersArray,
        statsApi,
        mongoTeam,
        mongoStanding,
        fixtures,
        teamApiMatches
      ] = await Promise.all([
        getFootballData(
          `https://footballdata.io/api/v1/teams/${teamId}`
        ),

        getPlayerRoster(
          teamId,
          seasonId,
          leagueId
        ),

        getFootballData(
          `https://footballdata.io/api/v1/teams/${teamId}/stats?season_id=${seasonId}&league_id=${leagueId}`
        ),

        Team.findOne({
          teamId
        }).lean(),

        Standing.findOne({
          seasonId,
          teamId
        }).lean(),

        Fixture.find({
          $or: [
            {
              homeTeamId: teamId
            },
            {
              awayTeamId: teamId
            }
          ]
        })
          .sort({
            matchDate: 1
          })
          .lean(),

        getTeamMatches(
          teamId,
          seasonId,
          leagueId
        )
      ]);

      // ------------------------------------------------------
      // TEAM INFORMATION
      // ------------------------------------------------------

      const rawTeam =
        teamApi?.data?.team ||
        teamApi?.data ||
        teamApi?.team ||
        {};

      const teamData =
        rawTeam?.team ||
        rawTeam;

      const standing =
        mongoStanding || {};

      const teamName =
        teamData?.team_name ??
        teamData?.name ??
        mongoTeam?.name ??
        "Unknown Team";

      const shortName =
        teamData?.short_name ??
        teamData?.shortName ??
        mongoTeam?.shortName ??
        teamName;

      const logo =
        teamData?.team_logo ??
        teamData?.logo ??
        teamData?.logo_url ??
        mongoTeam?.logo ??
        "";

      const stadium =
        teamData?.stadium_name ??
        teamData?.stadium ??
        mongoTeam?.stadiumName ??
        "Stadium information unavailable";

      const founded =
        teamData?.founded ??
        mongoTeam?.founded ??
        null;

      // ------------------------------------------------------
      // TEAM STATS
      // ------------------------------------------------------

      const rawStats =
        statsApi?.data?.stats ??
        statsApi?.data ??
        statsApi?.stats ??
        {};

      const avgPossession =
        getNestedValue(
          rawStats,
          [
            "possession",
            "possession_percentage",
            "average_possession"
          ],
          null
        );

      const passAccuracy =
        getNestedValue(
          rawStats,
          [
            "pass_accuracy",
            "passing_accuracy",
            "passes_accuracy"
          ],
          null
        );

      const cleanSheets =
        getNestedValue(
          rawStats,
          [
            "clean_sheets",
            "cleanSheets"
          ],
          0
        );

      // ------------------------------------------------------
      // PLAYERS
      // ------------------------------------------------------

      console.log(
        "======================================"
      );

      console.log(
        "TEAM PROFILE:",
        teamName
      );

      console.log(
        "TEAM ID:",
        teamId
      );

      console.log(
        "PLAYERS FOUND:",
        playersArray.length
      );

      console.log(
        "======================================"
      );

      const uniquePlayers = [];
      const seenPlayerIds = new Set();

      for (const rawPlayer of playersArray) {
        const playerId =
          rawPlayer?.player_id ??
          rawPlayer?.id ??
          rawPlayer?.player?.player_id ??
          rawPlayer?.player?.id;

        if (!playerId) {
          continue;
        }

        const numericId =
          Number(playerId);

        if (
          seenPlayerIds.has(numericId)
        ) {
          continue;
        }

        seenPlayerIds.add(numericId);

        uniquePlayers.push(
          rawPlayer
        );
      }

      let dbPlayers = await Player.find({ teamId }).lean();

      let players = [];
      if (dbPlayers && dbPlayers.length > 0) {
        players = dbPlayers.map((p) => ({
          id: p.playerId,
          playerId: p.playerId,
          name: p.name || p.knownName,
          knownName: p.knownName || p.name,
          position: p.position || "Player",
          shirtNumber: p.shirtNumber ?? null,
          squadNumber: p.shirtNumber ?? null,
          nationality: p.nationality || "",
          age: p.age ?? null,
          image: p.image || "",
          appearances: p.appearances ?? null,
          goals: p.goals ?? null,
          assists: p.assists ?? null,
          minutes: p.minutes ?? null,
          cleanSheets: p.cleanSheets ?? null
        }));
      } else {
        players = uniquePlayers.map((p) => {
          const pid = p?.player_id ?? p?.id;
          return {
            id: pid,
            playerId: pid,
            name: p?.player_name ?? p?.name ?? "Player",
            knownName: p?.known_name ?? p?.player_name ?? p?.name ?? "Player",
            position: p?.position_name ?? p?.position ?? "Player",
            shirtNumber: p?.shirt_number ?? null,
            squadNumber: p?.shirt_number ?? null,
            nationality: p?.nationality ?? "",
            image: p?.player_image ?? "",
            appearances: null,
            goals: null,
            assists: null,
            minutes: null,
            cleanSheets: null
          };
        });
      }

      // ------------------------------------------------------
      // MATCHES
      // ------------------------------------------------------

      const mongoMatches =
        Array.isArray(fixtures)
          ? fixtures.map(
              (fixture) =>
                normalizeTeamMatch(
                  fixture
                )
            )
          : [];

      const apiMatches =
        Array.isArray(teamApiMatches)
          ? teamApiMatches.map(
              (match) =>
                normalizeTeamMatch(
                  match
                )
            )
          : [];

      // ------------------------------------------------------
      // MERGE MATCHES
      // ------------------------------------------------------

      const matchMap = new Map();

      for (
        const match of [
          ...mongoMatches,
          ...apiMatches
        ]
      ) {
        const matchDate =
          match.date || null;

        const key =
          match.matchId ||
          `${match.homeTeamId}-${match.awayTeamId}-${matchDate}`;

        if (!matchMap.has(key)) {
          matchMap.set(
            key,
            match
          );
        } else {
          const existing = matchMap.get(key);
          // Prefer completed or live status/scores from API if MongoDB record was still Scheduled
          const merged = {
            ...existing,
            status: (match.isCompleted || match.isLive) && !existing.isCompleted ? match.status : existing.status,
            homeScore: (match.isCompleted || match.isLive) && existing.homeScore === null ? match.homeScore : existing.homeScore,
            awayScore: (match.isCompleted || match.isLive) && existing.awayScore === null ? match.awayScore : existing.awayScore,
            result: match.isCompleted && !existing.result ? match.result : existing.result,
            isCompleted: Boolean(existing.isCompleted || match.isCompleted),
            isLive: Boolean(existing.isLive || match.isLive),
            isUpcoming: !Boolean(existing.isCompleted || match.isCompleted || existing.isLive || match.isLive),
            homeTeamLogo: existing.homeTeamLogo || match.homeTeamLogo || "",
            awayTeamLogo: existing.awayTeamLogo || match.awayTeamLogo || "",
            homeLogo: existing.homeLogo || match.homeLogo || "",
            awayLogo: existing.awayLogo || match.awayLogo || "",
            venue: existing.venue || match.venue || "",
            gameweek: existing.gameweek ?? match.gameweek ?? null
          };
          matchMap.set(key, merged);
        }
      }

      const normalizedFixtures =
        Array.from(
          matchMap.values()
        );

      // ------------------------------------------------------
      // CLASSIFY MATCHES BY COMPLETION STATUS AND DATE
      // ------------------------------------------------------

      const now = new Date();

      const recentMatches =
        normalizedFixtures
          .filter((match) => {
            if (!match.date) {
              return false;
            }
            return Boolean(match.isCompleted);
          })
          .sort(
            (a, b) =>
              new Date(b.date) -
              new Date(a.date)
          )
          .slice(0, 5);

      const upcomingMatches =
        normalizedFixtures
          .filter((match) => {
            if (!match.date) {
              return false;
            }
            return !match.isCompleted;
          })
          .sort(
            (a, b) =>
              new Date(a.date) -
              new Date(b.date)
          )
          .slice(0, 5);

      // ------------------------------------------------------
      // FINAL RESPONSE
      // ------------------------------------------------------

      const result = {
        success: true,

        seasonId,
        leagueId,

        team: {
          id: teamId,
          teamId,

          name: decodeHtmlEntities(teamName),
          shortName: decodeHtmlEntities(shortName),
          logo,

          stadium: decodeHtmlEntities(stadium),

          stadiumAddress: decodeHtmlEntities(
            teamData?.stadium_address ??
            teamData?.stadiumAddress ??
            mongoTeam?.stadiumAddress ??
            ""
          ),

          founded,

          position: Number(
            standing?.position ?? 0
          ),

          played: Number(
            standing?.played ??
            standing?.matchesPlayed ??
            standing?.matches_played ??
            0
          ),

          won: Number(
            standing?.won ??
            standing?.wins ??
            0
          ),

          drawn: Number(
            standing?.drawn ??
            standing?.draws ??
            0
          ),

          lost: Number(
            standing?.lost ??
            standing?.losses ??
            0
          ),

          goalsFor: Number(
            standing?.goalsFor ??
            standing?.goals_for ??
            0
          ),

          goalsAgainst: Number(
            standing?.goalsAgainst ??
            standing?.goals_against ??
            0
          ),

          goalDifference: Number(
            standing?.goalDifference ??
            standing?.goal_difference ??
            0
          ),

          points: Number(
            standing?.points ?? 0
          ),

          form:
            Array.isArray(
              standing?.form
            )
              ? standing.form.slice(-5)
              : []
        },

        stats: {
          avgPossession,
          passAccuracy,
          cleanSheets:
            Number(cleanSheets || 0)
        },

        players,

        matches:
          normalizedFixtures,

        recentMatches,

        upcomingMatches
      };

      console.log(
        `PROFILE READY: ${teamName} | Players: ${players.length} | Recent: ${recentMatches.length} | Upcoming: ${upcomingMatches.length}`
      );

      res.json(result);

    } catch (error) {
      console.error(
        "Dynamic team profile error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load dynamic team profile",

        error:
          error.message
      });
    }
  }
);
// ============================================================
// GET SINGLE MATCH DETAILS
// ============================================================

app.get("/api/matches/:matchId", async (req, res) => {
  try {
    const matchId = String(req.params.matchId || "").trim();
    const numericMatchId = Number(matchId);

    if (!matchId || Number.isNaN(numericMatchId) || !Number.isFinite(numericMatchId)) {
      return res.status(404).json({
        message: "Match not found",
        matchId: matchId
      });
    }

    console.log(`MATCH DETAILS REQUEST: ${numericMatchId}`);

    // ----------------------------------------------------------
    // FIRST: CHECK OUR MONGODB FIXTURE
    // ----------------------------------------------------------

    const fixture = await Fixture.findOne({
      matchId: numericMatchId
    }).lean();

    // ----------------------------------------------------------
    // FETCH FULL MATCH FROM FOOTBALLDATA
    // ----------------------------------------------------------

    let apiMatch = null;

    try {
      const response = await fetch(
        `https://footballdata.io/api/v1/matches/${matchId}`,
        {
          headers: {
            Authorization:
              `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
            Accept: "application/json"
          }
        }
      );

      const data = await response.json();

      if (response.ok && data?.success !== false) {
        apiMatch =
          data?.data?.match ??
          data?.data ??
          data?.match ??
          null;
      }

    } catch (apiError) {
      console.warn(
        `FootballData match request failed for ${matchId}:`,
        apiError.message
      );
    }

    // ----------------------------------------------------------
    // MATCH NOT FOUND ANYWHERE
    // ----------------------------------------------------------

    if (!fixture && !apiMatch) {
      return res.status(404).json({
        message: "Match not found",
        matchId: matchId
      });
    }

    // ----------------------------------------------------------
    // NORMALIZE DATA
    // ----------------------------------------------------------

    const source = apiMatch || fixture;

    const homeTeam =
      source?.home_team ??
      source?.homeTeam ??
      {};

    const awayTeam =
      source?.away_team ??
      source?.awayTeam ??
      {};

    const score =
      source?.score ??
      source?.scores ??
      {};

    const apiStatusStr = String(
      apiMatch?.status_localized ||
      apiMatch?.status ||
      ""
    ).toLowerCase();

    const dbStatusStr = String(
      fixture?.status ||
      ""
    ).toLowerCase();

    const checkFinished = (str) =>
      str.includes("finish") ||
      (str.includes("complete") && !str.includes("incomplete")) ||
      str === "ft" ||
      str.includes("full time") ||
      str.includes("full_time");

    const checkLive = (str) =>
      str.includes("live") ||
      str.includes("in_play") ||
      str.includes("inplay") ||
      str === "1h" ||
      str === "2h" ||
      str === "ht" ||
      str.includes("half time");

    const isMatchFinished = checkFinished(apiStatusStr) || checkFinished(dbStatusStr);
    const isMatchLive = !isMatchFinished && (checkLive(apiStatusStr) || checkLive(dbStatusStr));
    const isPlayedOrLive = isMatchFinished || isMatchLive;

    const resolvedStatus = isMatchFinished
      ? "Finished"
      : isMatchLive
        ? "LIVE"
        : (fixture?.status ?? source?.status_localized ?? source?.status ?? "Scheduled");

    const resolvedHomeScore = isPlayedOrLive
      ? (score?.home ??
         score?.home_score ??
         source?.home_score ??
         fixture?.homeScore ??
         source?.homeScore ??
         null)
      : null;

    const resolvedAwayScore = isPlayedOrLive
      ? (score?.away ??
         score?.away_score ??
         source?.away_score ??
         fixture?.awayScore ??
         source?.awayScore ??
         null)
      : null;

    const parsedMatchDate = parseFootballDataDate(
      apiMatch?.match_date ??
      source?.match_date ??
      source?.matchDate ??
      source?.date ??
      fixture?.matchDate ??
      null,
      apiMatch?.date_unix ?? source?.date_unix ?? null
    );

    if (fixture) {
      const dbUpdates = {};
      if (
        apiMatch &&
        parsedMatchDate &&
        (!fixture.matchDate || new Date(fixture.matchDate).getTime() !== parsedMatchDate.getTime())
      ) {
        dbUpdates.matchDate = parsedMatchDate;
        fixture.matchDate = parsedMatchDate;
      }
      if (isPlayedOrLive && (fixture.status !== resolvedStatus || fixture.homeScore !== resolvedHomeScore || fixture.awayScore !== resolvedAwayScore)) {
        dbUpdates.status = resolvedStatus;
        dbUpdates.homeScore = resolvedHomeScore !== null ? Number(resolvedHomeScore) : null;
        dbUpdates.awayScore = resolvedAwayScore !== null ? Number(resolvedAwayScore) : null;
      }
      if (Object.keys(dbUpdates).length > 0) {
        await Fixture.updateOne(
          { matchId: numericMatchId },
          { $set: dbUpdates }
        );
      }
    }

    const ist = formatIST(parsedMatchDate);
    const normalizedIsoDate = parsedMatchDate
      ? parsedMatchDate.toISOString()
      : (fixture?.matchDate ?? null);

    const result = {
      success: true,

      match: {
        id:
          source?.match_id ??
          source?.id ??
          fixture?.matchId ??
          numericMatchId,

        matchId:
          source?.match_id ??
          source?.id ??
          fixture?.matchId ??
          numericMatchId,

        date: normalizedIsoDate,

        matchDate: normalizedIsoDate,

        dateIST: ist.date,

        timeIST: ist.time,

        time: ist.time,

        status: resolvedStatus,

        rawStatus:
          source?.status ??
          source?.status_localized ??
          fixture?.status ??
          "scheduled",

        homeTeamId:
          homeTeam?.team_id ??
          homeTeam?.id ??
          source?.home_team_id ??
          source?.homeTeamId ??
          fixture?.homeTeamId ??
          null,

        awayTeamId:
          awayTeam?.team_id ??
          awayTeam?.id ??
          source?.away_team_id ??
          source?.awayTeamId ??
          fixture?.awayTeamId ??
          null,

        homeTeamName: decodeHtmlEntities(
          homeTeam?.team_name ??
          homeTeam?.name ??
          source?.home_team_name ??
          (typeof source?.homeTeam === "string"
            ? source.homeTeam
            : null) ??
          fixture?.homeTeam ??
          ""
        ),

        awayTeamName: decodeHtmlEntities(
          awayTeam?.team_name ??
          awayTeam?.name ??
          source?.away_team_name ??
          (typeof source?.awayTeam === "string"
            ? source.awayTeam
            : null) ??
          fixture?.awayTeam ??
          ""
        ),

        homeTeamLogo:
          homeTeam?.team_logo ??
          homeTeam?.logo ??
          source?.home_team_logo ??
          fixture?.homeLogo ??
          "",

        awayTeamLogo:
          awayTeam?.team_logo ??
          awayTeam?.logo ??
          source?.away_team_logo ??
          fixture?.awayLogo ??
          "",

        homeScore: resolvedHomeScore !== null ? Number(resolvedHomeScore) : null,

        awayScore: resolvedAwayScore !== null ? Number(resolvedAwayScore) : null,

        venue: decodeHtmlEntities(
          findNestedValue(
            source,
            [
              "stadium_name",
              "stadiumName",
              "venue"
            ]
          ) ||
          fixture?.venue ||
          ""
        ),

        venueAddress: decodeHtmlEntities(
          findNestedValue(
            source,
            [
              "stadium_address",
              "stadiumAddress",
              "venueAddress"
            ]
          ) ||
          fixture?.venueAddress ||
          ""
        ),

        gameweek:
          source?.game_week ??
          source?.gameweek ??
          fixture?.gameweek ??
          null
      },

      // Keep the raw API response available
      // for the match-details page.
      apiMatch: apiMatch,

      fixture: fixture
    };

    // Attach authentic goal events / timeline
    let goalEvents = fixture?.goalEvents || [];
    if (
      goalEvents.length === 0 &&
      (Number(result.match.homeScore || 0) + Number(result.match.awayScore || 0) > 0)
    ) {
      try {
        const { fetchGoalEventsForMatch } = require("./scripts/backfill_goal_events");
        goalEvents = await fetchGoalEventsForMatch(
          numericMatchId,
          result.match.homeScore,
          result.match.awayScore,
          result.match.homeTeamName,
          result.match.awayTeamName
        );
        if (goalEvents.length > 0) {
          await Fixture.updateOne({ matchId: numericMatchId }, { $set: { goalEvents } });
        }
      } catch (e) {
        console.warn(`Could not fallback fetch goal events for ${matchId}:`, e.message);
      }
    }

    result.match.timeline = goalEvents;
    result.match.goalEvents = goalEvents;
    result.timeline = goalEvents;
    result.goalEvents = goalEvents;

    console.log(
      `MATCH DETAILS FOUND: ${result.match.homeTeamName} vs ${result.match.awayTeamName} (${goalEvents.length} goal events)`
    );

    res.json(result);

  } catch (error) {
    console.error(
      "Match details error:",
      error
    );

    res.status(500).json({
      message: "Failed to load match details",
      error: error.message
    });
  }
});


// ============================================================
// GET MATCH STATISTICS
// ============================================================

app.get("/api/matches/:matchId/stats", async (req, res) => {
  try {
    const matchId = String(req.params.matchId || "").trim();

    if (!matchId) {
      return res.status(400).json({
        message: "Match ID is required"
      });
    }

    console.log(
      `MATCH STATS REQUEST: ${matchId}`
    );

    const response = await fetch(
      `https://footballdata.io/api/v1/matches/${matchId}/stats`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.FOOTBALLDATA_API_KEY}`,
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok || data?.success === false) {
      return res.status(response.status || 500).json({
        message:
          data?.message ||
          "Failed to fetch match statistics",
        error: data
      });
    }

    res.json({
      success: true,
      matchId: matchId,
      stats:
        data?.data?.stats ??
        data?.data ??
        data?.stats ??
        data
    });

  } catch (error) {
    console.error(
      "Match stats error:",
      error
    );

    res.status(500).json({
      message: "Failed to load match statistics",
      error: error.message
    });
  }
});
// ============================================================
// MATCH LINEUPS
// FOOTBALLDATA.IO
// ============================================================

app.get("/api/matches/:matchId/lineups", async (req, res) => {
  try {
    const matchId = String(req.params.matchId || "").trim();

    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: "Invalid match ID"
      });
    }

    console.log(
      "MATCH LINEUPS REQUEST:",
      matchId
    );

    // --------------------------------------------------------
    // 1. GET FULL MATCH DETAILS
    // --------------------------------------------------------

    let matchResponse = null;

    try {
      matchResponse = await getFootballData(
        `https://footballdata.io/api/v1/matches/${matchId}`
      );
    } catch (error) {
      console.warn(
        "Match details lineup request failed:",
        error.message
      );
    }

    // --------------------------------------------------------
    // 2. GET MATCH EVENTS
    // --------------------------------------------------------

    let eventsResponse = null;

    try {
      eventsResponse = await getFootballData(
        `https://footballdata.io/api/v1/matches/${matchId}/events`
      );
    } catch (error) {
      console.warn(
        "Match events lineup request failed:",
        error.message
      );
    }

    // --------------------------------------------------------
    // EXTRACT MATCH
    // --------------------------------------------------------

    const match =
      matchResponse?.data?.match ||
      matchResponse?.match ||
      matchResponse?.data ||
      {};

    // --------------------------------------------------------
    // FIND POSSIBLE LINEUP CONTAINERS
    // --------------------------------------------------------

    const candidates = [
      match?.lineups,
      match?.lineup,
      match?.line_up,
      match?.teams,
      matchResponse?.data?.lineups,
      matchResponse?.data?.lineup,
      matchResponse?.lineups,
      eventsResponse?.data?.lineups,
      eventsResponse?.data?.lineup,
      eventsResponse?.lineups,
      eventsResponse?.lineup,
      eventsResponse?.data?.events,
      eventsResponse?.events
    ];

    let lineupSource = null;

    for (const candidate of candidates) {
      if (
        candidate &&
        typeof candidate === "object"
      ) {
        lineupSource = candidate;
        break;
      }
    }

    // --------------------------------------------------------
    // TEAM IDS
    // --------------------------------------------------------

    const homeTeamId =
      match?.home_team?.team_id ??
      match?.home_team?.id ??
      match?.homeTeam?.teamId ??
      match?.homeTeam?.id ??
      null;

    const awayTeamId =
      match?.away_team?.team_id ??
      match?.away_team?.id ??
      match?.awayTeam?.teamId ??
      match?.awayTeam?.id ??
      null;

    const homeTeamName =
      match?.home_team?.team_name ??
      match?.home_team?.name ??
      match?.homeTeam?.name ??
      "Home Team";

    const awayTeamName =
      match?.away_team?.team_name ??
      match?.away_team?.name ??
      match?.awayTeam?.name ??
      "Away Team";

    // --------------------------------------------------------
    // NORMALIZE LINEUP FOR ONE TEAM
    // --------------------------------------------------------

    const normalizePlayers = (
      players
    ) => {
      if (!players) {
        return [];
      }

      if (
        !Array.isArray(players) &&
        typeof players === "object"
      ) {
        players =
          players.players ||
          players.data ||
          players.lineup ||
          players.starting_xi ||
          players.startingXI ||
          Object.values(players);
      }

      if (!Array.isArray(players)) {
        return [];
      }

      return players
        .map((item) => {
          const player =
            item?.player ||
            item;

          return {
            id:
              player?.player_id ??
              player?.playerId ??
              player?.id ??
              item?.player_id ??
              item?.playerId ??
              item?.id ??
              null,

            playerId:
              player?.player_id ??
              player?.playerId ??
              player?.id ??
              item?.player_id ??
              item?.playerId ??
              item?.id ??
              null,

            name:
              player?.player_name ??
              player?.name ??
              player?.full_name ??
              player?.fullName ??
              item?.player_name ??
              item?.name ??
              "Unknown Player",

            number:
              player?.number ??
              player?.shirt_number ??
              player?.shirtNumber ??
              item?.number ??
              item?.shirt_number ??
              null,

            position:
              player?.position ??
              player?.position_name ??
              player?.pos ??
              item?.position ??
              "",

            image:
              player?.player_image ??
              player?.image ??
              item?.player_image ??
              item?.image ??
              "",

            starter:
              item?.starter ??
              item?.starting ??
              player?.starter ??
              false
          };
        })
        .filter(
          (player) =>
            player.name &&
            player.name !==
              "Unknown Player"
        );
    };

    // --------------------------------------------------------
    // NORMALIZE TEAM LINEUP
    // --------------------------------------------------------

    const normalizeLineup = (
      teamType,
      teamId,
      teamName
    ) => {
      let starters = match?.lineups?.[teamType];
      let subs = match?.bench?.[teamType];

      if (!starters || !Array.isArray(starters)) {
        starters =
          lineupSource?.[teamType]?.startingXI ||
          lineupSource?.[teamType]?.starters ||
          (Array.isArray(lineupSource?.[teamType]) ? lineupSource[teamType] : []);
      }

      if (!subs || !Array.isArray(subs)) {
        subs =
          lineupSource?.[teamType]?.substitutes ||
          lineupSource?.[teamType]?.bench ||
          [];
      }

      const teamInfo = teamType === "home" ? match?.home_team : match?.away_team;

      return {
        teamId,
        teamName,
        formation:
          teamInfo?.formation ||
          match?.formation?.[teamType] ||
          "",
        manager:
          teamInfo?.manager?.name ||
          teamInfo?.manager ||
          teamInfo?.coach?.name ||
          teamInfo?.coach ||
          "",
        startingXI: normalizePlayers(starters),
        substitutes: normalizePlayers(subs)
      };
    };

    const homeLineup =
      normalizeLineup(
        "home",
        homeTeamId,
        homeTeamName
      );

    const awayLineup =
      normalizeLineup(
        "away",
        awayTeamId,
        awayTeamName
      );

    // --------------------------------------------------------
    // EXTRA FALLBACK:
    // SEARCH EVENT ARRAY FOR LINEUP OBJECTS
    // --------------------------------------------------------

    const eventArray =
      Array.isArray(
        eventsResponse?.data?.events
      )
        ? eventsResponse.data.events
        : Array.isArray(
              eventsResponse?.events
            )
          ? eventsResponse.events
          : Array.isArray(
                eventsResponse?.data
              )
            ? eventsResponse.data
            : [];

    if (
      eventArray.length > 0 &&
      homeLineup.startingXI.length === 0 &&
      awayLineup.startingXI.length === 0
    ) {
      console.log(
        "LINEUP EVENT ARRAY FOUND:",
        eventArray.length
      );

      const possibleLineups =
        eventArray.filter(
          (event) => {
            const type =
              String(
                event?.type ||
                event?.event_type ||
                event?.event ||
                ""
              ).toLowerCase();

            return (
              type.includes("lineup") ||
              type.includes("substitute") ||
              type.includes("bench")
            );
          }
        );

      console.log(
        "POSSIBLE LINEUP EVENTS:",
        possibleLineups.length
      );
    }

    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log(
      "HOME LINEUP PLAYERS:",
      homeLineup.startingXI.length
    );

    console.log(
      "AWAY LINEUP PLAYERS:",
      awayLineup.startingXI.length
    );

    console.log(
      "HOME SUBSTITUTES:",
      homeLineup.substitutes.length
    );

    console.log(
      "AWAY SUBSTITUTES:",
      awayLineup.substitutes.length
    );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.json({
      success: true,

      matchId,

      home: homeLineup,

      away: awayLineup,

      available:
        homeLineup.startingXI.length > 0 ||
        awayLineup.startingXI.length > 0 ||
        homeLineup.substitutes.length > 0 ||
        awayLineup.substitutes.length > 0
    });

  } catch (error) {

    console.error(
      "MATCH LINEUPS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load match lineups",
      error:
        error.message
    });
  }
});

// ============================================================
// PLAYERS DIRECTORY & PROFILES
// ============================================================

app.get("/api/players", async (req, res) => {
  try {
    const { teamId, position, search } = req.query;

    const filter = {};

    if (teamId && teamId !== "ALL") {
      filter.teamId = Number(teamId);
    }

    if (position && position !== "ALL") {
      filter.position = new RegExp(`^${position}`, "i");
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { knownName: { $regex: q, $options: "i" } },
        { teamName: { $regex: q, $options: "i" } },
        { nationality: { $regex: q, $options: "i" } }
      ];
    }

    const players = await Player.find(filter).sort({ name: 1 }).lean();

    const formatted = players.map((p) => ({
      id: p.playerId,
      playerId: p.playerId,
      teamId: p.teamId,
      teamName: p.teamName,
      name: p.name,
      knownName: p.knownName || p.name,
      position: p.position || "Player",
      shirtNumber: p.shirtNumber ?? null,
      squadNumber: p.shirtNumber ?? null,
      nationality: p.nationality || "",
      age: p.age ?? null,
      image: p.image || "",
      appearances: p.appearances ?? null,
      goals: p.goals ?? null,
      assists: p.assists ?? null,
      minutes: p.minutes ?? null,
      cleanSheets: p.cleanSheets ?? null
    }));

    res.json(formatted);
  } catch (error) {
    console.error("GET /api/players error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load players",
      error: error.message
    });
  }
});

app.get("/api/players/:id", async (req, res) => {
  try {
    const idParam = String(req.params.id || "").trim();

    let player = null;
    const numericId = Number(idParam);

    if (Number.isFinite(numericId) && numericId > 0) {
      player = await Player.findOne({ playerId: numericId }).lean();
    }

    if (!player && mongoose.Types.ObjectId.isValid(idParam)) {
      player = await Player.findById(idParam).lean();
    }

    if (!player) {
      player = await Player.findOne({
        name: { $regex: new RegExp(idParam.replace(/-/g, " "), "i") }
      }).lean();
    }

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      });
    }

    const team = await Team.findOne({ teamId: player.teamId }).lean();

    res.json({
      success: true,
      player: {
        id: player.playerId,
        playerId: player.playerId,
        teamId: player.teamId,
        teamName: player.teamName || team?.name || "",
        teamLogo: team?.logo || "",
        name: player.name,
        knownName: player.knownName || player.name,
        position: player.position || "Player",
        shirtNumber: player.shirtNumber ?? null,
        squadNumber: player.shirtNumber ?? null,
        nationality: player.nationality || "",
        age: player.age ?? null,
        image: player.image || "",
        appearances: player.appearances ?? null,
        goals: player.goals ?? null,
        assists: player.assists ?? null,
        minutes: player.minutes ?? null,
        cleanSheets: player.cleanSheets ?? null
      },
      team: team || null
    });
  } catch (error) {
    console.error("GET /api/players/:id error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load player",
      error: error.message
    });
  }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
    initScheduler();
  }
);

