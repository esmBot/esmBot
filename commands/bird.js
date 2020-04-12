const fetch = require("node-fetch");

exports.run = async (message) => {
  message.channel.sendTyping();
  const imageData = await fetch("http://shibe.online/api/birds");
  const json = await imageData.json();
  return {
    embed: {
      color: 16711680,
      image: {
        url: json[0]
      }
    }
  };
};

exports.aliases = ["birb", "birds", "birbs"];
exports.category = 4;
exports.help = "Gets a random bird picture";