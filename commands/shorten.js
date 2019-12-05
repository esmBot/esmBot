const urlCheck = require("../utils/urlcheck.js");
const fetch = require("node-fetch");

exports.run = async (message, args) => {
  if (args.length === 0 || !urlCheck(args[0])) return `${message.author.mention}, you need to provide a URL to shorten!`;
  const data = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(args[0])}`);
  const url = await data.text();
  return url;
};

exports.aliases = ["urlshorten", "shortenlink", "urishorten", "shortenuri", "shortenurl"];
exports.category = 1;
exports.help = "Shortens a URL";
exports.params = "[url]";