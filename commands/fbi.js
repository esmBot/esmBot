const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/fbi.opus", message);
};

exports.aliases = ["openup"];
