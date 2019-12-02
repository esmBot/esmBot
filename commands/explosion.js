const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/explosion.opus", message);
};

exports.category = 6;
exports.help = "Plays an explosion sound effect";