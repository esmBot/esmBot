const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/bruh.opus", message);
};

exports.aliases = ["bro"];
exports.category = 6;
exports.help = "Plays the \"bruh\" sound effect";