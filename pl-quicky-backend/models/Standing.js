const mongoose = require("mongoose");

const standingSchema = new mongoose.Schema(
  {
    seasonId: {
      type: Number,
      required: true
    },

    leagueId: {
      type: Number,
      required: true
    },

    position: {
      type: Number,
      required: true
    },

    teamId: {
      type: Number,
      required: true
    },

    teamName: {
      type: String,
      required: true
    },

    shortName: {
      type: String,
      default: ""
    },

    logo: {
      type: String,
      default: ""
    },

    played: {
      type: Number,
      default: 0
    },

    won: {
      type: Number,
      default: 0
    },

    drawn: {
      type: Number,
      default: 0
    },

    lost: {
      type: Number,
      default: 0
    },

    goalsFor: {
      type: Number,
      default: 0
    },

    goalsAgainst: {
      type: Number,
      default: 0
    },

    goalDifference: {
      type: Number,
      default: 0
    },

    points: {
      type: Number,
      default: 0
    },

    form: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

standingSchema.index(
  { seasonId: 1, teamId: 1 },
  { unique: true }
);

const Standing = mongoose.model("Standing", standingSchema);

module.exports = Standing;