const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/prunejuice.opus", message);
};

exports.aliases = ["juice", "grandma"];