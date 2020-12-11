const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  return await soundPlayer.queue(message);
};

exports.aliases = ["q"];
exports.category = 7;
exports.help = "Shows the current queue";
exports.requires = "sound";