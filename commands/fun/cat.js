const fetch = require("node-fetch");
const Command = require("../../classes/command.js");

class CatCommand extends Command {
  async run() {
    this.client.sendChannelTyping(this.message.channel.id);
    const data = await fetch("https://projectlounge.pw/cta/", { redirect: "manual" });
    return {
      embed: {
        color: 16711680,
        image: {
          url: data.headers.get("location")
        }
      }
    };
  }

  static description = "Gets a random cat picture";
  static aliases = ["kitters", "kitties", "kitty", "cattos", "catto", "cats", "cta"];
}

module.exports = CatCommand;