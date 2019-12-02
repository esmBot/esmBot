const twitter = require("../utils/twitter.js");

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can tweet!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to tweet!`;
  const info = await twitter.client.post("statuses/update", { status: args.join(" ") });
  if (info.resp.statusCode !== 200) return `Something happened when trying to post this tweet: ${info.resp.statusCode} ${info.resp.statusMessage}`;
  return `${message.author.mention}, a tweet with id ${info.data.id_str} has been posted with status code ${info.resp.statusCode} ${info.resp.statusMessage}.`;
};

exports.category = 7;
exports.help = "Tweets a message";
exports.requires = "twitter";