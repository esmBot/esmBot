const fetch = require("node-fetch");
const Command = require("../../classes/command.js");

class AncientCommand extends Command {
  async run() {
    this.client.sendChannelTyping(this.message.channel.id);
    const data = await fetch("https://projectlounge.pw/meme/", { redirect: "manual" });
    return {
      embed: {
        color: 16711680,
        image: {
          url: data.headers.get("location")
        }
      }
    };
  }

  static description = "Gets a random ancient meme";
  static aliases = ["old", "oldmeme", "badmeme"];
}

module.exports = AncientCommand;