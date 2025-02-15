import database from "../../utils/database.js";
import Command from "../../classes/command.js";
import { Constants } from "oceanic.js";

class PrefixCommand extends Command {
  async run() {
    if (!this.guild) return this.getString("commands.responses.prefix.current", {
      params: {
        prefix: process.env.PREFIX ?? "&"
      }
    });
    const guild = await database?.getGuild(this.guild.id);
    if (this.args.length !== 0) {
      if (!database) {
        return this.getString("commands.responses.prefix.stateless");
      }
      const owners = process.env.OWNER?.split(",") ?? [];
      if (!this.memberPermissions.has("ADMINISTRATOR") && !owners.includes(this.author.id)) {
        this.success = false;
        return this.getString("commands.responses.prefix.adminOnly");
      }
      await database.setPrefix(this.args[0], this.guild);
      return this.getString("commands.responses.prefix.changed", {
        params: {
          prefix: this.args[0]
        }
      });
    }
    return this.getString("commands.responses.prefix.current", {
      params: {
        prefix: guild?.prefix ?? process.env.PREFIX ?? "&"
      }
    });
  }

  static description = "Checks/changes the server prefix";
  static aliases = ["setprefix", "changeprefix", "checkprefix"];
  static flags = [{
    name: "prefix",
    type: Constants.ApplicationCommandOptionTypes.STRING,
    description: "The server prefix you want to use",
    classic: true
  }];
  static slashAllowed = false;
}

export default PrefixCommand;