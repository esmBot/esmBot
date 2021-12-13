import database from "../../utils/database.js";
import paginator from "../../utils/pagination/pagination.js";
import { random } from "../../utils/misc.js";
import Command from "../../classes/command.js";

class TagsCommand extends Command {
  // todo: find a way to split this into subcommands
  async run() {
    if (!this.message.channel.guild) return "This command only works in servers!";

    if (this.args.length === 0) return "You need to provide the name of the tag you want to view!";
    const blacklist = ["create", "add", "edit", "remove", "delete", "list", "random", "own", "owner"];
    if (this.args[0].toLowerCase() === "create" || this.args[0].toLowerCase() === "add") {
      if (this.args[1] === undefined) return "You need to provide the name of the tag you want to add!";
      if (blacklist.includes(this.args[1].toLowerCase())) return "You can't make a tag with that name!";
      const getResult = await database.getTag(this.message.channel.guild.id, this.args[1].toLowerCase());
      if (getResult) return "This tag already exists!";
      const result = await this.setTag(this.args.slice(2).join(" "), this.args[1].toLowerCase(), this.message);
      if (result) return result;
      return `The tag \`${this.args[1].toLowerCase()}\` has been added!`;
    } else if (this.args[0].toLowerCase() === "delete" || this.args[0].toLowerCase() === "remove") {
      if (this.args[1] === undefined) return "You need to provide the name of the tag you want to delete!";
      const getResult = await database.getTag(this.message.channel.guild.id, this.args[1].toLowerCase());
      if (!getResult) return "This tag doesn't exist!";
      const owners = process.env.OWNER.split(",");
      if (getResult.author !== this.message.author.id && !this.message.member.permissions.has("manageMessages") && !owners.includes(this.message.author.id)) return "You don't own this tag!";
      await database.removeTag(this.args[1].toLowerCase(), this.message.channel.guild);
      return `The tag \`${this.args[1].toLowerCase()}\` has been deleted!`;
    } else if (this.args[0].toLowerCase() === "edit") {
      if (this.args[1] === undefined) return "You need to provide the name of the tag you want to edit!";
      const getResult = await database.getTag(this.message.channel.guild.id, this.args[1].toLowerCase());
      if (!getResult) return "This tag doesn't exist!";
      const owners = process.env.OWNER.split(",");
      if (getResult.author !== this.message.author.id && !this.message.member.permissions.has("manageMessages") && !owners.includes(this.message.author.id)) return "You don't own this tag!";
      await this.setTag(this.args.slice(2).join(" "), this.args[1].toLowerCase(), this.message, true);
      return `The tag \`${this.args[1].toLowerCase()}\` has been edited!`;
    } else if (this.args[0].toLowerCase() === "own" || this.args[0].toLowerCase() === "owner") {
      if (this.args[1] === undefined) return "You need to provide the name of the tag you want to check the owner of!";
      const getResult = await database.getTag(this.message.channel.guild.id, this.args[1].toLowerCase());
      if (!getResult) return "This tag doesn't exist!";
      const user = await this.ipc.fetchUser(getResult.author);
      if (!user) {
        try {
          const restUser = await this.client.getRESTUser(getResult.author);
          return `This tag is owned by **${restUser.username}#${restUser.discriminator}** (\`${getResult.author}\`).`;
        } catch {
          return `I couldn't find exactly who owns this tag, but I was able to get their ID: \`${getResult.author}\``;
        }
      } else {
        return `This tag is owned by **${user.username}#${user.discriminator}** (\`${getResult.author}\`).`;
      }
    } else if (this.args[0].toLowerCase() === "list") {
      if (!this.message.channel.permissionsOf(this.client.user.id).has("embedLinks")) return "I don't have the `Embed Links` permission!";
      const tagList = await database.getTags(this.message.channel.guild.id);
      const embeds = [];
      const groups = Object.keys(tagList).map((item, index) => {
        return index % 15 === 0 ? Object.keys(tagList).slice(index, index + 15) : null;
      }).filter((item) => {
        return item;
      });
      for (const [i, value] of groups.entries()) {
        embeds.push({
          embeds: [{
            title: "Tag List",
            color: 16711680,
            footer: {
              text: `Page ${i + 1} of ${groups.length}`
            },
            description: value.join("\n"),
            author: {
              name: this.message.author.username,
              icon_url: this.message.author.avatarURL
            }
          }]
        });
      }
      if (embeds.length === 0) return "I couldn't find any tags!";
      return paginator(this.client, this.message, embeds);
    } else if (this.args[0].toLowerCase() === "random") {
      const tagList = await database.getTags(this.message.channel.guild.id);
      return tagList[random(Object.keys(tagList))].content;
    } else {
      const getResult = await database.getTag(this.message.channel.guild.id, this.args[0].toLowerCase());
      if (!getResult) return "This tag doesn't exist!";
      if (getResult.content.length > 2000) {
        return {
          embeds: [{
            color: 16711680,
            description: getResult.content
          }],
        };
      }
      return getResult.content;
    }
  }

  async setTag(content, name, message, edit = false) {
    if ((!content || content.length === 0) && message.attachments.length === 0) return "You need to provide the content of the tag!";
    if (content && content.length > 4096) return "Your tag content is too long!";
    if (message.attachments.length !== 0 && content) {
      await database[edit ? "editTag" : "setTag"](name, { content: `${content} ${message.attachments[0].url}`, author: message.author.id }, message.channel.guild);
    } else if (message.attachments.length !== 0) {
      await database[edit ? "editTag" : "setTag"](name, { content: message.attachments[0].url, author: message.author.id }, message.channel.guild);
    } else {
      await database[edit ? "editTag" : "setTag"](name, { content: content, author: message.author.id }, message.channel.guild);
    }
    return;
  }

  static description = {
    default: "Gets a tag",
    add: "Adds a tag",
    delete: "Deletes a tag",
    edit: "Edits a tag",
    list: "Lists all tags in the server",
    random: "Gets a random tag",
    owner: "Gets the owner of a tag"
  };
  static aliases = ["t", "tag", "ta"];
  static arguments = {
    default: ["[name]"],
    add: ["[name]", "[content]"],
    delete: ["[name]"],
    edit: ["[name]", "[content]"],
    owner: ["[name]"]
  };
}

export default TagsCommand;
