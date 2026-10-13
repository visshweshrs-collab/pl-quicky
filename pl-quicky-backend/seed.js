require("dotenv").config();

const connectDB = require("./config/db");
const Team = require("./models/Team");

const teams = [
  { name: "Arsenal", shortName: "ARS" },
  { name: "Aston Villa", shortName: "AVL" },
  { name: "AFC Bournemouth", shortName: "BOU" },
  { name: "Brentford", shortName: "BRE" },
  { name: "Brighton & Hove Albion", shortName: "BHA" },
  { name: "Burnley", shortName: "BUR" },
  { name: "Chelsea", shortName: "CHE" },
  { name: "Crystal Palace", shortName: "CRY" },
  { name: "Everton", shortName: "EVE" },
  { name: "Fulham", shortName: "FUL" },
  { name: "Leeds United", shortName: "LEE" },
  { name: "Liverpool", shortName: "LIV" },
  { name: "Manchester City", shortName: "MCI" },
  { name: "Manchester United", shortName: "MUN" },
  { name: "Newcastle United", shortName: "NEW" },
  { name: "Nottingham Forest", shortName: "NFO" },
  { name: "Sunderland", shortName: "SUN" },
  { name: "Tottenham Hotspur", shortName: "TOT" },
  { name: "West Ham United", shortName: "WHU" },
  { name: "Wolverhampton Wanderers", shortName: "WOL" }
];

const seedTeams = async () => {
  try {
    await connectDB();

    await Team.deleteMany();
    await Team.insertMany(teams);

    console.log("20 teams inserted successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedTeams();