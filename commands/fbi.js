const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return soundPlayer.play("./assets/audio/fbi.ogg", message);
};

exports.aliases = ["openup"];
exports.category = 6;
exports.help = "Plays the \"FBI OPEN UP\" sound effect";