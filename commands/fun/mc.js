import fetch from "node-fetch";
import Command from "../../classes/command.js";

class MCCommand extends Command {
  async run() {
    if (this.args.length === 0) return "You need to provide some text to generate a Minecraft achievement!";
    this.acknowledge();
    const request = await fetch(`https://www.minecraftskinstealer.com/achievement/a.php?i=13&h=Achievement+get%21&t=${encodeURIComponent(this.args.join("+"))}`);
    return {
      file: Buffer.from(await request.arrayBuffer()),
      name: "mc.png"
    };
  }

  static description = "Generates a Minecraft achievement image";
  static aliases = ["ach", "achievement", "minecraft"];
  static arguments = ["[text]"];
}

export default MCCommand;