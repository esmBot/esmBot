import qrcode from "qrcode";
import { PassThrough } from "stream";
import Command from "../../classes/command.js";

class QrCreateCommand extends Command {
  async run() {
    const text = this.options.text ?? this.content;
    if (!text || !text.trim()) {
      this.success = false;
      return "You need to provide some text to generate a QR code!";
    }
    await this.acknowledge();
    const writable = new PassThrough();
    qrcode.toFileStream(writable, text, { margin: 1 });
    const file = await this.streamToBuf(writable);
    return {
      contents: file,
      name: "qr.png"
    };
  }

  streamToBuf(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => {
        chunks.push(chunk);
      });
      stream.once("error", (error) => {
        reject(error);
      });
      stream.once("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  static flags = [{
    name: "text",
    type: 3,
    description: "The text to generate a QR code from",
    required: true
  }];

  static description = "Generates a QR code";
  static arguments = ["[text]"];
}

export default QrCreateCommand;