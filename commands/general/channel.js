import db from "../../utils/database.js";
import Command from "../../classes/command.js";

class ChannelCommand extends Command {
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    const owners = process.env.OWNER.split(",");
    if (!this.memberPermissions.has("ADMINISTRATOR") && !owners.includes(this.member.id)) return "You need to be an administrator to enable/disable me!";
    if (this.args.length === 0) return "You need to provide whether I should be enabled or disabled in this channel!";
    if (this.args[0] !== "disable" && this.args[0] !== "enable") return "That's not a valid option!";

    const guildDB = await db.getGuild(this.guild.id);

    if (this.args[0].toLowerCase() === "disable") {
      let channel;
      if (this.args[1]?.match(/^<?[@#]?[&!]?\d+>?$/) && this.args[1] >= 21154535154122752n) {
        const id = this.args[1].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "");
        if (guildDB.disabled.includes(id)) return "I'm already disabled in this channel!";
        channel = this.guild.channels.get(id) ?? await this.client.rest.channels.get(id);
      } else {
        if (guildDB.disabled.includes(this.channel.id)) return "I'm already disabled in this channel!";
        channel = this.channel;
      }
      if (channel.guildID !== this.guild.id) return "That channel isn't in this server!";

      await db.disableChannel(channel);
      this.success = true;
      return `I have been disabled in this channel. To re-enable me, just run \`${guildDB.prefix}channel enable\`.`;
    } else if (this.args[0].toLowerCase() === "enable") {
      let channel;
      if (this.args[1]?.match(/^<?[@#]?[&!]?\d+>?$/) && this.args[1] >= 21154535154122752n) {
        const id = this.args[1].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "");
        if (!guildDB.disabled.includes(id)) return "I'm not disabled in that channel!";
        channel = this.guild.channels.get(id) ?? await this.client.rest.channels.get(id);
      } else {
        if (!guildDB.disabled.includes(this.channel.id)) return "I'm not disabled in this channel!";
        channel = this.channel;
      }
      if (channel.guildID !== this.guild.id) return "That channel isn't in this server!";

      await db.enableChannel(channel);
      this.success = true;
      return "I have been re-enabled in this channel.";
    }
  }

  static description = "Enables/disables classic commands in a channel (use server settings for slash commands)";
  static flags = [{
    name: "enable",
    type: 1,
    description: "Enables classic commands in a channel",
    options: [{
      name: "text",
      type: 3,
      description: "The text to decode",
      classic: true,
      required: false
    }]
  }, {
    name: "disable",
    type: 1,
    description: "Disables classic commands in a channel",
    options: [{
      name: "text",
      type: 3,
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
