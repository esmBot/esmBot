import Command from "../../classes/command.js";

class DiceCommand extends Command {
  async run() {
    const max = this.interaction?.data.options.getInteger("max") ?? Number.parseInt(this.args[0]);
    if (!max) {
      return `🎲 The dice landed on ${Math.floor(Math.random() * 6) + 1}.`;
    }
    return `🎲 The dice landed on ${Math.floor(Math.random() * max) + 1}.`;
  }

  static flags = [{
    name: "max",
    type: 4,
    description: "The maximum dice value",
    min_value: 1,
    classic: true
  }];

  static description = "Rolls the dice";
  static aliases = ["roll", "die", "rng", "random"];
}

export default DiceCommand;