import database from "../../utils/database.js";
import Command from "../../classes/command.js";

class PrefixCommand extends Command {
  async run() {
    if (!this.guild) return `The current prefix is \`${process.env.PREFIX}\`.`;
    const guild = await database.getGuild(this.guild.id);
    if (this.args.length !== 0) {
      if (!database) {
        return "Setting a per-guild prefix is not possible on a stateless instance of esmBot!";
      }
      const owners = process.env.OWNER.split(",");
      if (!this.member.permissions.has("ADMINISTRATOR") && !owners.includes(this.member.id)) {
        this.success = false;
        return "You need to be an administrator to change the bot prefix!";
      }
      await database.setPrefix(this.args[0], this.guild);
      return `The prefix has been changed to ${this.args[0]}.`;
    } else {
      return `The current prefix is \`${guild.prefix}\`.`;
    }
  }

  static description = "Checks/changes the server prefix";
  static aliases = ["setprefix", "changeprefix", "checkprefix"];
  static arguments = ["{prefix}"];
  static slashAllowed = false;
}

export default PrefixCommand;