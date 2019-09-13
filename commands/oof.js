const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/oof.opus", message);
};

exports.aliases = ["roblox", "commitdie"];