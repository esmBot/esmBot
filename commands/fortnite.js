const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/fortnite.opus", message);
};

exports.aliases = ["dance", "defaultdance"];
exports.category = 6;
exports.help = "Plays the Fortnite default dance sound";