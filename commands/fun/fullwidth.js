const Command = require("../../classes/command.js");

class FullwidthCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    if (this.args.length === 0) return `${this.message.author.mention}, you need to provide some text to convert to fullwidth!`;
    return this.args.join("").replaceAll(/[A-Za-z0-9]/g, (s) => { return String.fromCharCode(s.charCodeAt(0) + 0xFEE0); });
  }

  static description = "Converts a message to fullwidth/aesthetic text";
  static aliases = ["aesthetic", "aesthetics", "aes"];
  static arguments = ["[text]"];
}

module.exports = FullwidthCommand;