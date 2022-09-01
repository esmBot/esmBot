import Command from "../../classes/command.js";
import { clean } from "../../utils/misc.js";

class Base64Command extends Command {
  async run() {
    this.success = false;
    if (this.type === "classic" && this.args.length === 0) return "You need to provide whether you want to encode or decode the text!";
    const command = this.type === "classic" ? this.args[0].toLowerCase() : this.optionsArray[0].name.toLowerCase();
    if (command !== "decode" && command !== "encode") return "You need to provide whether you want to encode or decode the text!";
    const string = this.options.text ?? this.args.slice(1).join(" ");
    if (!string || !string.trim()) return `You need to provide a string to ${command}!`;
    this.success = true;
    if (command === "decode") {
      const b64Decoded = Buffer.from(string, "base64").toString("utf8");
      return `\`\`\`\n${await clean(b64Decoded)}\`\`\``;
    } else if (command === "encode") {
      const b64Encoded = Buffer.from(string, "utf8").toString("base64");
      return `\`\`\`\n${b64Encoded}\`\`\``;
    }
  }

  static flags = [{
    name: "decode",
    type: 1,
    description: "Decodes a Base64 string",
    options: [{
      name: "text",
      type: 3,
      description: "The text to decode",
      required: true
    }]
  }, {
    name: "encode",
    type: 1,
    description: "Encodes a Base64 string",
    options: [{
      name: "text",
      type: 3,
      description: "The text to encode",
      required: true
    }]
  }];

  static description = "Encodes/decodes a Base64 string";
  static arguments = ["[encode/decode]", "[text]"];
}

export default Base64Command;