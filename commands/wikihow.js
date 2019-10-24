const fetch = require("node-fetch");
const config = require("../config.json");

exports.run = async (message) => {
  message.channel.sendTyping();
  const request = await fetch("https://hargrimm-wikihow-v1.p.mashape.com/images?count=1", {
    headers: {
      "X-Mashape-Key": config.mashapeKey,
      "Accept": "application/json"
    }
  });
  const json = await request.json();
  const image = await fetch(json["1"]);
  const imageBuffer = await image.buffer();
  return message.channel.createMessage("", {
    file: imageBuffer,
    name: json["1"].split("/")[json["1"].split("/").length - 1]
  });
};

exports.aliases = ["wiki"];