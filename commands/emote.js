const emojiRegex = require("emoji-regex");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide an emoji!`;
  if (args[0].match(/^<a?:.+:\d+>$/)) {
    return `https://cdn.discordapp.com/emojis/${args[0].replace(/^<(a)?:.+:(\d+)>$/, "$2")}.${args[0].replace(/^<(a)?:.+:(\d+)>$/, "$1") === "a" ? "gif" : "png"}`;
  } else if (args[0].match(emojiRegex)) {
    const codePoints = [];
    for (const codePoint of args[0]) {
      codePoints.push(codePoint.codePointAt(0).toString(16));
    }
    return `https://twemoji.maxcdn.com/v/latest/72x72/${codePoints.join("-").replace("-fe0f", "")}.png`;
  } else {
    return `${message.author.mention}, you need to provide a valid emoji to get an image!`;
  }
};

exports.aliases = ["e", "em", "hugemoji", "hugeemoji", "emoji"];
exports.category = 1;
exports.help = "Gets a raw emote image";
exports.params = "[emote]";