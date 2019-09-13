const fetch = require("node-fetch");

exports.run = async (message) => {
  message.channel.sendTyping();
  const imageData = await fetch("https://dog-api.kinduff.com/api/facts");
  const json = await imageData.json();
  return `🐶 **Did you know?** ${json.facts[0]}`;
};

exports.aliases = ["pupfact"];
