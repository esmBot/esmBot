import Command from "../../classes/command.js";

class DiceCommand extends Command {
  async run() {
    const max = this.type === "classic" ? parseInt(this.args[0]) : this.options.max;
    if (!max) {
      return `🎲 The dice landed on ${Math.floor(Math.random() * 6) + 1}.`;
    } else {
      return `🎲 The dice landed on ${Math.floor(Math.random() * max) + 1}.`;
    }
  }

  static flags = [{
    name: "max",
    type: 4,
    description: "The maximum dice value",
    min_value: 1
  }];

  static description = "Rolls the dice";
  static aliases = ["roll", "die", "rng", "random"];
  static arguments = ["{number}"];
}

export default DiceCommand;