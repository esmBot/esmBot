const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/prunejuice.opus", message);
};

exports.aliases = ["juice", "grandma"];
exports.category = 6;
exports.help = "Plays the \"Drink yo prune juice\" sound effect";