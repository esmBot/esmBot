import fetch from "node-fetch";
import Command from "../../classes/command.js";

class XKCDCommand extends Command {
  async run() {
    const url = this.args.length > 0 && this.args[0].match(/^\d+$/) ? `http://xkcd.com/${this.args[0]}/info.0.json` : "http://xkcd.com/info.0.json";
    try {
      const request = await fetch(url);
      const json = await request.json();
      return {
        embeds: [{
          title: json.safe_title,
          url: `https://xkcd.com/${json.num}`,
          color: 16711680,
          description: json.alt,
          image: {
            url: json.img
          }
        }]
      };
    } catch {
      return "I couldn't get that XKCD!";
    }
  }

  static description = "Gets an XKCD comic";
  static arguments = ["{id}"];
}

export default XKCDCommand;