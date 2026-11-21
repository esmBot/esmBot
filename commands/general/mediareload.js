import Command from "#cmd-classes/command.js";
import { sendIPCMessage } from "#utils/ipc.js";
import { reloadMediaConnections } from "#utils/media.js";
import { getEnv } from "#utils/runtime.js";

class MediaReloadCommand extends Command {
  async run() {
    const owners = getEnv("OWNER")?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.mediareload.owner");
    }
    await this.acknowledge();
    const length = await reloadMediaConnections();
    if (length) {
      sendIPCMessage("mediareload");
      return this.getString("commands.responses.mediareload.connected", { params: { length: length.toString() } });
    }
    return this.getString("commands.responses.mediareload.couldNotConnect");
  }

  static description = "Attempts to reconnect to all available media processing servers";
  static adminOnly = true;
  static aliases = ["imagereload"];
}

export default MediaReloadCommand;
