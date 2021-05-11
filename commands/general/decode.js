const { clean } = require("../../utils/misc.js");
const Command = require("../../classes/command.js");

class DecodeCommand extends Command {
  async run() {
    if (this.args.length === 0) return "You need to provide a string to decode!";
    const b64Decoded = Buffer.from(this.args.join(" "), "base64").toString("utf8");
    return `\`\`\`\n${await clean(b64Decoded)}\`\`\``;
  }

  static description = "Decodes a Base64 string";
  static aliases = ["b64decode", "base64decode"];
  static arguments = ["[text]"];
}

module.exports = DecodeCommand;