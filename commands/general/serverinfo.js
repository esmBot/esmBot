import Command from "../../classes/command.js";

class ServerInfoCommand extends Command {
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";
    const owner = await this.message.channel.guild.members.get(this.message.channel.guild.ownerID);
    return {
      embeds: [{
        title: this.message.channel.guild.name,
        thumbnail: {
          url: this.message.channel.guild.iconURL
        },
        image: {
          url: this.message.channel.guild.bannerURL
        },
        color: 16711680,
        fields: [
          {
            name: "🔢 **ID:**",
            value: this.message.channel.guild.id
          },
          {
            name: "👤 **Owner:**",
            value: owner ? `${owner.user.username}#${owner.user.discriminator}` : this.message.channel.guild.ownerID
          },
          {
            name: "🗓 **Created on:**",
            value: `<t:${Math.floor(this.message.channel.guild.createdAt / 1000)}:F>`
          },
          {
            name: "👥 **Users:**",
            value: this.message.channel.guild.memberCount,
            inline: true
          },
          {
            name: "💬 **Channels:**",
            value: this.message.channel.guild.channels.size,
            inline: true
          },
          {
            name: "😃 **Emojis:**",
            value: this.message.channel.guild.emojis.length,
            inline: true
          }
        ]
      }]
    };
  }

  static description = "Gets some info about the server";
  static aliases = ["server"];
}

export default ServerInfoCommand;
