exports.run = async (message, args) => {
  if (args.length === 0 || !args[0].match(/^\d+$/)) {
    return `🎲 The dice landed on ${Math.floor(Math.random() * 6) + 1}.`;
  } else {
    return `🎲 The dice landed on ${Math.floor(Math.random() * parseInt(args[0])) + 1}.`;
  }
};

exports.aliases = ["roll", "die", "rng", "random"];
exports.category = 4;
exports.help = "Rolls the dice";
exports.params = "{number}";