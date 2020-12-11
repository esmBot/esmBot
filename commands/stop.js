const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.stop(message);
};

exports.aliases = ["disconnect"];
exports.category = 7;
exports.help = "Stops the music";
exports.requires = "sound";