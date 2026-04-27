import process from "node:process";
import Command from "#cmd-classes/command.js";

class CaptionChanceCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return "Only the bot owner can use this command.";
    }
    const input = this.getOptionNumber("chance") ?? parseFloat(this.args[0]);
    if (isNaN(input) || input < 0 || input > 100) {
      this.success = false;
      return "Provide a number between 0 and 100.";
    }
    globalThis.captionEasterEggChance = input / 100;
    return `Caption easter egg chance set to ${input}%.`;
  }

  static flags = [
    {
      name: "chance",
      type: "number",
      description: "Chance percentage (0-100)",
      classic: true,
      required: true,
    },
  ];

  static description = "Sets the caption easter egg chance";
  static adminOnly = true;
  static command = "captionchance";
}

export default CaptionChanceCommand;
