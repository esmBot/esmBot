import db from "../../utils/database.js";
import Command from "../../classes/command.js";

class ChannelCommand extends Command {
  async run() {
    if (this.type !== "classic") return "This command only works with the old command style!";
    if (!this.message.channel.guild) return "This command only works in servers!";
    const owners = process.env.OWNER.split(",");
    if (!this.message.member.permissions.has("administrator") && !owners.includes(this.message.member.id)) return "You need to be an administrator to enable/disable me!";
    if (this.args.length === 0) return "You need to provide whether I should be enabled or disabled in this channel!";
    if (this.args[0] !== "disable" && this.args[0] !== "enable") return "That's not a valid option!";

    const guildDB = await db.getGuild(this.message.channel.guild.id);

    if (this.args[0].toLowerCase() === "disable") {
      let channel;
      if (this.args[1] && this.args[1].match(/^<?[@#]?[&!]?\d+>?$/) && this.args[1] >= 21154535154122752n) {
        const id = this.args[1].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "");
        if (guildDB.disabled.includes(id)) return "I'm already disabled in this channel!";
        channel = this.message.channel.guild.channels.get(id);
      } else {
        if (guildDB.disabled.includes(this.message.channel.id)) return "I'm already disabled in this channel!";
        channel = this.message.channel;
      }

      await db.disableChannel(channel);
      return `I have been disabled in this channel. To re-enable me, just run \`${guildDB.prefix}channel enable\`.`;
    } else if (this.args[0].toLowerCase() === "enable") {
      let channel;
      if (this.args[1] && this.args[1].match(/^<?[@#]?[&!]?\d+>?$/) && this.args[1] >= 21154535154122752n) {
        const id = this.args[1].replaceAll("@", "").replaceAll("#", "").replaceAll("!", "").replaceAll("&", "").replaceAll("<", "").replaceAll(">", "");
        if (!guildDB.disabled.includes(id)) return "I'm not disabled in that channel!";
        channel = this.message.channel.guild.channels.get(id);
      } else {
        if (!guildDB.disabled.includes(this.message.channel.id)) return "I'm not disabled in this channel!";
        channel = this.message.channel;
      }

      await db.enableChannel(channel);
      return "I have been re-enabled in this channel.";
    }
  }

  static description = "Enables/disables me in a channel (does not work with slash commands)";
  static arguments = ["[enable/disable]", "{id}"];
  static slashAllowed = false;
}

export default ChannelCommand;
