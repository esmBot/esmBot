const qrcode = require("qrcode");
const stream = require("stream");

exports.run = async (message, args, content) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a QR code!`;
  message.channel.sendTyping();
  const writable = new stream.PassThrough();
  qrcode.toFileStream(writable, content, { margin: 1 });
  const chunks = [];
  writable.on("data", (chunk) => {
    chunks.push(chunk);
  });
  writable.once("error", (error) => {
    if (error) throw error;
  });
  writable.once("end", () => {
    return message.channel.createMessage("", {
      file: Buffer.concat(chunks),
      name: "qr.png"
    });
  });
};

exports.category = 1;
exports.help = "Generates a QR code";
exports.params = "[text]";