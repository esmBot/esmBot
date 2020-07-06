const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  soundPlayer.skip(message);
};

exports.category = 7;
exports.help = "Skips the current song";
exports.requires = "sound";