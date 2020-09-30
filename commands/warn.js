const database = require("../utils/database.js");
const client = require("../utils/client.js");
const paginator = require("../utils/pagination/pagination.js");

exports.run = async (message, args) => {
  if (!message.member.permission.has("manageMessages")) return `${message.author.mention}, you need to have the \`Manage Messages\` permission on this server to warn people!`;
  if (!args[0]) return `${message.author.mention}, you need to provide a member to warn!`;
  const memberCheck = message.mentions.length >= 1 ? message.mentions[0] : client.users.get(args[0]);
  const member = memberCheck ? memberCheck : client.users.get(args[0].replace(/\D/g, ""));
  if (member) {
    const guild = (await database.guilds.find({
      id: message.channel.guild.id
    }).exec())[0];
    const array = guild.warns.get(member.id) ? guild.warns.get(member.id).warns : [];
    if (args[1].toLowerCase() === "list") {
      if (!message.channel.guild.members.get(client.user.id).permission.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
      if (!message.channel.guild.members.get(client.user.id).permission.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
      const warnArray = [];
      for (const [i, value] of array.entries()) {
        warnArray.push(`**${i + 1}: Added by ${message.channel.guild.members.get(value.creator).username}#${message.channel.guild.members.get(value.creator).discriminator}**: ${value.message} (${value.time.toUTCString()})`);
      }
      const pageSize = 15;
      const embeds = [];
      const groups = warnArray.map((item, index) => {
        return index % pageSize === 0 ? warnArray.slice(index, index + pageSize) : null;
      }).filter((item) => {
        return item;
      });
      for (const [i, value] of groups.entries()) {
        embeds.push({
          "embed": {
            "title": "Warn List",
            "color": 16711680,
            "footer": {
              "text": `Page ${i + 1} of ${groups.length}`
            },
            "description": value.join("\n"),
            "author": {
              "name": member.username,
              "icon_url": member.avatarURL
            }
          }
        });
      }
      if (embeds.length === 0) return `${message.author.mention}, I couldn't find any warns for this user!`;
      return paginator(message, embeds);
    } else if (args[1].toLowerCase() === "remove") {
      if (args[2] < 1 || !array[args[2] - 1]) return `${message.author.mention}, there aren't any warns with that ID!`;
      array.splice(args[2] - 1, 1);
      guild.warns.set(member.id, {
        count: guild.warns.get(member.id).count - 1,
        warns: array
      });
      await guild.save();
      return `Successfully removed the warning for ${member.mention}.`;
    } else {
      args.shift();
      array.push({
        message: args.join(" "),
        time: new Date(),
        creator: message.author.id
      });
      guild.warns.set(member.id, {
        count: (guild.warns.get(member.id) ? guild.warns.get(member.id).count : 0) + 1,
        warns: array
      });
      await guild.save();
      return `Successfully warned ${member.mention} for \`${args.join(" ")}\`.`;
    }
  } else {
    return `${message.author.mention}, you need to provide a member to warn!`;
  }
};

exports.category = 2;
exports.help = "Warns a server member";
exports.params = "[mention] {reason/list/remove} {number}";