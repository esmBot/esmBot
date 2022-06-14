import { clean } from "../../utils/misc.js";
import Command from "../../classes/command.js";

class EvalCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) return "Only the bot owner can use eval!";
    await this.acknowledge();
    const code = this.options.code ?? this.args.join(" ");
    try {
      let evaled;
      evaled = eval(code);
      const cleaned = await clean(evaled);
      const sendString = `\`\`\`js\n${cleaned}\n\`\`\``;
      if (sendString.length >= 2000) {
        return {
          text: "The result was too large, so here it is as a file:",
          file: cleaned,
          name: "result.txt"
        };
      } else {
        return sendString;
      }
    } catch (err) {
      return `\`ERROR\` \`\`\`xl\n${await clean(err)}\n\`\`\``;
    }
  }

  static flags = [{
    name: "code",
    type: 3,
    description: "The code to execute",
    required: true
  }];

  static description = "Executes JavaScript code";
  static aliases = ["run"];
  static arguments = ["[code]"];
}

export default EvalCommand;