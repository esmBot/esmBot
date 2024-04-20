import Command from "../../classes/command.js";
import { Routes } from "oceanic.js";
const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;

class BannerCommand extends Command {
  // this command sucks
  async run() {
    const member = this.options.member ?? this.args[0];
    const self = await this.client.rest.users.get(this.author.id); // banners are only available over REST
    if (this.type === "classic" && this.message.mentions.users[0] && this.message.mentions.users[0].banner) {
      return this.client.util.formatImage(Routes.BANNER(this.message.mentions.users[0].id, this.message.mentions.users[0].banner), null, 512);
    } else if (member && member > 21154535154122752n) {
      const user = await this.client.rest.users.get(member);
      if (user?.banner) {
        return this.client.util.formatImage(Routes.BANNER(user.id, user.banner), null, 512);
      } else if (mentionRegex.test(member)) {
        const id = member.match(mentionRegex)[1];
        if (id < 21154535154122752n) {
          this.success = false;
          return "That's not a valid mention!";
        }
        try {
          const user = await this.client.rest.users.get(id);
          return user.banner ? this.client.util.formatImage(Routes.BANNER(user.id, user.banner), null, 512) : "This user doesn't have a banner!";
        } catch {
          return self.banner ? this.client.util.formatImage(Routes.BANNER(self.id, self.banner), null, 512) : "You don't have a banner!";
        }
      } else {
        return "This user doesn't have a banner!";
      }
    } else if (this.args.join(" ") !== "" && this.guild) {
      const searched = await this.guild.searchMembers({
        query: this.args.join(" "),
        limit: 1
      });
      if (searched.length === 0) return self.banner ? this.client.util.formatImage(Routes.BANNER(self.id, self.banner), null, 512) : "This user doesn't have a banner!";
      const user = await this.client.rest.users.get(searched[0].user.id);
      return user.banner ? this.client.util.formatImage(Routes.BANNER(user.id, user.banner), null, 512) : (self.banner ? this.client.util.formatImage(Routes.BANNER(self.id, self.banner), null, 512) : "This user doesn't have a banner!");
    } else {
      return self.banner ? this.client.util.formatImage(Routes.BANNER(self.id, self.banner), null, 512) : "You don't have a banner!";
    }
  }

  static description = "Gets a user's banner";
  static aliases = ["userbanner"];
  static flags = [{
    name: "member",
    type: 6,
    description: "The member to get the banner from",
    classic: true,
    required: false
  }];
}

export default BannerCommand;
