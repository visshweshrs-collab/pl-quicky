const path = require("path");
const backendPath = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(backendPath, ".env") });
const mongoose = require("mongoose");
const Player = require("../models/Player");

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for READ-ONLY inspection.\n");

  const total = await Player.countDocuments();
  console.log(`TOTAL PLAYERS IN DB: ${total}`);

  // 1. Group by stats combinations
  const statsGroups = await Player.aggregate([
    {
      $group: {
        _id: {
          app: "$appearances",
          min: "$minutes",
          goals: "$goals",
          assists: "$assists",
          cleanSheets: "$cleanSheets"
        },
        count: { $sum: 1 },
        samplePlayers: {
          $push: {
            playerId: "$playerId",
            name: "$name",
            teamName: "$teamName",
            createdAt: "$createdAt"
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  console.log("\n=== ALL DISTINCT STATS COMBINATIONS IN DB ===");
  for (const g of statsGroups) {
    console.log(`\nCombination: appearances=${g._id.app}, minutes=${g._id.min}, goals=${g._id.goals}, assists=${g._id.assists}, cleanSheets=${g._id.cleanSheets}`);
    console.log(`Count: ${g.count}`);
    console.log("Samples:", g.samplePlayers.slice(0, 3));
  }

  // 2. Inspect Group A: app: 3, min: 270, goals: 0, assists: 0
  const groupA = await Player.find({
    appearances: 3,
    minutes: 270,
    goals: 0,
    assists: 0
  }).lean();
  console.log(`\n=== GROUP A: { appearances: 3, minutes: 270, goals: 0, assists: 0 } ===`);
  console.log(`Total matching Group A: ${groupA.length}`);
  console.log("First 10 records:");
  console.log(groupA.slice(0, 10).map(p => ({
    playerId: p.playerId,
    name: p.name,
    teamId: p.teamId,
    teamName: p.teamName,
    appearances: p.appearances,
    minutes: p.minutes,
    goals: p.goals,
    assists: p.assists,
    createdAt: p.createdAt
  })));

  // 3. Inspect Group B: app: 4, min: 360
  const groupB = await Player.find({
    appearances: 4,
    minutes: 360
  }).lean();
  console.log(`\n=== GROUP B: { appearances: 4, minutes: 360 } ===`);
  console.log(`Total matching Group B: ${groupB.length}`);
  console.log("All records in Group B:");
  console.log(groupB.map(p => ({
    playerId: p.playerId,
    name: p.name,
    teamId: p.teamId,
    teamName: p.teamName,
    appearances: p.appearances,
    minutes: p.minutes,
    goals: p.goals,
    assists: p.assists,
    createdAt: p.createdAt
  })));

  // 4. Inspect any OTHER players with appearances === 4 but minutes !== 360
  const groupBOther = await Player.find({
    appearances: 4,
    minutes: { $ne: 360 }
  }).lean();
  console.log(`\n=== GROUP B-OTHER: { appearances: 4, minutes != 360 } ===`);
  console.log(`Total: ${groupBOther.length}`);
  console.log(groupBOther.map(p => ({
    playerId: p.playerId,
    name: p.name,
    teamId: p.teamId,
    teamName: p.teamName,
    appearances: p.appearances,
    minutes: p.minutes,
    goals: p.goals,
    assists: p.assists,
    createdAt: p.createdAt
  })));

  // 5. Inspect players with stats NEITHER (3, 270) nor (4, 360)
  const realOrOther = await Player.find({
    $nor: [
      { appearances: 3, minutes: 270, goals: 0, assists: 0 },
      { appearances: 4, minutes: 360 }
    ]
  }).lean();
  console.log(`\n=== OTHER PLAYERS (NOT in Group A or B) ===`);
  console.log(`Total: ${realOrOther.length}`);
  console.log(realOrOther.slice(0, 10).map(p => ({
    playerId: p.playerId,
    name: p.name,
    teamId: p.teamId,
    teamName: p.teamName,
    appearances: p.appearances,
    minutes: p.minutes,
    goals: p.goals,
    assists: p.assists,
    createdAt: p.createdAt
  })));

  await mongoose.disconnect();
}

inspect().catch(console.error);
