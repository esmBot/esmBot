const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/boat.opus", message);
};

exports.aliases = ["tape", "flextape", "phil", "philswift"];
