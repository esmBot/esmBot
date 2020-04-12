const fetch = require("node-fetch");

exports.run = async (message) => {
  message.channel.sendTyping();
  const data = await fetch("https://api.thecatapi.com/v1/images/search?format=json", {
    headers: {
      "x-api-key": process.env.CAT
    }
  });
  const json = await data.json();
  return {
    embed: {
      color: 16711680,
      image: {
        url: json[0].url
      }
    }
  };
};

exports.aliases = ["kitters", "kitties", "kitty", "cattos", "catto", "cats"];
exports.category = 4;
exports.help = "Gets a random cat picture";
exports.requires = "cat";