const fetch = require("node-fetch");
const Command = require("../../classes/command.js");

class DogCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    this.message.channel.sendTyping();
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
  static arguments = ["{number}"];
}

module.exports = DogCommand;