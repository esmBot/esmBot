const database = require("../utils/database.js");
const client = require("../utils/client.js");
const paginator = require("../utils/pagination/pagination.js");
const { random } = require("../utils/misc.js");

exports.run = async (message, args) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  const guild = await database.getGuild(message.channel.guild.id);

  if ((guild.tagsDisabled || guild.tags_disabled) && args[0].toLowerCase() !== ("enable" || "disable")) return;
  if (args.length === 0) return `${message.author.mention}, you need to specify the name of the tag you want to view!`;
  const tags = guild.tags instanceof Map ? Object.fromEntries(guild.tags) : guild.tags;
  const blacklist = ["add", "edit", "remove", "delete", "list", "random", "own", "owner", "enable", "disable"];
  switch (args[0].toLowerCase()) {
    case "add":
      if (args[1] === undefined) return `${message.author.mention}, you need to provide the name of the tag you want to add!`;
      if (blacklist.includes(args[1].toLowerCase())) return `${message.author.mention}, you can't make a tag with that name!`;
      if (tags[args[1].toLowerCase()]) return `${message.author.mention}, this tag already exists!`;
      var result = await setTag(args.slice(2).join(" "), args[1].toLowerCase(), message, guild);
      if (result) return result;
      return `${message.author.mention}, the tag \`${args[1].toLowerCase()}\` has been added!`;
    case "delete":
    case "remove":
      if (args[1] === undefined) return `${message.author.mention}, you need to provide the name of the tag you want to delete!`;
      if (!tags[args[1].toLowerCase()]) return `${message.author.mention}, this tag doesn't exist!`;
      if (tags[args[1].toLowerCase()].author !== message.author.id && !message.member.permissions.has("manageMessages") && message.author.id !== process.env.OWNER) return `${message.author.mention}, you don't own this tag!`;
      await database.removeTag(args[1].toLowerCase(), message.channel.guild);
      return `${message.author.mention}, the tag \`${args[1].toLowerCase()}\` has been deleted!`;
    case "edit":
      if (args[1] === undefined) return `${message.author.mention}, you need to provide the name of the tag you want to edit!`;
      if (!tags[args[1].toLowerCase()]) return `${message.author.mention}, this tag doesn't exist!`;
      if (tags[args[1].toLowerCase()].author !== message.author.id && !message.member.permissions.has("manageMessages") && message.author.id !== process.env.OWNER) return `${message.author.mention}, you don't own this tag!`;
      await setTag(args.slice(2).join(" "), args[1].toLowerCase(), message, guild);
      return `${message.author.mention}, the tag \`${args[1].toLowerCase()}\` has been edited!`;
    case "own":
    case "owner":
      if (args[1] === undefined) return `${message.author.mention}, you need to provide the name of the tag you want to check the owner of!`;
      if (!tags[args[1].toLowerCase()]) return `${message.author.mention}, this tag doesn't exist!`;
      return `${message.author.mention}, this tag is owned by **${client.users.get(tags[args[1].toLowerCase()].author).username}#${client.users.get(tags[args[1].toLowerCase()].author).discriminator}** (\`${tags[args[1].toLowerCase()].author}\`).`;
    case "list":
      if (!message.channel.guild.members.get(client.user.id).permissions.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
      if (!message.channel.guild.members.get(client.user.id).permissions.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
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
              "name": message.author.username,
              "icon_url": message.author.avatarURL
            }
          }
        });
      }
      if (embeds.length === 0) return `${message.author.mention}, I couldn't find any tags!`;
      return paginator(message, embeds);
    case "random":
      return tags[random(Object.keys(tags))].content;
    case "enable":
    case "disable":
      if (!message.member.permissions.has("manageMessages") && message.author.id !== process.env.OWNER) return `${message.author.mention}, you don't have permission to disable tags!`;
      var toggleResult = await database.toggleTags(message.channel.guild);
      return `${message.author.mention}, tags for this guild have been ${toggleResult ? "disabled" : "enabled"}. To ${toggleResult ? "enable" : "disable"} them again, run ${guild.prefix}tags ${toggleResult ? "enable" : "disable"}.`;
    default:
      if (!tags[args[0].toLowerCase()]) return `${message.author.mention}, this tag doesn't exist!`;
      return tags[args[0].toLowerCase()].content;
  }
};

const setTag = async (content, name, message) => {
  if ((!content || content.length === 0) && message.attachments.length === 0) return `${message.author.mention}, you need to provide the content of the tag!`;
  if (message.attachments.length !== 0 && content) {
    await database.setTag(name, { content: `${content} ${message.attachments[0].url}`, author: message.author.id }, message.channel.guild);
  } else if (message.attachments.length !== 0) {
    await database.setTag(name, { content: message.attachments[0].url, author: message.author.id }, message.channel.guild);
  } else {
    await database.setTag(name, { content: content, author: message.author.id }, message.channel.guild);
  }
  return;
};

exports.aliases = ["t", "tag", "ta"];
exports.category = 3;
exports.help = {
  default: "Gets a tag",
  add: "Adds a tag",
  delete: "Deletes a tag",
  edit: "Edits a tag",
  list: "Lists all tags in the server",
  random: "Gets a random tag",
  owner: "Gets the owner of a tag",
  disable: "Disables/Enables the tag system"
};
exports.params = {
  default: "[name]",
  add: "[name] [content]",
  delete: "[name]",
  edit: "[name] [content]",
  owner: "[name]"
};