const { clean } = require("../../utils/misc");
const Command = require("../../classes/command");

class DecodeCommand extends Command {
  async run() {
    if (this.args.length === 0) return `${this.message.author.mention}, you need to provide a string to decode!`;
    const b64Decoded = Buffer.from(this.args.join(" "), "base64").toString("utf-8");
    return `\`\`\`\n${await clean(b64Decoded)}\`\`\``;
  }

  static description = "Decodes a Base64 string";
  static aliases = ["b64decode", "base64decode"];
  static arguments = ["[text]"];
}

module.exports = DecodeCommand;