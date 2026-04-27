import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class FriendCommand extends Command {
  async run() {
    if (!this.guild) return "This command can only be used in a server.";

    const target = this.getOptionUser("member") ?? this.message?.mentions.users[0];
    if (!target) return "Please mention a user to befriend.";

    const username = target.username.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const channelName = `friend-${username}`;

    const channel = await this.client.rest.guilds.createChannel(this.guild.id, {
      name: channelName,
      type: Constants.ChannelTypes.GUILD_TEXT,
    });

    for (let i = 0; i < 50; i++) {
      await this.client.rest.channels.createMessage(channel.id, {
        content: `<@${target.id}> you are my friend!`,
      });
    }

    return `Created <#${channel.id}> and welcomed your new friend!`;
  }

  static description = "Creates a friend channel and welcomes your new friend";
  static flags = [
    {
      name: "member",
      type: "user",
      description: "The user to befriend",
      classic: true,
      required: true,
    },
  ];
}

export default FriendCommand;
