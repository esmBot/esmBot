const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message, args) => {
  if (!args[0]) return `${message.author.mention}, you need to provide what you want to play!`;
  soundPlayer.play(encodeURIComponent(args.join(" ").trim()), message, true);
};

exports.aliases = ["p"];
exports.category = 7;
exports.help = "Plays a song or adds it to the queue";
exports.requires = "sound";
exports.params = "[url]";