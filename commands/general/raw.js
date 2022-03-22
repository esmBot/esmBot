import Command from "../../classes/command.js";
import imageDetect from "../../utils/imagedetect.js";

class RawCommand extends Command {
  async run() {
    this.acknowledge();
    const image = await imageDetect(this.client, this.message);
    if (image === undefined) return "You need to provide an image/GIF to get a raw URL!";
    return image.path;
  }

  static description = "Gets a direct image URL (useful for saving GIFs from sites like Tenor)";
  static aliases = ["gif", "getgif", "giflink", "imglink", "getimg", "rawgif", "rawimg"];
}

export default RawCommand;
