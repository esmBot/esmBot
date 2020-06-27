const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, this command is for testing and is restricted to owners.`;
  return soundPlayer.play(encodeURIComponent(args.join(" ")), message);
};

exports.category = 7;
exports.help = "Plays an audio file";
exports.requires = "sound";