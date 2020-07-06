const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.play("./assets/audio/winxp.ogg", message);
};

exports.aliases = ["windows", "xp"];
exports.category = 6;
exports.help = "Plays the Windows XP startup sound";
exports.requires = "sound";