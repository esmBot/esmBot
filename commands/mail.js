const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/mail.opus", message);
};

exports.aliases = ["yougotmail", "youvegotmail", "aol"];
exports.category = 6;
exports.help = "Plays the \"You've got mail\" sound effect";