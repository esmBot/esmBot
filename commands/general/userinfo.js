import Command from "../../classes/command.js";

class UserInfoCommand extends Command {
  async run() {
    const getUser = this.message.mentions.length >= 1 ? this.message.mentions[0] : (this.args.length !== 0 ? await this.ipc.fetchUser(this.args[0]) : this.message.author);
    let user;
    if (getUser) {
      user = getUser;
    } else if (this.args[0].match(/^<?[@#]?[&!]?\d+>?$/) && this.args[0] >= 21154535154122752n) {
      try {
        user = await this.client.getRESTUser(this.args[0]);
      } catch {
        user = this.message.author;
      }
    } else if (this.args.join(" ") !== "") {
      const userRegex = new RegExp(this.args.join("|"), "i");
      const member = this.client.users.find(element => {
        return userRegex.test(element.username);
      });
      user = member ?? this.message.author;
    } else {
      user = this.message.author;
    }
    const member = this.message.channel.guild ? this.message.channel.guild.members.get(user.id) : undefined;
    return {
      embeds: [{
        title: `${user.username}#${user.discriminator}`,
        thumbnail: {
          url: user.avatarURL
        },
        color: 16711680,
        fields: [
          {
            name: "🔢 **ID:**",
            value: user.id
          },
          {
            name: "📛 **Nickname:**",
            value: member ? (member.nick ?? "None") : "N/A"
          },
          {
            name: "🤖 **Bot:**",
            value: user.bot ? "Yes" : "No"
          },
          {
            name: "🗓️ **Joined Discord on:**",
            value: `<t:${Math.floor(user.createdAt / 1000)}:F>`
          },
          {
            name: "💬 **Joined this server on:**",
            value: member ? `<t:${Math.floor(member.joinedAt / 1000)}:F>` : "N/A"
          }
        ]
      }]
    };
  }

  static description = "Gets info about a user";
  static aliases = ["user"];
  static arguments = ["[mention/id]"];
}

export default UserInfoCommand;
