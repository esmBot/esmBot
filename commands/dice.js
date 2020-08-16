const misc = require("../utils/misc.js");

exports.run = async (message, args) => {
  if (args.length === 0 || !args[0].match(/^\d+$/) || args[0] > 1000000) {
    return `🎲 The dice landed on ${misc.random([...Array(6).keys()]) + 1}.`;
  } else {
    return `🎲 The dice landed on ${misc.random([...Array(parseInt(args[0])).keys()]) + 1}.`;
  }
};

exports.aliases = ["roll", "die", "rng", "random"];
exports.category = 4;
exports.help = "Rolls the dice";
exports.params = "{number}";