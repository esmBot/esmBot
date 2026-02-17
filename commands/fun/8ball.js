import Command from "#cmd-classes/command.js";
import { random } from "#utils/misc.js";

class EightBallCommand extends Command {
  static responses = [
    "certain",
    "decidedly",
    "withoutDoubt",
    "definitely",
    "rely",
    "seeIt",
    "likely",
    "outlookGood",
    "yes",
    "signs",
    "hazy",
    "later",
    "betterNot",
    "cannotPredict",
    "concentrate",
    "dontCount",
    "replyNo",
    "sourcesNo",
    "outlookBad",
    "doubtful",
  ];

  async run() {
    return `🎱 ${this.getString(`commands.responses.8ball.${random(EightBallCommand.responses)}`)}`;
  }

  static flags = [
    {
      name: "question",
      type: "string",
      description: "A question you want to ask the ball",
      classic: true,
    },
  ];

  static description = "Asks the magic 8-ball a question";
  static aliases = ["magicball", "magikball", "magic8ball", "magik8ball", "eightball"];
}

export default EightBallCommand;
