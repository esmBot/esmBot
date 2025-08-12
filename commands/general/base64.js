import Command from "#cmd-classes/command.js";

class Base64Command extends Command {
  static description = "Encodes/decodes a Base64 string";
  static aliases = ["b64"];
}

export default Base64Command;
