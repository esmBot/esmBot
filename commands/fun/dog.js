const fetch = require("node-fetch");
const Command = require("../../classes/command.js");

class DogCommand extends Command {
  async run() {
    this.client.sendChannelTyping(this.message.channel.id);
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
  }

  static description = "Gets a random dog picture";
  static aliases = ["doggos", "doggo", "pupper", "puppers", "dogs", "puppy", "puppies", "pups", "pup"];
}

module.exports = DogCommand;