import Command from "../../classes/command.js";

class DiceCommand extends Command {
  async run() {
    if (this.args.length === 0 || !this.args[0].match(/^\d+$/)) {
      return `🎲 The dice landed on ${Math.floor(Math.random() * 6) + 1}.`;
    } else {
      return `🎲 The dice landed on ${Math.floor(Math.random() * parseInt(this.args[0])) + 1}.`;
    }
  }

  static description = "Rolls the dice";
  static aliases = ["roll", "die", "rng", "random"];
  static arguments = ["{number}"];
}

export default DiceCommand;