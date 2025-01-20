import { clean } from "../../utils/misc.js";
import { promisify } from "node:util";
import { exec as baseExec } from "node:child_process";
const exec = promisify(baseExec);
import Command from "../../classes/command.js";

class ExecCommand extends Command {
  async run() {
    const owners = process.env.OWNER.split(",");
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.exec.botOwnerOnly");
    }
    await this.acknowledge();
    const code = this.options.cmd ?? this.args.join(" ");
    try {
      const execed = await exec(code);
      if (execed.stderr) return `\`${this.getString("errorCaps")}\` \`\`\`xl\n${await clean(execed.stderr)}\n\`\`\``;
      const cleaned = await clean(execed.stdout);
      const sendString = `\`\`\`bash\n${cleaned}\n\`\`\``;
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
      return `\`${this.getString("errorCaps")}\` \`\`\`xl\n${await clean(err)}\n\`\`\``;
    }
  }

  static flags = [{
    name: "cmd",
    type: 3,
    description: "The command to execute",
    classic: true,
    required: true
  }];

  static description = "Executes a shell command";
  static aliases = ["runcmd"];
  static adminOnly = true;
}

export default ExecCommand;