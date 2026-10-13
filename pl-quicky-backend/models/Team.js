const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({

  // Football Data API team ID
  teamId: {
    type: Number,
    required: true,
    unique: true
  },

  // Full team name
  name: {
    type: String,
    required: true
  },

  // Short/display name
  shortName: {
    type: String,
    required: true
  },

  // Team logo URL
  logo: {
    type: String,
    default: ""
  },

  // Home stadium
  stadiumName: {
    type: String,
    default: ""
  },

  // Stadium address
  stadiumAddress: {
    type: String,
    default: ""
  }

});

const Team = mongoose.model(
  "Team",
  teamSchema
);

module.exports = Team;