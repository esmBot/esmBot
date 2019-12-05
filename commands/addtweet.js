const db = require("../utils/database.js");

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can add tweets!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to add to the tweet database!`;
  if (args[1] === undefined) return `${message.author.mention}, you need to provide the content you want to add!`;
  const tweets = (await db.tweets.find({ enabled: true }).exec())[0];
  tweets[args[0]].push(args.slice(1).join(" "));
  await tweets.save();
  return `${message.author.mention}, the content has been added.`;
};

exports.aliases = ["add"];
exports.category = 7;
exports.help = "Adds a tweet to the database";
exports.requires = "twitter";
exports.params = "[category] [message]";