const { spawn } = require("child_process");

exports.run = async (message, args) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to generate a meme!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a meme!`;
  const [topText, bottomText] = args.join(" ").split(",").map(elem => elem.trim());
  const child = spawn("./utils/meme.sh", [topText.toUpperCase().replace(/\\/g, "\\\\"), bottomText ? bottomText.toUpperCase().replace(/\\/g, "\\\\") : ""]);
  child.stdin.write(image.data);
  child.stdin.end();
  const chunks = [];
  child.stdout.on("data", (data) => {
    chunks.push(data);
  });
  child.once("error", (error) => {
    if (error) console.error;
  });
  child.stderr.once("data", (error) => {
    if (error) console.error;
  });
  child.stdout.once("close", () => {
    const data = Buffer.concat(chunks);
    return message.channel.createMessage("", {
      file: data,
      name: "meme.png"
    });
  });
};

exports.category = 5;
exports.help = "Generates a meme from an image (separate top/bottom text with a comma)";
exports.params = "[top text], {bottom text}";