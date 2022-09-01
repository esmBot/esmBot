import Command from "../../classes/command.js";

class ImageReloadCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return "Only the bot owner can reload the image servers!";
    }
    const amount = await this.ipc.serviceCommand("image", { type: "reload" }, true);
    if (amount > 0) {
      return `Successfully connected to ${amount} image servers.`;
    } else {
      return "I couldn't connect to any image servers!";
    }
  }

  static description = "Attempts to reconnect to all available image processing servers";
  static adminOnly = true;
}

export default ImageReloadCommand;
