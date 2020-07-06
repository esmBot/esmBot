const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.play("./assets/audio/bruh.ogg", message);
};

exports.aliases = ["bro"];
exports.category = 6;
exports.help = "Plays the \"bruh\" sound effect";
exports.requires = "sound";