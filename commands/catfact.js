const fetch = require("node-fetch");

exports.run = async (message) => {
  message.channel.sendTyping();
  const imageData = await fetch("https://catfact.ninja/fact");
  const json = await imageData.json();
  return `🐱 **Did you know?** ${json.fact}`;
};

exports.aliases = ["kittyfact"];
