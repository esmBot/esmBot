const { clean } = require("../../utils/misc.js");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const Command = require("../../classes/command.js");

class ExecCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    if (this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, only the bot owner can use exec!`;
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

module.exports = ExecCommand;