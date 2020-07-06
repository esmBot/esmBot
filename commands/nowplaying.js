const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  soundPlayer.playing(message);
};

exports.aliases = ["playing", "np"];
exports.category = 7;
exports.help = "Shows the currently playing song";
exports.requires = "sound";