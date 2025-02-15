import db from "../../utils/database.js";
import Command from "../../classes/command.js";
import { Constants, GuildChannel } from "oceanic.js";

class ChannelCommand extends Command {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!db) return this.getString("noDatabase");
    if (!this.channel) throw Error("No channel found");
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!this.memberPermissions.has("ADMINISTRATOR") && !owners.includes(this.author.id)) return this.getString("commands.responses.channel.adminOnly");
    if (this.args.length === 0) return this.getString("commands.responses.channel.noCmd");
    if (this.args[0] !== "disable" && this.args[0] !== "enable") return this.getString("commands.responses.channel.invalid");

    const guildDB = await db.getGuild(this.guild.id);

    if (this.args[0].toLowerCase() === "disable") {
      let channel;
      if (this.args[1]?.match(/^<?[@#]?[&!]?\d+>?$/) && BigInt(this.args[1]) >= 21154535154122752n) {
        const id = this.args[1].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "");
        if (guildDB.disabled.includes(id)) return this.getString("commands.responses.channel.alreadyDisabled");
        channel = this.guild.channels.get(id) ?? await this.client.rest.channels.get(id);
      } else {
        if (guildDB.disabled.includes(this.channel.id)) return this.getString("commands.responses.channel.alreadyDisabled");
        channel = this.channel;
      }
      if (!(channel instanceof GuildChannel) || channel.guildID !== this.guild.id) return this.getString("commands.responses.channel.notInServer");

      await db.disableChannel(channel);
      this.success = true;
      return this.getString("commands.responses.channel.disabled", {
        params: {
          prefix: guildDB.prefix
        }
      });
    }
    if (this.args[0].toLowerCase() === "enable") {
      let channel;
      if (this.args[1]?.match(/^<?[@#]?[&!]?\d+>?$/) && BigInt(this.args[1]) >= 21154535154122752n) {
        const id = this.args[1].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "");
        if (!guildDB.disabled.includes(id)) return this.getString("commands.responses.channel.notDisabled");
        channel = this.guild.channels.get(id) ?? await this.client.rest.channels.get(id);
      } else {
        if (!guildDB.disabled.includes(this.channel.id)) return this.getString("commands.responses.channel.notDisabled");
        channel = this.channel;
      }
      if (!(channel instanceof GuildChannel) || channel.guildID !== this.guild.id) return this.getString("commands.responses.channel.notInServer");

      await db.enableChannel(channel);
      this.success = true;
      return this.getString("commands.responses.channel.reEnabled");
    }
  }

  static description = "Enables/disables classic commands in a channel (use server settings for slash commands)";
  static flags = [{
    name: "enable",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Enables classic commands in a channel",
    options: [{
      name: "text",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The text to decode",
      classic: true,
      required: false
    }]
  }, {
    name: "disable",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Disables classic commands in a channel",
    options: [{
      name: "text",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The text to encode",
      classic: true,
      required: false
    }]
  }];
  static slashAllowed = false;
  static directAllowed = false;
  static dbRequired = true;
}

export default ChannelCommand;
