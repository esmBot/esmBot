import Command from "../../classes/command.js";
import { reloadImageConnections } from "../../utils/image.js";

class ImageReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return "Only the bot owner can reload the image servers!";
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
    } else {
      return "I couldn't connect to any image servers!";
    }
  }

  static description = "Attempts to reconnect to all available image processing servers";
  static adminOnly = true;
}

export default ImageReloadCommand;
