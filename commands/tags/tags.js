import process from "node:process";
import { Constants } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import paginator from "#pagination";
import { random } from "#utils/misc.js";
import { mentionToObject } from "#utils/mentions.js";
const blacklist = ["create", "add", "edit", "remove", "delete", "list", "random", "own", "owner"];

// todo: implement proper subcommand support in the command handler
class TagsCommand extends Command {
  async run() {
    this.success = false;
    if (!this.database) return this.getString("noDatabase");
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const cmd =
      this.type === "classic"
        ? (this.args[0] ?? "").toLowerCase()
        : this.interaction?.data.options.getSubCommand()?.[0];
    if (!cmd || !cmd.trim()) return this.getString("commands.responses.tags.noInput");
    const tagName = this.type === "classic" ? this.args.slice(1)[0] : this.getOptionString("name");

    switch (cmd) {
      case "create":
      case "add":
        return await this.create(tagName);
      case "delete":
      case "remove":
        return await this.delete(tagName);
      case "edit":
        return await this.modify(tagName);
      case "owner":
      case "own":
        return await this.owner(tagName);
      case "list":
        return await this.list();
      case "role":
        return this.role();
      default:
        return await this.get(tagName, cmd);
    }
  }

  /**
   * @param {string | undefined} tagName
   * @param {string} cmd
   */
  async get(tagName, cmd) {
    if (!this.database || !this.guild || !tagName) return;
    let getResult;
    if (cmd === "random") {
      const tagList = await this.database.getTags(this.guild.id);
      getResult = tagList[random(Object.keys(tagList))];
    } else {
      getResult = await this.database.getTag(this.guild.id, this.type === "classic" ? cmd : tagName);
    }
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    this.success = true;
    if (getResult.content.length > 2000) {
      return {
        embeds: [
          {
            color: 0xff0000,
            description: getResult.content,
          },
        ],
      };
    }
    return getResult.content;
  }

  /**
   * @param {string | undefined} tagName
   */
  async create(tagName) {
    if (!this.database || !this.guild) return;
    const owners = process.env.OWNER?.split(",") ?? [];
    const privileged = this.memberPermissions.has("ADMINISTRATOR") || owners.includes(this.author.id);
    const guild = await this.database.getGuild(this.guild.id);
    const setConv = new Set(guild.tag_roles);
    if (
      !privileged &&
      !setConv.has(this.guild.id) &&
      (!this.member || this.member.roles.filter((r) => setConv.has(r)).length == 0)
    )
      return this.getString("commands.responses.tags.noRolePerms");
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.addName");
    if (blacklist.includes(tagName)) return this.getString("commands.responses.tags.invalidName");
    const getResult = await this.database.getTag(this.guild.id, tagName);
    if (getResult) return this.getString("commands.responses.tags.exists");
    await this.database.setTag(
      {
        name: tagName,
        content: this.interaction
          ? this.interaction.data.options.getString("content", true)
          : this.args.slice(2).join(" "),
        author: this.author.id,
      },
      this.guild,
    );
    this.success = true;
    return this.getString("commands.responses.tags.added", {
      params: {
        name: tagName,
      },
    });
  }

  /**
   * @param {string | undefined} tagName
   */
  async delete(tagName) {
    if (!this.database || !this.guild) return;
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.deleteName");
    const getResult = await this.database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    const owners = process.env.OWNER?.split(",");
    if (
      getResult.author !== this.author.id &&
      !this.memberPermissions.has("MANAGE_MESSAGES") &&
      !owners?.includes(this.author.id)
    )
      return this.getString("commands.responses.tags.notOwner");
    await this.database.removeTag(tagName, this.guild);
    this.success = true;
    return this.getString("commands.responses.tags.deleted", {
      params: {
        name: tagName,
      },
    });
  }

  /**
   * @param {string | undefined} tagName
   */
  async modify(tagName) {
    if (!this.database || !this.guild) return;
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.editName");
    const getResult = await this.database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    const owners = process.env.OWNER?.split(",");
    if (
      getResult.author !== this.author.id &&
      !this.memberPermissions.has("MANAGE_MESSAGES") &&
      !owners?.includes(this.author.id)
    )
      return this.getString("commands.responses.tags.notOwner");
    await this.database.editTag(
      {
        name: tagName,
        content: this.interaction
          ? this.interaction.data.options.getString("content", true)
          : this.args.slice(2).join(" "),
        author: this.author.id,
      },
      this.guild,
    );
    this.success = true;
    return this.getString("commands.responses.tags.edited", {
      params: {
        name: tagName,
      },
    });
  }

  /**
   * @param {string | undefined} tagName
   */
  async owner(tagName) {
    if (!this.database || !this.guild) return;
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.ownerName");
    const getResult = await this.database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    const user = this.client.users.get(getResult.author);
    this.success = true;
    if (!user) {
      try {
        const restUser = await this.client.rest.users.get(getResult.author);
        return this.getString("commands.responses.tags.ownedBy", {
          params: {
            user: restUser.username,
            id: getResult.author,
          },
        });
      } catch {
        return this.getString("commands.responses.tags.ownedById", {
          params: {
            id: getResult.author,
          },
        });
      }
    } else {
      return this.getString("commands.responses.tags.ownedBy", {
        params: {
          user: user?.username,
          id: getResult.author,
        },
      });
    }
  }

  async list() {
    if (!this.database || !this.guild) return;
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const tagList = await this.database.getTags(this.guild.id);
    const embeds = [];
    const groups = [];
    let arrIndex = 0;
    const keys = Object.keys(tagList);
    for (let i = 0; i < keys.length; i += 15) {
      groups[arrIndex] = keys.slice(i, i + 15);
      arrIndex++;
    }
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [
          {
            title: this.getString("commands.responses.tags.list"),
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
    if (embeds.length === 0) return this.getString("commands.responses.tags.noTags");
    this.success = true;
    return paginator(
      this.client,
      { message: this.message, interaction: this.interaction, author: this.author },
      embeds,
    );
  }

  async role() {
    if (!this.database || !this.guild) return;
    const subcommand =
      this.type === "classic"
        ? (this.args.slice(1)[0] ?? "").toLowerCase()
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
        return this.get("role", "role");
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

  static description = "The main tags command. Check the help page for more info: https://esmbot.net/help.html";
  static aliases = ["t", "tag", "ta"];

  static subArgs(needsContent = false) {
    const args = [
      {
        name: "name",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        description: "The name of the tag",
        required: true,
        classic: true,
      },
    ];
    if (needsContent)
      args.push({
        name: "content",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        description: "The content of the tag",
        required: true,
        classic: true,
      });
    return args;
  }

  static flags = [
    {
      name: "add",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Adds a new tag",
      options: this.subArgs(true),
    },
    {
      name: "delete",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Deletes a tag",
      options: this.subArgs(),
    },
    {
      name: "edit",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Edits an existing tag",
      options: this.subArgs(true),
    },
    {
      name: "get",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Gets a tag",
      options: this.subArgs(),
    },
    {
      name: "list",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Lists every tag in this server",
    },
    {
      name: "owner",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Gets the owner of a tag",
      options: this.subArgs(),
    },
    {
      name: "random",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      description: "Gets a random tag",
    },
    {
      name: "role",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
      description: "Manage role permissions for tags",
      options: [
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
      ],
    },
  ];
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsCommand;
