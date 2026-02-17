import Command from "#cmd-classes/command.js";
import imageDetect from "#utils/mediadetect.js";

class RawCommand extends Command {
  async run() {
    await this.acknowledge();
    const image = await imageDetect(this.client, this.permissions, ["image"], this.message, this.interaction);
    if (image === undefined) {
      this.success = false;
      return this.getString("commands.responses.raw.noInput");
    }
    return image.path;
  }

  static description = "Gets a direct image URL (useful for saving GIFs from sites like Tenor)";
  static aliases = ["giflink", "imglink", "getimg", "rawgif", "rawimg"];
  static flags = [
    {
      name: "image",
      type: "attachment",
      description: "An image/GIF attachment",
    },
    {
      name: "link",
      type: "string",
      description: "An image/GIF URL",
    },
  ];
}

export default RawCommand;
