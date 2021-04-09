const fetch = require("node-fetch");
const Command = require("../../classes/command.js");

class BirdCommand extends Command {
  async run() {
    this.message.channel.sendTyping();
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
  }

  static description = "Gets a random bird picture";
  static aliases = ["birb", "birds", "birbs"];
}

module.exports = BirdCommand;