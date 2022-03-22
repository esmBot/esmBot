import jsqr from "jsqr";
import fetch from "node-fetch";
import sharp from "sharp";
import { clean } from "../../utils/misc.js";
import Command from "../../classes/command.js";
import imageDetect from "../../utils/imagedetect.js";

class QrReadCommand extends Command {
  async run() {
    const image = await imageDetect(this.client, this.message);
    if (image === undefined) return "You need to provide an image/GIF with a QR code to read!";
    this.acknowledge();
    const data = await (await fetch(image.path)).buffer();
    const rawData = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const qrBuffer = jsqr(rawData.data, rawData.info.width, rawData.info.height);
    if (!qrBuffer) return "I couldn't find a QR code!";
    return `\`\`\`\n${await clean(qrBuffer.data)}\n\`\`\``;
  }

  static description = "Reads a QR code";
}

export default QrReadCommand;
