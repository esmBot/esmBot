import { exec as baseExec } from "node:child_process";
import { promisify } from "node:util";
import { clean } from "#utils/misc.js";
const exec = promisify(baseExec);
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class ExecCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return this.getString("commands.responses.exec.botOwnerOnly");
    }
    await this.acknowledge();
    const code = this.getOptionString("cmd") ?? this.args.join(" ");
    try {
      const execed = await exec(code);
      if (execed.stderr) return `\`${this.getString("errorCaps")}\` \`\`\`xl\n${await clean(execed.stderr)}\n\`\`\``;
      const cleaned = await clean(execed.stdout);
      const sendString = `\`\`\`bash\n${cleaned}\n\`\`\``;
      if (sendString.length >= 2000) {
        return {
          content: this.getString("tooLarge"),
          files: [
            {
              contents: Buffer.from(cleaned),
              name: "result.txt",
            },
          ],
        };
      }
      return sendString;
    } catch (err) {
      return `\`${this.getString("errorCaps")}\` \`\`\`xl\n${await clean(err)}\n\`\`\``;
    }
  }

  static flags = [
    {
      name: "cmd",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The command to execute",
      classic: true,
      required: true,
    },
  ];

  static description = "Executes a shell command";
  static aliases = ["runcmd"];
  static adminOnly = true;
}

export default ExecCommand;
