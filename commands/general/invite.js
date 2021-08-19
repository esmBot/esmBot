import Command from "../../classes/command.js";

class InviteCommand extends Command {
  async run() {
    return "You can invite me to your server here: <https://projectlounge.pw/invite>";
  }

  static description = "Gets my invite link";
  static aliases = ["botinfo", "credits"];
}

export default InviteCommand;