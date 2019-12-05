const misc = require("../utils/misc.js");

exports.run = async (message, args) => {
  if (args.length === 0) {
    return `🎲 The dice landed on ${misc.random(Array.from(Array(6).keys())) + 1}.`;
  } else {
    if (args[0].match(/^\d+$/)) {
      return `🎲 The dice landed on ${misc.random(Array.from(Array(parseInt(args[0])).keys())) + 1}.`;
    } else {
      return `🎲 The dice landed on ${misc.random(Array.from(Array(6).keys())) + 1}.`;
    }
  }
};

exports.aliases = ["roll", "die", "rng", "random"];
exports.category = 4;
exports.help = "Rolls the dice";
exports.params = "{number}";