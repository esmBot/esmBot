import { Buffer } from "node:buffer";
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class Base64EncodeCommand extends Command {
  async run() {
    this.success = false;
    const string = this.interaction?.data.options.getString("text") ?? this.args.join(" ");
    if (!string || !string.trim()) return this.getString("commands.responses.base64.encodeNoInput");
    this.success = true;
    const b64Encoded = Buffer.from(string, "utf8").toString("base64");
    return `\`\`\`\n${b64Encoded}\`\`\``;
  }

  static flags = [
    {
      name: "text",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The text to encode",
      classic: true,
      required: true,
    },
  ];

  static description = "Encodes a Base64 string";
  static aliases = ["b64encode"];
}

export default Base64EncodeCommand;
