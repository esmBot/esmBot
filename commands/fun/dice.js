const Command = require("../../classes/command.js");

class DiceCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

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

module.exports = DiceCommand;