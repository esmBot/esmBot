const fetch = require("node-fetch");

exports.run = async (message, args) => {
  const url = args.length > 0 && args[0].match(/^\d+$/) ? `http://xkcd.com/${args[0]}/info.0.json` : "http://xkcd.com/info.0.json";
  try {
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
    return embed;
  } catch (e) {
    return `${message.author.mention}, I couldn't get that XKCD!`;
  }
};

exports.category = 4;
exports.help = "Gets an XKCD comic";
exports.params = "{id}";