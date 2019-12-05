const qrcode = require("qrcode");
const stream = require("stream");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a QR code!`;
  message.channel.sendTyping();
  const writable = new stream.PassThrough();
  qrcode.toFileStream(writable, args.join(" "), { margin: 1 });
  const chunks = [];
  writable.on("data", (chunk) => {
    chunks.push(chunk);
  });
  writable.once("error", (error) => {
    if (error) console.error;
  });
  writable.once("end", () => {
    const imageBuffer = Buffer.concat(chunks);
    return message.channel.createMessage("", {
      file: imageBuffer,
      name: "qr.png"
    });
  });
};

exports.category = 1;
exports.help = "Generates a QR code";
exports.params = "[text]";