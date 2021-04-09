const Command = require("../../classes/command.js");

class ServerInfoCommand extends Command {
  async run() {
    if (!this.message.channel.guild) return `${this.message.author.mention}, this command only works in servers!`;
    const owner = await this.message.channel.guild.members.get(this.message.channel.guild.ownerID);
    return {
      "embed": {
        "title": this.message.channel.guild.name,
        "thumbnail": {
          "url": this.message.channel.guild.iconURL
        },
        "color": 16711680,
        "fields": [
          {
            "name": "🔢 **ID:**",
            "value": this.message.channel.guild.id
          },
          {
            "name": "👤 **Owner:**",
            "value": owner ? `${owner.user.username}#${owner.user.discriminator}` : this.message.channel.guild.ownerID
          },
          {
            "name": "🗺 **Region:**",
            "value": this.message.channel.guild.region
          },
          {
            "name": "🗓 **Created on:**",
            "value": new Date(this.message.channel.guild.createdAt).toString()
          },
          {
            "name": "👥 **Users:**",
            "value": this.message.channel.guild.memberCount
          },
          {
            "name": "💬 **Channels:**",
            "value": this.message.channel.guild.channels.size
          },
          {
            "name": "😃 **Emojis:**",
            "value": this.message.channel.guild.emojis.length
          }
        ]
      }
    };
  }

  static description = "Gets some info about the server";
  static aliases = ["server"];
}

module.exports = ServerInfoCommand;