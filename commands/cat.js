const fetch = require("node-fetch");
const config = require("../config.json");

exports.run = async (message) => {
  message.channel.sendTyping();
  const data = await fetch("https://api.thecatapi.com/v1/images/search?format=json", {
    headers: {
      "x-api-key": config.catToken
    }
  });
  const json = await data.json();
  return message.channel.createMessage({
    embed: {
      color: 16711680,
      image: {
        url: json[0].url
      }
    }
  });
};

exports.aliases = ["kitters", "kitties", "kitty", "cattos", "catto", "cats"];
