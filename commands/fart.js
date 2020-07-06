const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.play("./assets/audio/fart.ogg", message);
};

exports.aliases = ["toot"];
exports.category = 6;
exports.help = "Plays a fart sound effect";
exports.requires = "sound";