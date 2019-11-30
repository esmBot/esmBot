const fetch = require("node-fetch");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to translate to Yodish!`;
  const request = await fetch(`https://yoda-api.appspot.com/api/v1/yodish?text=${encodeURIComponent(args.join(" "))}`);
  const json = await request.json();
  return json.yodish;
};

exports.aliases = ["yodish"];