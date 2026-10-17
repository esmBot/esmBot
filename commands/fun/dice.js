import Command from "#cmd-classes/command.js";
/** @import { CommandFlag } from "#utils/types.js" */

class DiceCommand extends Command {
  async run() {
    const max = this.getOptionInteger("max", true);
    return `🎲 ${this.getString("commands.responses.dice.landed", {
      params: {
        number: (Math.floor(Math.random() * (max || 6)) + 1).toString(),
      },
    })}`;
  }

  /** @type {CommandFlag[]} */
  static flags = [
    {
      name: "max",
      type: "integer",
      description: "The maximum dice value",
      minValue: 1,
      classic: true,
    },
  ];

  static description = "Rolls the dice";
  static aliases = ["roll", "die", "rng", "random"];
}

export default DiceCommand;
