import fetch from "node-fetch";
import Command from "../../classes/command.js";

class WikihowCommand extends Command {
  async run() {
    this.acknowledge();
    const request = await fetch("https://www.wikihow.com/api.php?action=query&generator=random&prop=imageinfo&format=json&iiprop=url&grnnamespace=6");
    const json = await request.json();
    const id = Object.keys(json.query.pages)[0];
    const data = json.query.pages[id];
    if (data.imageinfo) {
      return {
        embeds: [{
          color: 16711680,
          image: {
            url: json.query.pages[id].imageinfo[0].url
          }
        }]
      };
    } else {
      return await this.run();
    }
  }

  static description = "Gets a random WikiHow image";
  static aliases = ["wiki"];
}

export default WikihowCommand;
