const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/bus.opus", message);
};

exports.aliases = ["noyelling", "busyell"];
exports.category = 6;
exports.help = "Plays the \"no yelling on the bus\" sound effect";