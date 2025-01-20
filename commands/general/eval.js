import { clean } from "../../utils/misc.js";
import Command from "../../classes/command.js";

class EvalCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.eval.botOwnerOnly");
    }
    await this.acknowledge();
    const code = this.options.code ?? this.args.join(" ");
    try {
      // biome-ignore lint/security/noGlobalEval: the whole point of this command is to eval
      let evaled = eval(code);
      if (evaled?.constructor?.name === "Promise") evaled = await evaled;
      const cleaned = clean(evaled);
      const sendString = `\`\`\`js\n${cleaned}\n\`\`\``;
      if (sendString.length >= 2000) {
        return {
          content: this.getString("tooLarge"),
          files: [{
            contents: cleaned,
            name: "result.txt"
          }]
        };
      }
      return sendString;
    } catch (err) {
      let error = err;
      if (err?.constructor?.name === "Promise") error = await err;
      return `\`${this.getString("errorCaps")}\` \`\`\`xl\n${clean(error)}\n\`\`\``;
    }
  }

  static flags = [{
    name: "code",
    type: 3,
    description: "The code to execute",
    classic: true,
    required: true
  }];

  static description = "Executes JavaScript code";
  static aliases = ["run"];
  static adminOnly = true;
}

export default EvalCommand;