import Command from "#cmd-classes/command.js";
import { mentionToObject } from "#utils/mentions.js";

class TagsRoleRemoveCommand extends Command {
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
    if (!guild.tag_roles.includes(role.id)) return this.getString("commands.responses.tags.missingRole");
    await this.database.removeTagRole(this.guild.id, role.id);
    this.success = true;
    return this.getString("commands.responses.tags.roleRemoved", {
      params: {
        name: role.name,
      },
    });
  }

  static flags = [
    {
      name: "role",
      type: "role",
      description: "The role to remove",
      required: true,
      classic: true,
    },
  ];

  static description = "Remove a role from the allowlist";
  static aliases = ["tags role delete"];
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsRoleRemoveCommand;
