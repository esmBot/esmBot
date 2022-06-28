import Command from "../../classes/command.js";

class ServerInfoCommand extends Command {
  async run() {
    if (!this.channel.guild) return "This command only works in servers!";
    const owner = await this.channel.guild.members.get(this.channel.guild.ownerID);
    return {
      embeds: [{
        title: this.channel.guild.name,
        thumbnail: {
          url: this.channel.guild.iconURL
        },
        image: {
          url: this.channel.guild.bannerURL
        },
        color: 16711680,
        fields: [
          {
            name: "🔢 **ID:**",
            value: this.channel.guild.id
          },
          {
            name: "👤 **Owner:**",
            value: owner ? `${owner.user.username}#${owner.user.discriminator}` : this.channel.guild.ownerID
          },
          {
            name: "🗓 **Created on:**",
            value: `<t:${Math.floor(this.channel.guild.createdAt / 1000)}:F>`
          },
          {
            name: "👥 **Users:**",
            value: this.channel.guild.memberCount,
            inline: true
          },
          {
            name: "💬 **Channels:**",
            value: this.channel.guild.channels.size,
            inline: true
          },
          {
            name: "😃 **Emojis:**",
            value: this.channel.guild.emojis.length,
            inline: true
          }
        ]
      }]
    };
  }

  static description = "Gets some info about the server";
  static aliases = ["server"];
  static directAllowed = false;
}

export default ServerInfoCommand;
