const soundPlayer = require("../../utils/soundplayer.js");
const Command = require("../../classes/command.js");

class SoundReloadCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    if (this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, only the bot owner can reload Lavalink!`;
    const soundStatus = await soundPlayer.checkStatus();
    if (!soundStatus) {
      const length = await soundPlayer.connect();
      return `Successfully connected to ${length} Lavalink node(s).`;
    } else {
      return `${this.message.author.mention}, I couldn't connect to any Lavalink nodes!`;
    }
  }

  static description = "Attempts to reconnect to all available Lavalink nodes";
  static aliases = ["lava", "lavalink", "lavaconnect", "soundconnect"];
}

module.exports = SoundReloadCommand;