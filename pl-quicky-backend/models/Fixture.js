const mongoose = require("mongoose");

const fixtureSchema = new mongoose.Schema({

  // Football Data API match ID
  matchId: {
    type: Number,
    required: true,
    unique: true
  },

  // Original kickoff date/time
  // MongoDB stores this as a Date
  matchDate: {
    type: Date,
    required: true
  },

  // Match status
  status: {
    type: String,
    required: true
  },

  // Home team
  homeTeam: {
    type: String,
    required: true
  },

  // Away team
  awayTeam: {
    type: String,
    required: true
  },

  // API team IDs
  homeTeamId: {
    type: Number,
    default: null
  },

  awayTeamId: {
    type: Number,
    default: null
  },

  // Scores
  homeScore: {
    type: Number,
    default: null
  },

  awayScore: {
    type: Number,
    default: null
  },

  // Stadium
  venue: {
    type: String,
    default: ""
  },

  // Stadium address
  venueAddress: {
    type: String,
    default: ""
  },

  // Gameweek / round
  gameweek: {
    type: String,
    default: null
  },

  // Goal events / timeline
  goalEvents: [
    {
      minute: { type: Number, required: true },
      extraMinute: { type: Number, default: null },
      displayMinute: { type: String, required: true },
      teamSide: { type: String, enum: ["home", "away"], required: true },
      teamId: { type: Number, default: null },
      teamName: { type: String, default: "" },
      playerId: { type: Number, default: null },
      playerName: { type: String, required: true },
      // Display name from the players endpoint (e.g. "Bukayo Saka"); falls back to playerName
      knownName: { type: String, default: "" },
      eventType: { type: String, default: "goal" },
      detail: { type: String, default: "" },
      isOwnGoal: { type: Boolean, default: false }
    }
  ]

});

const Fixture = mongoose.model(
  "Fixture",
  fixtureSchema
);

module.exports = Fixture;