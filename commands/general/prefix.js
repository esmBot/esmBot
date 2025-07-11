import process from "node:process";
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class PrefixCommand extends Command {
  async run() {
    if (!this.guild)
      return this.getString("commands.responses.prefix.current", {
        params: {
          prefix: process.env.PREFIX ?? "&",
        },
      });
    const guild = await this.database?.getGuild(this.guild.id);
    if (this.args.length !== 0) {
      if (!this.database) {
        return this.getString("commands.responses.prefix.stateless");
      }
      const owners = process.env.OWNER?.split(",") ?? [];
      if (!this.memberPermissions.has("ADMINISTRATOR") && !owners.includes(this.author.id)) {
        this.success = false;
        return this.getString("commands.responses.prefix.adminOnly");
      }
      await this.database.setPrefix(this.args[0], this.guild);
      return this.getString("commands.responses.prefix.changed", {
        params: {
          prefix: this.args[0],
        },
      });
    }
    return this.getString("commands.responses.prefix.current", {
      params: {
        prefix: guild?.prefix ?? process.env.PREFIX ?? "&",
      },
    });
  }

  static description = "Checks/changes the server prefix";
  static aliases = ["setprefix", "changeprefix", "checkprefix"];
  static flags = [
    {
      name: "prefix",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The server prefix you want to use",
      classic: true,
    },
  ];
  static slashAllowed = false;
}

export default PrefixCommand;
