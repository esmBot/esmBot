import Command from "../../classes/command.js";

class EncodeCommand extends Command {
  async run() {
    if (this.args.length === 0) return "You need to provide a string to encode!";
    const b64Encoded = Buffer.from(this.args.join(" "), "utf8").toString("base64");
    return `\`\`\`\n${b64Encoded}\`\`\``;
  }

  static description = "Encodes a Base64 string";
  static aliases = ["b64encode", "base64encode"];
  static arguments = ["[text]"];
}

export default EncodeCommand;