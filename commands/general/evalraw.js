const { clean } = require("../../utils/misc.js");
const Command = require("../../classes/command.js");

class EvalRawCommand extends Command {
  async run() {
    if (this.message.author.id !== process.env.OWNER) return "Only the bot owner can use evalraw!";
    const code = this.args.join(" ");
    try {
      const evaled = eval(code);
      if (evaled.length >= 2000) {
        return {
          text: "The result was too large, so here it is as a file:",
          file: evaled,
          name: "result.txt"
        };
      } else {
        return evaled;
      }
    } catch (err) {
      return `\`ERROR\` \`\`\`xl\n${await clean(err)}\n\`\`\``;
    }
  }

  static description = "Executes JavaScript code (with raw output)";
  static aliases = ["run"];
  static arguments = ["[code]"];
}

module.exports = EvalRawCommand;