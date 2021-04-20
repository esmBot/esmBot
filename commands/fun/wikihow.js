const fetch = require("node-fetch");
const Command = require("../../classes/command");

class WikihowCommand extends Command {
  async run() {
    this.message.channel.sendTyping();
    const request = await fetch("https://hargrimm-wikihow-v1.p.rapidapi.com/images?count=1", {
      headers: {
        "X-RapidAPI-Key": process.env.MASHAPE,
        "X-RapidAPI-Host": "hargrimm-wikihow-v1.p.rapidapi.com",
        "Accept": "application/json"
      }
    });
    const json = await request.json();
    const image = await fetch(json["1"]);
    const imageBuffer = await image.buffer();
    return {
      file: imageBuffer,
      name: json["1"].split("/")[json["1"].split("/").length - 1]
    };
  }

  static description = "Gets a random WikiHow image";
  static aliases = ["wiki"];
  static requires = ["mashape"];
}

module.exports = WikihowCommand;