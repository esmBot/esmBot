const fetch = require("node-fetch");

exports.run = async (message) => {
  message.channel.sendTyping();
  const imageData = await fetch("https://dog.ceo/api/breeds/image/random");
  const json = await imageData.json();
  return {
    embed: {
      color: 16711680,
      image: {
        url: json.message
      }
    }
  };
};

exports.aliases = ["doggos", "doggo", "pupper", "puppers", "dogs", "puppy", "puppies", "pups", "pup"];
exports.category = 4;
exports.help = "Gets a random dog picture";