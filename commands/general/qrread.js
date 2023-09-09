import jsqr from "jsqr";
import sharp from "sharp";
import { clean } from "../../utils/misc.js";
import Command from "../../classes/command.js";
import imageDetect from "../../utils/imagedetect.js";

class QrReadCommand extends Command {
  async run() {
    const image = await imageDetect(this.client, this.message, this.interaction, this.options);
    this.success = false;
    if (image === undefined) return "You need to provide an image/GIF with a QR code to read!";
    await this.acknowledge();
    const data = Buffer.from(await (await fetch(image.path)).arrayBuffer());
    const rawData = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const qrBuffer = jsqr(rawData.data, rawData.info.width, rawData.info.height);
    if (!qrBuffer) return "I couldn't find a QR code!";
    this.success = true;
    return `\`\`\`\n${await clean(qrBuffer.data)}\n\`\`\``;
  }

  static description = "Reads a QR code";
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

export default QrReadCommand;
