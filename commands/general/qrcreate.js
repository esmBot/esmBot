import qrcode from "qrcode";
import { PassThrough } from "stream";
import Command from "../../classes/command.js";

class QrCreateCommand extends Command {
  async run() {
    if (this.args.length === 0) return "You need to provide some text to generate a QR code!";
    this.acknowledge();
    const writable = new PassThrough();
    qrcode.toFileStream(writable, this.content, { margin: 1 });
    const file = await this.streamToBuf(writable);
    return {
      file: file,
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

  static description = "Generates a QR code";
  static arguments = ["[text]"];
}

export default QrCreateCommand;