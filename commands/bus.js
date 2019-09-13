const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/bus.opus", message);
};

exports.aliases = ["noyelling", "busyell"];
