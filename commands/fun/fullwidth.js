import Command from "../../classes/command.js";

class FullwidthCommand extends Command {
  async run() {
    if (this.args.length === 0) return "You need to provide some text to convert to fullwidth!";
    return this.args.join("").replaceAll(/[A-Za-z0-9]/g, (s) => { return String.fromCharCode(s.charCodeAt(0) + 0xFEE0); });
  }

  static description = "Converts a message to fullwidth/aesthetic text";
  static aliases = ["aesthetic", "aesthetics", "aes"];
  static arguments = ["[text]"];
}

export default FullwidthCommand;