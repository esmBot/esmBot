const image = require("../../utils/image.js");
const logger = require("../../utils/logger.js");
const Command = require("../../classes/command.js");

class ImageReloadCommand extends Command {
  async run() {
    if (this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, only the bot owner can reload the image servers!`;
    await image.disconnect();
    await image.repopulate();
    let amount = 0;
    for (const server of image.servers) {
      try {
        await image.connect(server);
        amount += 1;
      } catch (e) {
        logger.error(e);
      }
    }
    if (amount > 0) {
      return `Successfully connected to ${amount} image servers.`;
    } else {
      return `${this.message.author.mention}, I couldn't connect to any image servers!`;
    }
  }

  static description = "Attempts to reconnect to all available image processing servers";
  static aliases = ["magickconnect", "magick"];
}

module.exports = ImageReloadCommand;