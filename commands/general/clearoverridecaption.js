import process from "node:process";
import Command from "#cmd-classes/command.js";

class ClearOverrideCaptionCommand extends Command {
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
    if (!user) {
      this.success = false;
      return "You must provide a member.";
    }
    await this.database.clearCaptionOverride(user.id);
    return `Caption override cleared for <@${user.id}>.`;
  }

  static flags = [
    {
      name: "member",
      type: "user",
      description: "The member to clear the caption override for",
      required: true,
      classic: true,
    },
  ];

  static description = "Clears a caption override for a user (owner only)";
  static adminOnly = true;
}

export default ClearOverrideCaptionCommand;
