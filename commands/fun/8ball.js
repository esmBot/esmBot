import Command from "../../classes/command.js";
import { random } from "../../utils/misc.js";

class EightBallCommand extends Command {
  static responses = [
    "It is certain",
    "It is decidedly so",
    "Without a doubt",
    "Yes, definitely",
    "You may rely on it",
    "As I see it, yes",
    "Most likely",
    "Outlook good",
    "Yes",
    "Signs point to yes",
    "Reply hazy, try again",
    "Ask again later",
    "Better not tell you now",
    "Cannot predict now",
    "Concentrate and ask again",
    "Don't count on it",
    "My reply is no",
    "My sources say no",
    "Outlook not so good",
    "Very doubtful"
  ];

  async run() {
    return `🎱 ${random(EightBallCommand.responses)}`;
  }

  static flags = [{
    name: "question",
    type: 3,
    description: "A question you want to ask the ball",
    classic: true
  }];

  static description = "Asks the magic 8-ball a question";
  static aliases = ["magicball", "magikball", "magic8ball", "magik8ball", "eightball"];
}

export default EightBallCommand;