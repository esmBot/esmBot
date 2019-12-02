const database = require("../utils/database.js");
const collections = require("../utils/collections.js");
const client = require("../utils/client.js");
const misc = require("../utils/misc.js");
const paginator = require("../utils/pagination/pagination.js");
const tips = ["You can change the bot's prefix using the prefix command.", "Image commands also work with images previously posted in that channel.", "You can use the tags commands to save things for later use.", "You can visit https://essem.space/esmBot/commands.html?dev=true for a web version of this command list."];

exports.run = async (message, args) => {
  const guild = (await database.guilds.find({ id: message.channel.guild.id }).exec())[0];
  const commands = Array.from(collections.commands.keys());
  if (args.length !== 0 && commands.includes(args[0].toLowerCase())) {
    const info = collections.info.get(args[0].toLowerCase());
    const embed = {
      "embed": {
        "author": {
          "name": "esmBot Dev Help",
          "icon_url": client.user.avatarURL
        },
        "title": args[0].toLowerCase(),
        "description": info.description,
        "color": 16711680,
        "fields": [{
          "name": "Aliases",
          "value": info.aliases ? info.aliases.join(", ") : "None"
        }]
      }
    };
    return message.channel.createMessage(embed);
  } else {
    const categories = {
      general: [],
      moderation: [],
      tags: [],
      fun: [],
      images: [],
      soundboard: [],
      admin: []
    };
    for (const command of commands) {
      const category = collections.info.get(command).category;
      const description = collections.info.get(command).description;
      if (category === 1) {
        categories.general.push(`**${command}** - ${description}`);
      } else if (category === 2) {
        categories.moderation.push(`**${command}** - ${description}`);
      } else if (category === 3) {
        categories.tags.push(`**${command}** - ${description}`);
      } else if (category === 4) {
        categories.fun.push(`**${command}** - ${description}`);
      } else if (category === 5) {
        categories.images.push(`**${command}** - ${description}`);
      } else if (category === 6) {
        categories.soundboard.push(`**${command}** - ${description}`);
      } else if (category === 7) {
        categories.admin.push(`**${command}** - ${description}`);
      }
    }
    const pages = [];
    for (const category of Object.keys(categories)) {
      const splitPages = categories[category].map((item, index) => {
        return index % 15 === 0 ? categories[category].slice(index, index + 15) : null;
      }).filter((item) => {
        return item;
      });
      splitPages.forEach(page => {
        pages.push({
          title: category.charAt(0).toUpperCase() + category.slice(1),
          page: page
        });
      });
    }
    const embeds = [];
    for (const [i, value] of pages.entries()) {
      embeds.push({
        "embed": {
          "author": {
            "name": "esmBot Dev Help",
            "icon_url": client.user.avatarURL
          },
          "title": value.title,
          "description": value.page.join("\n"),
          "color": 16711680,
          "footer": {
            "text": `Page ${i + 1} of ${pages.length}`
          },
          "fields": [{
            "name": "Prefix",
            "value": guild.prefix
          }, {
            "name": "Tip",
            "value": misc.random(tips)
          }]
        }
      });
    }
    return paginator(message, embeds);
  }
};

exports.category = 1;
exports.help = "Gets a list of commands";