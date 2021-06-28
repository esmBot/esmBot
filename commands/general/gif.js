const Command = require("../../classes/command.js");
const imageDetect = require("../../utils/imagedetect.js");

class GifCommand extends Command {
  async run() {
    this.message.channel.sendTyping();
    const image = await imageDetect(this.client, this.message);
    if (image === undefined) return "You need to provide an image with a QR code to read!";
    return image.path;
  }

  static description = "Gets a direct GIF URL (useful for saving GIFs from sites like Tenor)";
  static aliases = ["getgif", "giflink"];
}

module.exports = GifCommand;