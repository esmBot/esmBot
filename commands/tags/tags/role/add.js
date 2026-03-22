import Command from "#cmd-classes/command.js";
import { mentionToObject } from "#utils/mentions.js";

class TagsRoleAddCommand extends Command {
  async run() {
    this.success = false;
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    const owners = process.env.OWNER?.split(",");
    if (!this.memberPermissions.has("MANAGE_MESSAGES") && !owners?.includes(this.author.id))
      return this.getString("commands.responses.tags.notOwnerRole");

    let role = this.type === "classic" ? this.args.slice(2)[0] : this.getOptionRole("role");
    if (typeof role === "string") {
      if (role === "@everyone" || role === "everyone") {
        role = this.guild.id;
      }
      role = await mentionToObject(this.client, role, "role", {
        guild: this.guild,
      });
    }

    if (!role) return this.getString("commands.responses.tags.noRole");
    const guild = await this.database.getGuild(this.guild.id);
    if (guild.tag_roles.includes(role.id)) return this.getString("commands.responses.tags.existingRole");
    await this.database.addTagRole(this.guild.id, role.id);
    this.success = true;
    return this.getString("commands.responses.tags.roleAdded", {
      params: {
        name: role.name,
      },
    });
  }

  static flags = [
    {
      name: "role",
      type: "role",
      description: "The role to add",
      required: true,
      classic: true,
    },
  ];

  static description = "Allow a role to manage tags";
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsRoleAddCommand;
