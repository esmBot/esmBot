import { clean } from "../../utils/misc.js";
import * as util from "util";
import { exec as baseExec } from "child_process";
const exec = util.promisify(baseExec);
import Command from "../../classes/command.js";

class ExecCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.message.author.id)) return "Only the bot owner can use exec!";
    const code = this.args.join(" ");
    try {
      const execed = await exec(code);
      if (execed.stderr) return `\`ERROR\` \`\`\`xl\n${await clean(execed.stderr)}\n\`\`\``;
      const cleaned = await clean(execed.stdout);
      const sendString = `\`\`\`bash\n${cleaned}\n\`\`\``;
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

  static description = "Executes a shell command";
  static aliases = ["runcmd"];
  static arguments = ["[command]"];
}

export default ExecCommand;