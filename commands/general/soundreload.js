const soundPlayer = require("../../utils/soundplayer");
const Command = require("../../classes/command");

class SoundReloadCommand extends Command {
  async run() {
    if (this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, only the bot owner can reload Lavalink!`;
    const soundStatus = await soundPlayer.checkStatus();
    if (!soundStatus) {
      const length = await soundPlayer.connect(this.client);
      return `Successfully connected to ${length} Lavalink node(s).`;
    } else {
      return `${this.message.author.mention}, I couldn't connect to any Lavalink nodes!`;
    }
  }

  static description = "Attempts to reconnect to all available Lavalink nodes";
  static aliases = ["lava", "lavalink", "lavaconnect", "soundconnect"];
}

module.exports = SoundReloadCommand;