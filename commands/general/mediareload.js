import process from "node:process";
import Command from "#cmd-classes/command.js";
import { reloadMediaConnections } from "#utils/media.js";

class MediaReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.mediareload.owner");
    }
    await this.acknowledge();
    const length = await reloadMediaConnections();
    if (length) {
      if (process.env.PM2_USAGE) {
        process.send?.({
          type: "process:msg",
          data: {
            type: "mediareload",
            from: process.env.pm_id,
          },
        });
      }
      return this.getString("commands.responses.mediareload.connected", { params: { length: length.toString() } });
    }
    return this.getString("commands.responses.mediareload.couldNotConnect");
  }

  static description = "Attempts to reconnect to all available media processing servers";
  static adminOnly = true;
  static aliases = ["imagereload"];
}

export default MediaReloadCommand;
