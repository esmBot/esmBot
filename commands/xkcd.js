const fetch = require("node-fetch");

exports.run = async (message, args) => {
  const url = args.length > 0 && args[0].match(/^\d+$/) ? `http://xkcd.com/${args[0]}/info.0.json` : "http://xkcd.com/info.0.json";
  const request = await fetch(url);
  const json = await request.json();
  const embed = {
    "embed": {
      "title": json.safe_title,
      "url": `https://xkcd.com/${json.num}`,
      "color": 16711680,
      "description": json.alt,
      "image": {
        "url": json.img
      }
    }
  };
  return message.channel.createMessage(embed);
};