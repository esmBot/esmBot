const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.play("./assets/audio/mail.ogg", message);
};

exports.aliases = ["yougotmail", "youvegotmail", "aol"];
exports.category = 6;
exports.help = "Plays the \"You've got mail\" sound effect";
exports.requires = "sound";