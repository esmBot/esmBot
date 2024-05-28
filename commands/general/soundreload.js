import Command from "../../classes/command.js";
import { reload } from "../../utils/soundplayer.js";

class SoundReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return "Only the bot owner can reload Lavalink!";
    }
    await this.acknowledge();
    const length = await reload(this.client);
    if (process.env.PM2_USAGE) {
      process.send?.({
        type: "process:msg",
        data: {
          type: "soundreload"
        }
      });
    }
    if (length) {
      return `Successfully connected to ${length} Lavalink node(s).`;
    } else {
      return "I couldn't connect to any Lavalink nodes!";
    }
  }

  static description = "Attempts to reconnect to all available Lavalink nodes";
  static aliases = ["lava", "lavalink", "lavaconnect", "soundconnect"];
  static adminOnly = true;
}

export default SoundReloadCommand;