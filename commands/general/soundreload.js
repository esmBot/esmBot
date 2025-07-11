import process from "node:process";
import Command from "#cmd-classes/command.js";
import { reload } from "#utils/soundplayer.js";

class SoundReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.soundreload.botOwnerOnly");
    }
    await this.acknowledge();
    const length = await reload(this.client);
    if (process.env.PM2_USAGE) {
      process.send?.({
        type: "process:msg",
        data: {
          type: "soundreload",
          from: process.env.pm_id,
        },
      });
    }
    if (length) {
      return this.getString("commands.responses.soundreload.failed", { params: { length: length.toString() } });
    }
    return this.getString("commands.responses.soundreload.failed");
  }

  static description = "Attempts to reconnect to all available Lavalink nodes";
  static aliases = ["lava", "lavalink", "lavaconnect", "soundconnect"];
  static adminOnly = true;
}

export default SoundReloadCommand;
