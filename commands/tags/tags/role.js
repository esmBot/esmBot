import { Constants } from "oceanic.js";
import paginator from "#pagination";
import { mentionToObject } from "#utils/mentions.js";
import TagsGetCommand from "./get.js";

class TagsRoleCommand extends TagsGetCommand {
  async run() {
    this.success = false;
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const subcommand =
      this.type === "classic"
        ? (this.args[0] ?? "").toLowerCase()
        : this.interaction?.data.options.getSubCommand()?.[1];

    switch (subcommand) {
      case "add":
        return this.roleAdd();
      case "delete":
      case "remove":
        return this.roleRemove();
      case "list":
        return this.roleList();
      default:
        return super.run();
    }
  }

  async roleAdd() {
    if (!this.database || !this.guild) return;
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

  async roleRemove() {
    if (!this.database || !this.guild) return;
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

  async roleList() {
    if (!this.database || !this.guild) return;
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const guild = await this.database.getGuild(this.guild.id);
    const embeds = [];
    const groups = [];
    let arrIndex = 0;
    const roleMentions = guild.tag_roles.map((v) => `<@&${v}>`);
    for (let i = 0; i < roleMentions.length; i += 15) {
      groups[arrIndex] = roleMentions.slice(i, i + 15);
      arrIndex++;
    }
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [
          {
            title: this.getString("commands.responses.tags.roleList"),
            color: 0xff0000,
            footer: {
              text: this.getString("pagination.page", {
                params: {
                  page: (i + 1).toString(),
                  amount: groups.length.toString(),
                },
              }),
            },
            description: value?.join("\n"),
            author: {
              name: this.author.username,
              iconURL: this.author.avatarURL(),
            },
          },
        ],
      });
    }
    if (embeds.length === 0) return this.getString("commands.responses.tags.noRoles");
    this.success = true;
    return paginator(
      this.client,
      { message: this.message, interaction: this.interaction, author: this.author },
      embeds,
    );
  }

  static flags = [
    {
      name: "add",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Allow a role to manage tags",
      options: [
        {
          name: "role",
          type: Constants.ApplicationCommandOptionTypes.ROLE,
          description: "The role to add",
          required: true,
          classic: true,
        },
      ],
    },
    {
      name: "remove",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Remove a role from the allowlist",
      options: [
        {
          name: "role",
          type: Constants.ApplicationCommandOptionTypes.ROLE,
          description: "The role to remove",
          required: true,
          classic: true,
        },
      ],
    },
    {
      name: "list",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "List the roles that are capable of managing tags",
    },
  ];

  static description = "Manage role permissions for tags";
  static tag = "role";
}

export default TagsRoleCommand;
