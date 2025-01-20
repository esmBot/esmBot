import Command from "../../classes/command.js";
import imageDetect from "../../utils/imagedetect.js";

class RawCommand extends Command {
  async run() {
    await this.acknowledge();
    const image = await imageDetect(this.client, this.message, this.interaction, this.options);
    if (image === undefined) {
      this.success = false;
      return this.getString("commands.responses.raw.noInput");
    }
    return image.path;
  }

  static description = "Gets a direct image URL (useful for saving GIFs from sites like Tenor)";
  static aliases = ["giflink", "imglink", "getimg", "rawgif", "rawimg"];
  static flags = [{
    name: "image",
    type: 11,
    description: "An image/GIF attachment"
  }, {
    name: "link",
    type: 3,
    description: "An image/GIF URL"
  }];
}

export default RawCommand;
