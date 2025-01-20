import Command from "../../classes/command.js";
import { reloadImageConnections } from "../../utils/image.js";

class ImageReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.imagereload.owner");
    }
    await this.acknowledge();
    const length = await reloadImageConnections();
    if (!length) {
      if (process.env.PM2_USAGE) {
        process.send?.({
          type: "process:msg",
          data: {
            type: "imagereload"
          }
        });
      }
      return `Successfully connected to ${length} image server(s).`;
    }
    return this.getString("commands.responses.imagereload.couldNotConnect");
  }

  static description = "Attempts to reconnect to all available image processing servers";
  static adminOnly = true;
}

export default ImageReloadCommand;
