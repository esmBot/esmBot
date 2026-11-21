import Command from "#cmd-classes/command.js";
import { sendIPCMessage } from "#utils/ipc.js";
import { getEnv } from "#utils/runtime.js";
import { reload } from "#utils/soundplayer.js";

class SoundReloadCommand extends Command {
  async run() {
    const owners = getEnv("OWNER")?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.soundreload.botOwnerOnly");
    }
    await this.acknowledge();
    const length = await reload(this.client);
    sendIPCMessage("soundreload");
    if (length) {
      return this.getString("commands.responses.soundreload.connected", { params: { length: length.toString() } });
    }
    return this.getString("commands.responses.soundreload.failed");
  }

  static description = "Attempts to reconnect to all available Lavalink nodes";
  static aliases = ["lava", "lavalink", "lavaconnect", "soundconnect"];
  static adminOnly = true;
}

export default SoundReloadCommand;
