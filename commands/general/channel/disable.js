import { GuildChannel } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { safeBigInt } from "#utils/misc.js";

class ChannelDisableCommand extends Command {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.database) return this.getString("noDatabase");
    if (!this.channel) throw Error("No channel found");
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!this.memberPermissions.has("ADMINISTRATOR") && !owners.includes(this.author.id))
      return this.getString("commands.responses.channel.adminOnly");

    const channelId = this.getOptionString("channel", true);
    const guildDB = await this.database.getGuild(this.guild.id);

    let channel;
    if (channelId?.match(/^<?[@#]?[&!]?\d+>?$/) && safeBigInt(channelId) >= 21154535154122752n) {
      const id = channelId
        .replaceAll("@", "")
        .replaceAll("#", "")
        .replaceAll("!", "")
        .replaceAll("&", "")
        .replaceAll("<", "")
        .replaceAll(">", "");
      if (guildDB.disabled.includes(id)) return this.getString("commands.responses.channel.alreadyDisabled");
      channel = this.guild.channels.get(id) ?? (await this.client.rest.channels.get(id));
    } else {
      if (guildDB.disabled.includes(this.channel.id))
        return this.getString("commands.responses.channel.alreadyDisabled");
      channel = this.channel;
    }
    if (!(channel instanceof GuildChannel) || channel.guildID !== this.guild.id)
      return this.getString("commands.responses.channel.notInServer");

    await this.database.disableChannel(channel.id, channel.guildID);
    this.success = true;
    return this.getString("commands.responses.channel.disabled", {
      params: {
        prefix: guildDB.prefix,
      },
    });
  }

  static description = "Disables classic commands in a channel";
  static flags = [
    {
      name: "channel",
      type: "string",
      description: "The channel to disable",
      classic: true,
    },
  ];
  static slashAllowed = false;
  static directAllowed = false;
  static dbRequired = true;
}

export default ChannelDisableCommand;
