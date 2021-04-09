const { clean } = require("../../utils/misc.js");
const Command = require("../../classes/command.js");

class EvalCommand extends Command {
  async run() {
    if (this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, only the bot owner can use eval!`;
    const code = this.args.join(" ");
    try {
      const evaled = eval(code);
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

  static description = "Executes JavaScript code";
  static aliases = ["run"];
  static arguments = ["[code]"];
}

module.exports = EvalCommand;