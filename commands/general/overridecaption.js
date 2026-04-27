import process from "node:process";
import Command from "#cmd-classes/command.js";

class OverrideCaptionCommand extends Command {
  async run() {
    const owners = process.env.OWNER?.split(",") ?? [];
    if (!owners.includes(this.author.id)) {
      this.success = false;
      return "This command is only available to the bot owner.";
    }
    if (!this.database) {
      this.success = false;
      return "No database configured.";
    }
    const user = this.getOptionUser("member");
    const link = this.getOptionString("link");
    if (!user || !link) {
      this.success = false;
      return "You must provide a member and a link.";
    }
    await this.database.setCaptionOverride(user.id, link);
    return `Caption override set for <@${user.id}>: ${link}`;
  }

  static flags = [
    {
      name: "member",
      type: "user",
      description: "The member to set the caption override for",
      required: true,
      classic: true,
    },
    {
      name: "link",
      type: "string",
      description: "The URL to return when this member uses the caption command",
      required: true,
      classic: true,
    },
  ];

  static description = "Sets a caption override for a user (owner only)";
  static adminOnly = true;
}

export default OverrideCaptionCommand;
