import fetch from "node-fetch";
import Command from "../../classes/command.js";

class WikihowCommand extends Command {
  async run() {
    this.client.sendChannelTyping(this.message.channel.id);
    const request = await fetch("https://hargrimm-wikihow-v1.p.rapidapi.com/images?count=1", {
      headers: {
        "X-RapidAPI-Key": process.env.MASHAPE,
        "X-RapidAPI-Host": "hargrimm-wikihow-v1.p.rapidapi.com",
        "Accept": "application/json"
      }
    });
    const json = await request.json();
    const image = await fetch(json["1"]);
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    return {
      file: imageBuffer,
      name: json["1"].split("/")[json["1"].split("/").length - 1]
    };
  }

  static description = "Gets a random WikiHow image";
  static aliases = ["wiki"];
  static requires = ["mashape"];
}

export default WikihowCommand;