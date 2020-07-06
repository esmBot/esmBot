const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.play("./assets/audio/ping.ogg", message);
};

exports.aliases = ["notification", "notif"];
exports.category = 6;
exports.help = "Plays a Discord ping sound effect";
exports.requires = "sound";