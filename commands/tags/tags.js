import database from "../../utils/database.js";
import paginator from "../../utils/pagination/pagination.js";
import { random } from "../../utils/misc.js";
import Command from "../../classes/command.js";
const blacklist = ["create", "add", "edit", "remove", "delete", "list", "random", "own", "owner"];

class TagsCommand extends Command {
  async run() {
    this.success = false;
    if (!this.guild) return this.getString("guildOnly");
    if (!this.permissions.has("EMBED_LINKS")) return this.getString("permissions.noEmbedLinks");
    const cmd = this.type === "classic" ? (this.args[0] ?? "").toLowerCase() : this.interaction?.data.options.getSubCommand()?.[0];
    if (!cmd || !cmd.trim()) return "You need to provide the name of the tag you want to view!";
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
    if (!getResult) return "This tag doesn't exist!";
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
    if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to add!";
    if (blacklist.includes(tagName)) return "You can't make a tag with that name!";
    const getResult = await database.getTag(this.guild.id, tagName);
    if (getResult) return "This tag already exists!";
    const result = await database.setTag(tagName, { content: this.type === "classic" ? this.args.slice(2).join(" ") : this.interaction?.data.options.getString("content", true), author: this.member?.id }, this.guild);
    this.success = true;
    if (result) return result;
    return `The tag \`${tagName}\` has been added!`;
  }

  /**
   * @param {string} tagName
   */
  async delete(tagName) {
    if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to delete!";
    const getResult = await database.getTag(this.guild.id, tagName);
    if (!getResult) return "This tag doesn't exist!";
    const owners = process.env.OWNER?.split(",");
    if (getResult.author !== this.author.id && !this.memberPermissions.has("MANAGE_MESSAGES") && !owners?.includes(this.author.id)) return "You don't own this tag!";
    await database.removeTag(tagName, this.guild);
    this.success = true;
    return `The tag \`${tagName}\` has been deleted!`;
  }

  /**
   * @param {string} tagName
   */
  async modify(tagName) {
    if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to edit!";
    const getResult = await database.getTag(this.guild.id, tagName);
    if (!getResult) return "This tag doesn't exist!";
    const owners = process.env.OWNER?.split(",");
    if (getResult.author !== this.author.id && !this.memberPermissions.has("MANAGE_MESSAGES") && !owners?.includes(this.author.id)) return "You don't own this tag!";
    await database.editTag(tagName, { content: this.type === "classic" ? this.args.slice(2).join(" ") : this.interaction?.data.options.getString("content", true), author: this.member?.id }, this.guild);
    this.success = true;
    return `The tag \`${tagName}\` has been edited!`;
  }

  /**
   * @param {string} tagName
   */
  async owner(tagName) {
    if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to check the owner of!";
    const getResult = await database.getTag(this.guild.id, tagName);
    if (!getResult) return "This tag doesn't exist!";
    const user = this.client.users.get(getResult.author);
    this.success = true;
    if (!user) {
      try {
        const restUser = await this.client.rest.users.get(getResult.author);
        return `This tag is owned by **${restUser.username}${restUser.discriminator === "0" ? `#${restUser.discriminator}` : ""}** (\`${getResult.author}\`).`;
      } catch {
        return `I couldn't find exactly who owns this tag, but I was able to get their ID: \`${getResult.author}\``;
      }
    } else {
      return `This tag is owned by **${user.username}${user.discriminator === "0" ? `#${user.discriminator}` : ""}** (\`${getResult.author}\`).`;
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
          title: "Tag List",
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
    if (embeds.length === 0) return "I couldn't find any tags!";
    this.success = true;
    return paginator(this.client, { type: this.type, message: this.message, interaction: this.interaction, author: this.author }, embeds);
  }

  static description = "The main tags command. Check the help page for more info: https://esmbot.net/help.html";
  static aliases = ["t", "tag", "ta"];

  static subArgs(needsContent = false) {
    const args = [{
      name: "name",
      type: 3,
      description: "The name of the tag",
      required: true,
      classic: true
    }];
    if (needsContent) args.push({
      name: "content",
      type: 3,
      description: "The content of the tag",
      required: true,
      classic: true
    });
    return args;
  }

  static flags = [{
    name: "add",
    type: 1,
    description: "Adds a new tag",
    options: this.subArgs(true)
  }, {
    name: "delete",
    type: 1,
    description: "Deletes a tag",
    options: this.subArgs()
  }, {
    name: "edit",
    type: 1,
    description: "Edits an existing tag",
    options: this.subArgs(true)
  }, {
    name: "get",
    type: 1,
    description: "Gets a tag",
    options: this.subArgs()
  }, {
    name: "list",
    type: 1,
    description: "Lists every tag in this server"
  }, {
    name: "owner",
    type: 1,
    description: "Gets the owner of a tag",
    options: this.subArgs()
  }, {
    name: "random",
    type: 1,
    description: "Gets a random tag"
  }];
  static directAllowed = false;
  static userAllowed = false;
  static dbRequired = true;
}

export default TagsCommand;
