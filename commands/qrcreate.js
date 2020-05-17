const qrcode = require("qrcode");
const stream = require("stream");

exports.run = async (message, args, content) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a QR code!`;
  message.channel.sendTyping();
  const writable = new stream.PassThrough();
  qrcode.toFileStream(writable, content, { margin: 1 });
  const file = await streamToBuf(writable);
  return {
    file: file,
    name: "qr.png"
  };
};

function streamToBuf(stream) {
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

exports.category = 1;
exports.help = "Generates a QR code";
exports.params = "[text]";