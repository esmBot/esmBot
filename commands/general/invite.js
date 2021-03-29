const Command = require("../../classes/command.js");

class InviteCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    return `${this.message.author.mention}, you can invite me to your server here: <https://projectlounge.pw/invite>`;
  }

  static description = "Gets my invite link";
  static aliases = ["botinfo", "credits"];
}

module.exports = InviteCommand;