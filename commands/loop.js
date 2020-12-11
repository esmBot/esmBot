const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.loop(message);
};

exports.aliases = ["toggleloop", "repeat"];
exports.category = 7;
exports.help = "Loops the music";
exports.requires = "sound";