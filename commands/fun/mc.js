const fetch = require("node-fetch");
const Command = require("../../classes/command.js");

class MCCommand extends Command {
  async run() {
    if (this.args.length === 0) return "You need to provide some text to generate a Minecraft achievement!";
    this.client.sendChannelTyping(this.message.channel.id);
    const request = await fetch(`https://www.minecraftskinstealer.com/achievement/a.php?i=13&h=Achievement+get%21&t=${encodeURIComponent(this.args.join("+"))}`);
    return {
      file: await request.buffer(),
      name: "mc.png"
    };
  }

  static description = "Generates a Minecraft achievement image";
  static aliases = ["ach", "achievement", "minecraft"];
  static arguments = ["[text]"];
}

module.exports = MCCommand;