const playSound = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return playSound("./assets/audio/ping.opus", message);
};

exports.aliases = ["notification", "notif"];
