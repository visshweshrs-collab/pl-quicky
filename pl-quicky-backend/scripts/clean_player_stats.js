const path = require("path");
const backendPath = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(backendPath, ".env") });
const mongoose = require("mongoose");
const Player = require("../models/Player");

async function executeSafeCleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Pre-verification check on the two non-zero 4/360 players
  const preservedBefore = await Player.find({
    playerId: { $in: [33084, 9391] }
  }).lean();
  console.log("Preserved players BEFORE cleanup:", preservedBefore.map(p => ({
    id: p.playerId,
    name: p.name,
    app: p.appearances,
    min: p.minutes,
    g: p.goals,
    a: p.assists
  })));

  // Group 1 cleanup: { appearances: 3, minutes: 270, goals: 0, assists: 0 }
  const result1 = await Player.updateMany(
    { appearances: 3, minutes: 270, goals: 0, assists: 0 },
    {
      $set: {
        appearances: null,
        goals: null,
        assists: null,
        minutes: null,
        cleanSheets: null
      }
    }
  );

  // Group 2 cleanup: { appearances: 4, minutes: 360, goals: 0, assists: 0 }
  const result2 = await Player.updateMany(
    { appearances: 4, minutes: 360, goals: 0, assists: 0 },
    {
      $set: {
        appearances: null,
        goals: null,
        assists: null,
        minutes: null,
        cleanSheets: null
      }
    }
  );

  const totalModified = result1.modifiedCount + result2.modifiedCount;
  console.log(`\nRecords modified in Group 1 (3/270/0/0): ${result1.modifiedCount}`);
  console.log(`Records modified in Group 2 (4/360/0/0): ${result2.modifiedCount}`);
  console.log(`Total records modified: ${totalModified}`);

  // Post-cleanup verification queries
  const remainingGroup1 = await Player.countDocuments({
    appearances: 3,
    minutes: 270,
    goals: 0,
    assists: 0
  });

  const remainingGroup2 = await Player.countDocuments({
    appearances: 4,
    minutes: 360,
    goals: 0,
    assists: 0
  });

  const nonNullPlayersCount = await Player.countDocuments({
    appearances: { $ne: null }
  });

  const preservedAfter = await Player.find({
    playerId: { $in: [33084, 9391] }
  }).lean();

  console.log("\n=== VERIFICATION RESULTS ===");
  console.log(`Remaining 3/270/0/0 records: ${remainingGroup1}`);
  console.log(`Remaining 4/360/0/0 records: ${remainingGroup2}`);
  console.log(`Number of players with non-null statistics: ${nonNullPlayersCount}`);
  console.log("Confirmation of 2 non-zero 4/360 players AFTER cleanup:", preservedAfter.map(p => ({
    id: p.playerId,
    name: p.name,
    app: p.appearances,
    min: p.minutes,
    g: p.goals,
    a: p.assists
  })));

  await mongoose.disconnect();
}

executeSafeCleanup().catch(console.error);
