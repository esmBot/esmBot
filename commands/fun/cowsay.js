const cowsay = require("cowsay2");
const cows = require("cowsay2/cows");
const Command = require("../../classes/command.js");

class CowsayCommand extends Command {
  async run() {
    if (this.args.length === 0) {
      return "You need to provide some text for the cow to say!";
    } else if (cows[this.args[0].toLowerCase()] != undefined) {
      const cow = cows[this.args.shift().toLowerCase()];
      return `\`\`\`\n${cowsay.say(this.args.join(" "), { cow })}\n\`\`\``;
    } else {
      return `\`\`\`\n${cowsay.say(this.args.join(" "))}\n\`\`\``;
    }
  }

  static description = "Makes an ASCII cow say a message";
  static aliases = ["cow"];
  static arguments = ["{cow}", "[text]"];
}

module.exports = CowsayCommand;