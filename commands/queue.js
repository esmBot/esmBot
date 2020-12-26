const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  if (process.env.NODE_ENV === "production") return "Music commands are coming soon, but they aren't ready yet. Stay tuned to @esmBot_ on Twitter for updates!";
  return await soundPlayer.queue(message);
};

exports.aliases = ["q"];
exports.category = 7;
exports.help = "Shows the current queue";
exports.requires = "sound";