const { writeFile } = require("fs");
const { promisify } = require("util");
const tweets = require("../tweets.json");
const twitter = require("../utils/twitter.js");

exports.run = async (message, args) => {
  if (message.author.id !== process.env.OWNER) return `${message.author.mention}, only the bot owner can add tweets!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to add to the tweet database!`;
  if (args[1] === undefined) return `${message.author.mention}, you need to provide the content you want to add!`;
  tweets[args[0]].push(args.slice(1).join(" "));
  twitter.tweets = tweets;
  await promisify(writeFile)("../tweets.json", JSON.stringify(tweets, null, 2));
  return `${message.author.mention}, the content has been added.`;
};

exports.aliases = ["add"];
exports.category = 8;
exports.help = "Adds a tweet to the database";
exports.requires = "twitter";
exports.params = "[category] [message]";