const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    playerId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },

    teamId: {
      type: Number,
      required: true,
      index: true
    },

    teamName: {
      type: String,
      default: ""
    },

    name: {
      type: String,
      required: true
    },

    knownName: {
      type: String,
      default: ""
    },

    position: {
      type: String,
      default: "Player"
    },

    shirtNumber: {
      type: Number,
      default: null
    },

    nationality: {
      type: String,
      default: ""
    },

    age: {
      type: Number,
      default: null
    },

    image: {
      type: String,
      default: ""
    },

    appearances: {
      type: Number,
      default: null
    },

    goals: {
      type: Number,
      default: null
    },

    assists: {
      type: Number,
      default: null
    },

    minutes: {
      type: Number,
      default: null
    },

    cleanSheets: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

playerSchema.index({ teamId: 1, name: 1 });

const Player = mongoose.model("Player", playerSchema);

module.exports = Player;
