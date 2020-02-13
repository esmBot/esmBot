const fs = require("fs");
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
  if (image.type !== "gif") return `${message.author.mention}, that isn't a GIF!`;
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.gif`;
  util.promisify(fs.writeFile)(path, image.data);
  gm(image.data).identify(async (error, value) => {
    if (error) throw error;
    const delay = value.Delay[0].split("x");
    if (Math.round(parseInt(delay[0]) / 2) >= 2) {
      const data = gm().delay(`${parseInt(delay[0]) / 2}x${delay[1]}`).out(path);
      return message.channel.createMessage("", {
        file: await gmToBuffer(data),
        name: "speed.gif"
      });
    } else {
      const numbers = (await util.promisify(exec)(`seq 0 2 ${value.Delay.length}`)).stdout.split("\n").join(",");
      const data = gm().out("(").out(path).coalesce().out(")").out("-delete", numbers).out("-layers", "optimize");
      return message.channel.createMessage("", {
        file: await gmToBuffer(data),
        name: "speed.gif"
      });
    }
  });
};

exports.aliases = ["speedup", "fast", "gifspeed"];
exports.category = 5;
exports.help = "Makes a GIF faster";