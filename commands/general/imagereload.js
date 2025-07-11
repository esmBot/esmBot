import process from "node:process";
import Command from "#cmd-classes/command.js";
import { reloadImageConnections } from "#utils/image.js";

class ImageReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.imagereload.owner");
    }
    await this.acknowledge();
    const length = await reloadImageConnections();
    if (length) {
      if (process.env.PM2_USAGE) {
        process.send?.({
          type: "process:msg",
          data: {
            type: "imagereload",
            from: process.env.pm_id,
          },
        });
      }
      return this.getString("commands.responses.imagereload.connected", { params: { length: length.toString() } });
    }
    return this.getString("commands.responses.imagereload.couldNotConnect");
  }

  static description = "Attempts to reconnect to all available image processing servers";
  static adminOnly = true;
}

export default ImageReloadCommand;
