const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.play("./assets/audio/oof.ogg", message);
};

exports.aliases = ["roblox", "commitdie"];
exports.category = 6;
exports.help = "Plays the Roblox \"oof\" sound";
exports.requires = "sound";