import { Buffer } from "node:buffer";
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class Base64DecodeCommand extends Command {
  async run() {
    this.success = false;
    const string = this.interaction?.data.options.getString("text") ?? this.args.join(" ");
    if (!string || !string.trim()) return this.getString("commands.responses.base64.decodeNoInput");
    this.success = true;
    const b64Decoded = Buffer.from(string, "base64").toString("utf8");
    return `\`\`\`\n${b64Decoded.replaceAll("`", `\`${String.fromCharCode(8203)}`).replaceAll("@", `@${String.fromCharCode(8203)}`)}\`\`\``;
  }

  static flags = [
    {
      name: "text",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The text to decode",
      classic: true,
      required: true,
    },
  ];

  static description = "Decodes a Base64 string";
  static aliases = ["b64decode"];
}

export default Base64DecodeCommand;
