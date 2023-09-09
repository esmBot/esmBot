import database from "../../utils/database.js";
import paginator from "../../utils/pagination/pagination.js";
import { random } from "../../utils/misc.js";
import Command from "../../classes/command.js";
const blacklist = ["create", "add", "edit", "remove", "delete", "list", "random", "own", "owner"];

class TagsCommand extends Command {
  // todo: attempt to not make this file the worst thing that human eyes have ever seen
  async run() {
    this.success = false;
    if (!this.guild) return "This command only works in servers!";
    const cmd = this.type === "classic" ? (this.args[0] ?? "").toLowerCase() : this.optionsArray[0].name;
    if (!cmd || !cmd.trim()) return "You need to provide the name of the tag you want to view!";
    const tagName = this.type === "classic" ? this.args.slice(1)[0] : this.optionsArray[0].options[0]?.value;

    if (cmd === "create" || cmd === "add") {
      if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to add!";
      if (blacklist.includes(tagName)) return "You can't make a tag with that name!";
      const getResult = await database.getTag(this.guild.id, tagName);
      if (getResult) return "This tag already exists!";
      const result = await database.setTag(tagName, { content: this.type === "classic" ? this.args.slice(2).join(" ") : this.optionsArray[0].options[1].value, author: this.member.id }, this.guild);
      this.success = true;
      if (result) return result;
      return `The tag \`${tagName}\` has been added!`;
    } else if (cmd === "delete" || cmd === "remove") {
      if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to delete!";
      const getResult = await database.getTag(this.guild.id, tagName);
      if (!getResult) return "This tag doesn't exist!";
      const owners = process.env.OWNER.split(",");
      if (getResult.author !== this.author.id && !this.member.permissions.has("MANAGE_MESSAGES") && !owners.includes(this.author.id)) return "You don't own this tag!";
      await database.removeTag(tagName, this.guild);
      this.success = true;
      return `The tag \`${tagName}\` has been deleted!`;
    } else if (cmd === "edit") {
      if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to edit!";
      const getResult = await database.getTag(this.guild.id, tagName);
      if (!getResult) return "This tag doesn't exist!";
      const owners = process.env.OWNER.split(",");
      if (getResult.author !== this.author.id && !this.member.permissions.has("MANAGE_MESSAGES") && !owners.includes(this.author.id)) return "You don't own this tag!";
      await database.editTag(tagName, { content: this.type === "classic" ? this.args.slice(2).join(" ") : this.optionsArray[0].options[1].value, author: this.member.id }, this.guild);
      this.success = true;
      return `The tag \`${tagName}\` has been edited!`;
    } else if (cmd === "own" || cmd === "owner") {
      if (!tagName || !tagName.trim()) return "You need to provide the name of the tag you want to check the owner of!";
      const getResult = await database.getTag(this.guild.id, tagName);
      if (!getResult) return "This tag doesn't exist!";
      const user = this.client.users.get(getResult.author);
      this.success = true;
      if (!user) {
        try {
          const restUser = await this.client.rest.users.get(getResult.author);
          return `This tag is owned by **${restUser.username}${restUser.discriminator === 0 ? `#${restUser.discriminator}` : ""}** (\`${getResult.author}\`).`;
        } catch {
          return `I couldn't find exactly who owns this tag, but I was able to get their ID: \`${getResult.author}\``;
        }
      } else {
        return `This tag is owned by **${user.username}${user.discriminator === 0 ? `#${user.discriminator}` : ""}** (\`${getResult.author}\`).`;
      }
    } else if (cmd === "list") {
      if (!this.permissions.has("EMBED_LINKS")) return "I don't have the `Embed Links` permission!";
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
            color: 16711680,
            footer: {
              text: `Page ${i + 1} of ${groups.length}`
            },
            description: value.join("\n"),
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
    } else {
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
            color: 16711680,
            description: getResult.content
          }],
        };
      }
      return getResult.content;
    }
  }

  static description = "Manage tags";
  static aliases = ["t", "tag", "ta"];
  static arguments = {
    default: ["[name]"],
    add: ["[name]", "[content]"],
    delete: ["[name]"],
    edit: ["[name]", "[content]"],
    owner: ["[name]"]
  };

  static subArgs = [{
    name: "name",
    type: 3,
    description: "The name of the tag",
    required: true
  }, {
    name: "content",
    type: 3,
    description: "The content of the tag",
    required: true
  }];

  static flags = [{
    name: "add",
    type: 1,
    description: "Adds a new tag",
    options: this.subArgs
  }, {
    name: "delete",
    type: 1,
    description: "Deletes a tag",
    options: [this.subArgs[0]]
  }, {
    name: "edit",
    type: 1,
    description: "Edits an existing tag",
    options: this.subArgs
  }, {
    name: "get",
    type: 1,
    description: "Gets a tag",
    options: [this.subArgs[0]]
  }, {
    name: "list",
    type: 1,
    description: "Lists every tag in this server"
  }, {
    name: "owner",
    type: 1,
    description: "Gets the owner of a tag",
    options: [this.subArgs[0]]
  }, {
    name: "random",
    type: 1,
    description: "Gets a random tag"
  }];
  static directAllowed = false;
  static dbRequired = true;
}

export default TagsCommand;
