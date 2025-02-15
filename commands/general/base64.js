import { Constants } from "oceanic.js";
import Command from "../../classes/command.js";

class Base64Command extends Command {
  async run() {
    this.success = false;
    if (this.type === "classic" && this.args.length === 0) return this.getString("commands.responses.base64.noCmd");
    const command = this.type === "classic" ? this.args[0].toLowerCase() : this.interaction?.data.options.getSubCommand()?.[0];
    if (command !== "decode" && command !== "encode") return this.getString("commands.responses.base64.noCmd");
    const string = this.interaction?.data.options.getString("text") ?? this.args.slice(1).join(" ");
    if (!string || !string.trim()) return this.getString(`commands.responses.base64.${command}NoInput`);
    this.success = true;
    if (command === "decode") {
      const b64Decoded = Buffer.from(string, "base64").toString("utf8");
      return `\`\`\`\n${b64Decoded.replaceAll("`", `\`${String.fromCharCode(8203)}`).replaceAll("@", `@${String.fromCharCode(8203)}`)}\`\`\``;
    }
    if (command === "encode") {
      const b64Encoded = Buffer.from(string, "utf8").toString("base64");
      return `\`\`\`\n${b64Encoded}\`\`\``;
    }
  }

  static flags = [{
    name: "decode",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Decodes a Base64 string",
    options: [{
      name: "text",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The text to decode",
      classic: true,
      required: true
    }]
  }, {
    name: "encode",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Encodes a Base64 string",
    options: [{
      name: "text",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The text to encode",
      classic: true,
      required: true
    }]
  }];

  static description = "Encodes/decodes a Base64 string";
}

export default Base64Command;