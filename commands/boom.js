const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.play("./assets/audio/boom.ogg", message);
};

exports.aliases = ["thud", "vine"];
exports.category = 6;
exports.help = "Plays the Vine boom sound effect";
exports.requires = "sound";