const misc = require("../utils/misc.js");

exports.run = async (message, args) => {
  if (args.length === 0 || (args[0] !== "rock" && args[0] !== "paper" && args[0] !== "scissors")) return `${message.author.mention}, you need to choose whether you want to be rock, paper, or scissors!`;
  let emoji;
  let winOrLose;
  const result = misc.random(["rock", "paper", "scissors"]);
  switch (result) {
    case "rock":
      emoji = "✊";
      if (args[0].toLowerCase() === "paper") winOrLose = 1;
      break;
    case "paper":
      emoji = "✋";
      if (args[0].toLowerCase() === "scissors") winOrLose = 1;
      break;
    case "scissors":
      emoji = "✌";
      if (args[0].toLowerCase() === "rock") winOrLose = 1;
      break;
    default:
      break;
  }
  return args[0].toLowerCase() === result ? `${emoji} I chose ${result}. It's a tie!` : `${emoji} I chose ${result}. ${winOrLose ? "You win!" : "You lose!"}`;
};

exports.aliases = ["rockpaperscissors"];
exports.category = 4;
exports.help = "Plays rock, paper, scissors with me";
exports.params = "[rock/paper/scissors]";