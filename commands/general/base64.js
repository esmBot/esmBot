import Command from "#cmd-classes/command.js";

class Base64Command extends Command {
  async run() {
    this.success = false;
    return this.getString("commands.responses.base64.noCmd");
  }

  static description = "Encodes/decodes a Base64 string";
  static aliases = ["b64"];
}

export default Base64Command;
