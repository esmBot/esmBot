const { spawn } = require("child_process");
const fetch = require("node-fetch");

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to generate a meme!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a meme!`;
  message.channel.sendTyping();
  const request = await fetch(image.url);
  const buffer = await request.buffer();
  const [topText, bottomText] = args.join(" ").split(",").map(elem => elem.trim());
  const child = spawn("./utils/meme.sh", [topText.toUpperCase().replace(/\\/g, "\\\\"), bottomText ? bottomText.toUpperCase().replace(/\\/g, "\\\\") : ""]);
  child.stdin.write(buffer);
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