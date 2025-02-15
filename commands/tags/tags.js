import database from "../../utils/database.js";
import paginator from "../../utils/pagination/pagination.js";
import { random } from "../../utils/misc.js";
import Command from "../../classes/command.js";
import { Constants } from "oceanic.js";
const blacklist = ["create", "add", "edit", "remove", "delete", "list", "random", "own", "owner"];

class TagsCommand extends Command {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const cmd = this.type === "classic" ? (this.args[0] ?? "").toLowerCase() : this.interaction?.data.options.getSubCommand()?.[0];
    if (!cmd || !cmd.trim()) return this.getString("commands.responses.tags.noInput");
    const tagName = this.type === "classic" ? this.args.slice(1)[0] : this.interaction?.data.options.getString("name");

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
      default:
        return await this.get(tagName, cmd);
    }    
  }

  /**
   * @param {string} tagName
   * @param {string} cmd
   */
  async get(tagName, cmd) {
    let getResult;
    if (cmd === "random") {
      const tagList = await database.getTags(this.guild.id);
      getResult = tagList[random(Object.keys(tagList))];
    } else {
      getResult = await database.getTag(this.guild.id, this.type === "classic" ? cmd : tagName);
    }
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    this.success = true;
    if (getResult.content.length > 2000) {
      return {
        embeds: [{
          color: 0xff0000,
          description: getResult.content
        }],
      };
    }
    return getResult.content;
  }

  /**
   * @param {string} tagName
   */
  async create(tagName) {
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.addName");
    if (blacklist.includes(tagName)) return this.getString("commands.responses.tags.invalidName");
    const getResult = await database.getTag(this.guild.id, tagName);
    if (getResult) return this.getString("commands.responses.tags.exists");
    const result = await database.setTag(tagName, { content: this.type === "classic" ? this.args.slice(2).join(" ") : this.interaction?.data.options.getString("content", true), author: this.member?.id }, this.guild);
    this.success = true;
    if (result) return result;
    return this.getString("commands.responses.tags.added", {
      params: {
        name: tagName
      }
    });
  }

  /**
   * @param {string} tagName
   */
  async delete(tagName) {
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.deleteName");
    const getResult = await database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    const owners = process.env.OWNER?.split(",");
    if (getResult.author !== this.author.id && !this.memberPermissions.has("MANAGE_MESSAGES") && !owners?.includes(this.author.id)) return this.getString("commands.responses.tags.notOwner");
    await database.removeTag(tagName, this.guild);
    this.success = true;
    return this.getString("commands.responses.tags.deleted", {
      params: {
        name: tagName
      }
    });
  }

  /**
   * @param {string} tagName
   */
  async modify(tagName) {
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.editName");
    const getResult = await database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    const owners = process.env.OWNER?.split(",");
    if (getResult.author !== this.author.id && !this.memberPermissions.has("MANAGE_MESSAGES") && !owners?.includes(this.author.id)) return this.getString("commands.responses.tags.notOwner");
    await database.editTag(tagName, { content: this.type === "classic" ? this.args.slice(2).join(" ") : this.interaction?.data.options.getString("content", true), author: this.member?.id }, this.guild);
    this.success = true;
    return this.getString("commands.responses.tags.edited", {
      params: {
        name: tagName
      }
    });
  }

  /**
   * @param {string} tagName
   */
  async owner(tagName) {
    if (!tagName || !tagName.trim()) return this.getString("commands.responses.tags.ownerName");
    const getResult = await database.getTag(this.guild.id, tagName);
    if (!getResult) return this.getString("commands.responses.tags.invalid");
    const user = this.client.users.get(getResult.author);
    this.success = true;
    if (!user) {
      try {
        const restUser = await this.client.rest.users.get(getResult.author);
        return this.getString("commands.responses.tags.ownedBy", {
          params: {
            user: restUser.username,
            id: getResult.author
          }
        });
      } catch {
        return this.getString("commands.responses.tags.ownedById", {
          params: {
            id: getResult.author
          }
        });
      }
    } else {
      return this.getString("commands.responses.tags.ownedBy", {
        params: {
          user: user?.username,
          id: getResult.author
        }
      });
    }
  }

  async list() {
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const tagList = await database.getTags(this.guild.id);
    const embeds = [];
    const groups = Object.keys(tagList).map((_item, index) => {
      return index % 15 === 0 ? Object.keys(tagList).slice(index, index + 15) : null;
    }).filter((item) => {
      return item;
    });
    for (const [i, value] of groups.entries()) {
      embeds.push({
        embeds: [{
          title: this.getString("commands.responses.tags.list"),
          color: 0xff0000,
          footer: {
            text: this.getString("pagination.page", {
              params: {
                page: i + 1,
                amount: groups.length
              }
            })
          },
          description: value?.join("\n"),
          author: {
            name: this.author.username,
            iconURL: this.author.avatarURL()
          }
        }]
      });
    }
    if (embeds.length === 0) return this.getString("commands.responses.tags.noTags");
    this.success = true;
    return paginator(this.client, { type: this.type, message: this.message, interaction: this.interaction, author: this.author }, embeds);
  }

  static description = "The main tags command. Check the help page for more info: https://esmbot.net/help.html";
  static aliases = ["t", "tag", "ta"];

  static subArgs(needsContent = false) {
    const args = [{
      name: "name",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The name of the tag",
      required: true,
      classic: true
    }];
    if (needsContent) args.push({
      name: "content",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      description: "The content of the tag",
      required: true,
      classic: true
    });
    return args;
  }

  static flags = [{
    name: "add",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Adds a new tag",
    options: this.subArgs(true)
  }, {
    name: "delete",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Deletes a tag",
    options: this.subArgs()
  }, {
    name: "edit",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Edits an existing tag",
    options: this.subArgs(true)
  }, {
    name: "get",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Gets a tag",
    options: this.subArgs()
  }, {
    name: "list",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Lists every tag in this server"
  }, {
    name: "owner",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Gets the owner of a tag",
    options: this.subArgs()
  }, {
    name: "random",
    type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
    description: "Gets a random tag"
  }];
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsCommand;
