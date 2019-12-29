const fetch = require("node-fetch");

exports.run = async (message, args) => {
  return `${message.author.mention}, this command is currently disabled due to various issues. We are looking for a fix.`;
  /*if (args.length === 0) return `${message.author.mention}, you need to provide some text to translate to Yodish!`;
  const request = await fetch(`https://yoda-api.appspot.com/api/v1/yodish?text=${encodeURIComponent(args.join(" "))}`);
  const json = await request.json();
  return json.yodish;*/
};

exports.aliases = ["yodish"];
exports.category = 4;
exports.help = "Translates a message to Yodish (disabled)";
exports.params = "[text]";