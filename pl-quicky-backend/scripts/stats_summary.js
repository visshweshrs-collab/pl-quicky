const path = require("path");
const backendPath = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(backendPath, ".env") });
const mongoose = require("mongoose");
const Player = require("../models/Player");

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Player.countDocuments();
  console.log(`Total players: ${total}`);

  const groups = await Player.aggregate([
    {
      $group: {
        _id: { app: "$appearances", min: "$minutes", g: "$goals", a: "$assists" },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  console.log("Distinct combinations:\n", groups);

  const groupA = await Player.countDocuments({
    appearances: 3,
    minutes: 270,
    goals: 0,
    assists: 0
  });
  console.log(`\nExact Group A (app: 3, min: 270, goals: 0, assists: 0): ${groupA}`);

  const groupB = await Player.find({
    appearances: 4,
    minutes: 360
  }).lean();
  console.log(`\nExact Group B (app: 4, min: 360): ${groupB.length}`);
  console.log(groupB.map(p => ({
    playerId: p.playerId,
    name: p.name,
    teamId: p.teamId,
    teamName: p.teamName,
    app: p.appearances,
    min: p.minutes,
    g: p.goals,
    a: p.assists,
    createdAt: p.createdAt
  })));

  await mongoose.disconnect();
}

check().catch(console.error);
