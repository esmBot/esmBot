const Command = require("../../classes/command.js");
const imageDetect = require("../../utils/imagedetect.js");

class RawCommand extends Command {
  async run() {
    this.client.sendChannelTyping(this.message.channel.id);
    const image = await imageDetect(this.client, this.message);
    if (image === undefined) return "You need to provide an image to get a raw URL!";
    return image.path;
  }

  static description = "Gets a direct image URL (useful for saving GIFs from sites like Tenor)";
  static aliases = ["gif", "getgif", "giflink", "imglink", "getimg", "rawgif", "rawimg"];
}

module.exports = RawCommand;