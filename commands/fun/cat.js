const fetch = require("node-fetch");
const Command = require("../../classes/command.js");

class CatCommand extends Command {
  async run() {
    this.message.channel.sendTyping();
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
  }

  static description = "Gets a random cat picture";
  static aliases = ["kitters", "kitties", "kitty", "cattos", "catto", "cats", "cta"];
  static requires = ["cat"];
}

module.exports = CatCommand;