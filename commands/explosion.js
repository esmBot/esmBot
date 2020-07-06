const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.play("./assets/audio/explosion.ogg", message);
};

exports.category = 6;
exports.help = "Plays an explosion sound effect";
exports.requires = "sound";