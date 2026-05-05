import Command from "#cmd-classes/command.js";
import { request } from "#utils/media.js";
import mediaDetect from "#utils/mediadetect.js";

class RawCommand extends Command {
  async run() {
    await this.acknowledge();
    const mediaArr = await mediaDetect(this.client, this.permissions, this.message, this.interaction);
    if (mediaArr.length === 0) {
      this.success = false;
      return this.getString("commands.responses.raw.noInput");
    }

    let final;
    for (const media of mediaArr) {
      const type = await request(new URL(media.path), ["image"], true).catch(() => {});
      if (type) {
        final = media;
        break;
      }
    }
    if (!final) return this.getString("image.couldNotFind");

    return final.path;
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
