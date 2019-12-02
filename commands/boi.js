const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/boi.opus", message);
};

exports.aliases = ["boy", "neutron", "hugh"];
exports.category = 6;
exports.help = "Plays the \"boi\" sound effect";