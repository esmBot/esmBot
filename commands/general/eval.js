import { clean } from "../../utils/misc.js";
import Command from "../../classes/command.js";

class EvalCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return "Only the bot owner can use eval!";
    }
    await this.acknowledge();
    const code = this.options.code ?? this.args.join(" ");
    try {
      let evaled = eval(code);
      if (evaled?.constructor?.name == "Promise") evaled = await evaled;
      const cleaned = clean(evaled);
      const sendString = `\`\`\`js\n${cleaned}\n\`\`\``;
      if (sendString.length >= 2000) {
        return {
          content: "The result was too large, so here it is as a file:",
          files: [{
            contents: cleaned,
            name: "result.txt"
          }]
        };
      } else {
        return sendString;
      }
    } catch (err) {
      let error = err;
      if (err?.constructor?.name == "Promise") error = await err;
      return `\`ERROR\` \`\`\`xl\n${clean(error)}\n\`\`\``;
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
  static adminOnly = true;
}

export default EvalCommand;