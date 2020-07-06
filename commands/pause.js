const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  soundPlayer.pause(message);
};

exports.aliases = ["resume"];
exports.category = 7;
exports.help = "Pauses/resumes the current song";
exports.requires = "sound";