const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/oof.opus", message);
};

exports.aliases = ["roblox", "commitdie"];
exports.category = 6;
exports.help = "Plays the Roblox \"oof\" sound";