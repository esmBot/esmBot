import { random } from "../../utils/misc.js";
import Command from "../../classes/command.js";

class RPSCommand extends Command {
  async run() {
    if (this.args.length === 0 || (this.args[0] !== "rock" && this.args[0] !== "paper" && this.args[0] !== "scissors")) return "You need to choose whether you want to be rock, paper, or scissors!";
    let emoji;
    let winOrLose;
    const result = random(["rock", "paper", "scissors"]);
    switch (result) {
      case "rock":
        emoji = "✊";
        if (this.args[0].toLowerCase() === "paper") winOrLose = true;
        break;
      case "paper":
        emoji = "✋";
        if (this.args[0].toLowerCase() === "scissors") winOrLose = true;
        break;
      case "scissors":
        emoji = "✌";
        if (this.args[0].toLowerCase() === "rock") winOrLose = true;
        break;
      default:
        break;
    }
    return this.args[0].toLowerCase() === result ? `${emoji} I chose ${result}. It's a tie!` : `${emoji} I chose ${result}. ${winOrLose ? "You win!" : "You lose!"}`;
  }

  static description = "Plays rock, paper, scissors with me";
  static aliases = ["rockpaperscissors"];
  static arguments = ["[rock/paper/scissors]"];
}

export default RPSCommand;