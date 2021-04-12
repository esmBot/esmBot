const Command = require("../../classes/command.js");

class UserInfoCommand extends Command {
  async run() {
    const getUser = this.message.mentions.length >= 1 ? this.message.mentions[0] : (this.args.length !== 0 ? this.client.users.get(this.args[0]) : this.message.author);
    let user;
    if (getUser) {
      user = getUser;
    } else if (this.args.join(" ") !== "") {
      const userRegex = new RegExp(this.args.join("|"), "i");
      const member = this.client.users.find(element => {
        return userRegex.test(element.username);
      });
      user = member ? member : this.message.author;
    } else {
      user = this.message.author;
    }
    const member = this.message.channel.guild ? this.message.channel.guild.members.get(user.id) : undefined;
    return {
      "embed": {
        "title": `${user.username}#${user.discriminator}`,
        "thumbnail": {
          "url": user.avatarURL
        },
        "color": 16711680,
        "fields": [
          {
            "name": "🔢 **ID:**",
            "value": user.id
          },
          {
            "name": "📛 **Nickname:**",
            "value": member ? (member.nick ? member.nick : "None") : "N/A"
          },
          {
            "name": "🤖 **Bot:**",
            "value": user.bot ? "Yes" : "No"
          },
          {
            "name": "🗓️ **Joined Discord on:**",
            "value": new Date(user.createdAt).toString()
          },
          {
            "name": "💬 **Joined this server on:**",
            "value": member ? new Date(member.joinedAt).toString() : "N/A"
          }
        ]
      }
    };
  }

  static description = "Gets info about a user";
  static aliases = ["user"];
  static arguments = ["[mention/id]"];
}

module.exports = UserInfoCommand;