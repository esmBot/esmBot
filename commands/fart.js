const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/fart.opus", message);
};

exports.aliases = ["toot"];
