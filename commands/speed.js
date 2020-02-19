const { exec } = require("child_process");
const util = require("util");
const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to speed up!`;
  if (image.type !== "gif" && image.type !== "mp4") return `${message.author.mention}, that isn't a GIF!`;
  gm(image.path).identify(async (error, value) => {
    if (error) throw error;
    const delay = value.Delay ? value.Delay[0].split("x") : [0, 100];
    if (Math.round(parseInt(delay[0]) / 2) >= 2) {
      const data = gm().delay(`${parseInt(delay[0]) / 2}x${delay[1]}`).out(image.path);
      return message.channel.createMessage("", {
        file: await gmToBuffer(data, image.outputType),
        name: "speed.gif"
      });
    } else {
      const numbers = (await util.promisify(exec)(`seq 0 2 ${value.Scene.length}`)).stdout.split("\n").join(",");
      const data = gm().out("(").out(image.path).coalesce().out(")").out("-delete", numbers).out("-layers", "optimize");
      const buffer = await gmToBuffer(data, image.outputType);
      return message.channel.createMessage("", {
        file: buffer,
        name: "speed.gif"
      });
    }
  });
};

exports.aliases = ["speedup", "fast", "gifspeed"];
exports.category = 5;
exports.help = "Makes a GIF faster";