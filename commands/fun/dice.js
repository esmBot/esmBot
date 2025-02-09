import Command from "../../classes/command.js";

class DiceCommand extends Command {
  async run() {
    const max = this.interaction?.data.options.getInteger("max") ?? Number.parseInt(this.args[0]);
    return `🎲 ${this.getString("commands.responses.dice.landed", {
      params: {
        number: Math.floor(Math.random() * (max || 6)) + 1
      }
    })}`;
  }

  static flags = [{
    name: "max",
    type: 4,
    description: "The maximum dice value",
    minValue: 1,
    classic: true
  }];

  static description = "Rolls the dice";
  static aliases = ["roll", "die", "rng", "random"];
}

export default DiceCommand;