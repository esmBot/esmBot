const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return soundPlayer.play("./assets/audio/bruh.ogg", message);
};

exports.aliases = ["bro"];
exports.category = 6;
exports.help = "Plays the \"bruh\" sound effect";