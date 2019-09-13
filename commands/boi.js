const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/boi.opus", message);
};

exports.aliases = ["boy", "neutron", "hugh"];
