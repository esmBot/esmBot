const soundPlayer = require("../utils/soundplayer.js");

exports.run = async (message) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can reload Lavalink!`;
  const soundStatus = await soundPlayer.checkStatus();
  if (!soundStatus) {
    const length = await soundPlayer.connect();
    return `Successfully connected to ${length} Lavalink node(s).`;
  } else {
    return `${message.author.mention}, I couldn't connect to any Lavalink nodes!`;
  }
};

exports.aliases = ["lava", "lavalink", "lavaconnect", "soundconnect"];
exports.category = 8;
exports.help = "Attempts to reconnect to all available Lavalink nodes";