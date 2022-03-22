import fetch from "node-fetch";
import Command from "../../classes/command.js";

class BirdCommand extends Command {
  async run() {
    this.acknowledge();
    const imageData = await fetch("http://shibe.online/api/birds");
    const json = await imageData.json();
    return {
      embeds: [{
        color: 16711680,
        image: {
          url: json[0]
        }
      }]
    };
  }

  static description = "Gets a random bird picture";
  static aliases = ["birb", "birds", "birbs"];
}

export default BirdCommand;