const database = require("../../utils/database");
const paginator = require("../../utils/pagination/pagination");
const { random } = require("../../utils/misc");
const Command = require("../../classes/command");

class TagsCommand extends Command {
  // todo: find a way to split this into subcommands
  async run() {
    if (!this.message.channel.guild) return `${this.message.author.mention}, this command only works in servers!`;
    const guild = await database.getGuild(this.message.channel.guild.id);

    if ((guild.tagsDisabled || guild.tags_disabled) && this.args[0].toLowerCase() !== ("enable" || "disable")) return;
    if (this.args.length === 0) return `${this.message.author.mention}, you need to specify the name of the tag you want to view!`;
    const tags = guild.tags instanceof Map ? Object.fromEntries(guild.tags) : guild.tags;
    const blacklist = ["add", "edit", "remove", "delete", "list", "random", "own", "owner", "enable", "disable"];
    switch (this.args[0].toLowerCase()) {
      case "add":
        if (this.args[1] === undefined) return `${this.message.author.mention}, you need to provide the name of the tag you want to add!`;
        if (blacklist.includes(this.args[1].toLowerCase())) return `${this.message.author.mention}, you can't make a tag with that name!`;
        if (tags[this.args[1].toLowerCase()]) return `${this.message.author.mention}, this tag already exists!`;
        var result = await this.setTag(this.args.slice(2).join(" "), this.args[1].toLowerCase(), this.message, guild);
        if (result) return result;
        return `${this.message.author.mention}, the tag \`${this.args[1].toLowerCase()}\` has been added!`;
      case "delete":
      case "remove":
        if (this.args[1] === undefined) return `${this.message.author.mention}, you need to provide the name of the tag you want to delete!`;
        if (!tags[this.args[1].toLowerCase()]) return `${this.message.author.mention}, this tag doesn't exist!`;
        if (tags[this.args[1].toLowerCase()].author !== this.message.author.id && !this.message.member.permission.has("manageMessages") && this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, you don't own this tag!`;
        await database.removeTag(this.args[1].toLowerCase(), this.message.channel.guild);
        return `${this.message.author.mention}, the tag \`${this.args[1].toLowerCase()}\` has been deleted!`;
      case "edit":
        if (this.args[1] === undefined) return `${this.message.author.mention}, you need to provide the name of the tag you want to edit!`;
        if (!tags[this.args[1].toLowerCase()]) return `${this.message.author.mention}, this tag doesn't exist!`;
        if (tags[this.args[1].toLowerCase()].author !== this.message.author.id && !this.message.member.permission.has("manageMessages") && this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, you don't own this tag!`;
        await this.setTag(this.args.slice(2).join(" "), this.args[1].toLowerCase(), this.message, guild);
        return `${this.message.author.mention}, the tag \`${this.args[1].toLowerCase()}\` has been edited!`;
      case "own":
      case "owner":
        if (this.args[1] === undefined) return `${this.message.author.mention}, you need to provide the name of the tag you want to check the owner of!`;
        if (!tags[this.args[1].toLowerCase()]) return `${this.message.author.mention}, this tag doesn't exist!`;
        return `${this.message.author.mention}, this tag is owned by **${this.client.users.get(tags[this.args[1].toLowerCase()].author).username}#${this.client.users.get(tags[this.args[1].toLowerCase()].author).discriminator}** (\`${tags[this.args[1].toLowerCase()].author}\`).`;
      case "list":
        if (!this.message.channel.permissionsOf(this.client.user.id).has("addReactions")) return `${this.message.author.mention}, I don't have the \`Add Reactions\` permission!`;
        if (!this.message.channel.permissionsOf(this.client.user.id).has("embedLinks")) return `${this.message.author.mention}, I don't have the \`Embed Links\` permission!`;
        var pageSize = 15;
        var embeds = [];
        var groups = Object.keys(tags).map((item, index) => {
          return index % pageSize === 0 ? Object.keys(tags).slice(index, index + pageSize) : null;
        }).filter((item) => {
          return item;
        });
        for (const [i, value] of groups.entries()) {
          embeds.push({
            "embed": {
              "title": "Tag List",
              "color": 16711680,
              "footer": {
                "text": `Page ${i + 1} of ${groups.length}`
              },
              "description": value.join("\n"),
              "fields": process.env.NODE_ENV === "development" ? [{"name": "Note", "value": "Tags created in this version of esmBot will not carry over to the final release."}] : null,
              "author": {
                "name": this.message.author.username,
                "icon_url": this.message.author.avatarURL
              }
            }
          });
        }
        if (embeds.length === 0) return `${this.message.author.mention}, I couldn't find any tags!`;
        return paginator(this.client, this.message, embeds);
      case "random":
        return tags[random(Object.keys(tags))].content;
      case "enable":
      case "disable":
        if (!this.message.member.permission.has("manageMessages") && this.message.author.id !== process.env.OWNER) return `${this.message.author.mention}, you don't have permission to disable tags!`;
        var toggleResult = await database.toggleTags(this.message.channel.guild);
        return `${this.message.author.mention}, tags for this guild have been ${toggleResult ? "disabled" : "enabled"}. To ${toggleResult ? "enable" : "disable"} them again, run ${guild.prefix}tags ${toggleResult ? "enable" : "disable"}.`;
      default:
        if (!tags[this.args[0].toLowerCase()]) return `${this.message.author.mention}, this tag doesn't exist!`;
        return tags[this.args[0].toLowerCase()].content;
    }
  }

  async setTag(content, name, message) {
    if ((!content || content.length === 0) && message.attachments.length === 0) return `${message.author.mention}, you need to provide the content of the tag!`;
    if (message.attachments.length !== 0 && content) {
      await database.setTag(name, { content: `${content} ${message.attachments[0].url}`, author: message.author.id }, message.channel.guild);
    } else if (message.attachments.length !== 0) {
      await database.setTag(name, { content: message.attachments[0].url, author: message.author.id }, message.channel.guild);
    } else {
      await database.setTag(name, { content: content, author: message.author.id }, message.channel.guild);
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
    owner: "Gets the owner of a tag",
    disable: "Disables/Enables the tag system"
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

module.exports = TagsCommand;