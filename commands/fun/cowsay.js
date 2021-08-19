import { say } from "cowsay2";
import cows from "cowsay2/cows/index.js";
import Command from "../../classes/command.js";

class CowsayCommand extends Command {
  async run() {
    if (this.args.length === 0) {
      return "You need to provide some text for the cow to say!";
    } else if (cows[this.args[0].toLowerCase()] != undefined) {
      const cow = cows[this.args.shift().toLowerCase()];
      return `\`\`\`\n${say(this.args.join(" "), { cow })}\n\`\`\``;
    } else {
      return `\`\`\`\n${say(this.args.join(" "))}\n\`\`\``;
    }
  }

  static description = "Makes an ASCII cow say a message";
  static aliases = ["cow"];
  static arguments = ["{cow}", "[text]"];
}

export default CowsayCommand;