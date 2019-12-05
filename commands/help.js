const database = require("../utils/database.js");
const collections = require("../utils/collections.js");
const client = require("../utils/client.js");
const misc = require("../utils/misc.js");
const paginator = require("../utils/pagination/pagination.js");
const tips = ["You can change the bot's prefix using the prefix command.", "Image commands also work with images previously posted in that channel.", "You can use the tags commands to save things for later use.", "You can visit https://projectlounge.pw/esmBot/help.html for a web version of this command list.", "You can view a command's aliases by putting the command name after the help command (e.g. help image).", "Parameters wrapped in [] are required, while parameters wrapped in {} are optional."];

exports.run = async (message, args) => {
  const guild = (await database.guilds.find({ id: message.channel.guild.id }).exec())[0];
  const commands = Array.from(collections.commands.keys());
  const aliases = Array.from(collections.aliases.keys());
  if (args.length !== 0 && (commands.includes(args[0].toLowerCase()) || aliases.includes(args[0].toLowerCase()))) {
    const info = aliases.includes(args[0].toLowerCase()) ? collections.info.get(collections.aliases.get(args[0].toLowerCase())) : collections.info.get(args[0].toLowerCase());
    console.log(collections.aliases.get(args[0].toLowerCase()));
    const embed = {
      "embed": {
        "author": {
          "name": "esmBot Dev Help",
          "icon_url": client.user.avatarURL
        },
        "title": `${guild.prefix}${aliases.includes(args[0].toLowerCase()) ? collections.aliases.get(args[0].toLowerCase()) : args[0].toLowerCase()}`,
        "description": info.description,
        "color": 16711680,
        "fields": [{
          "name": "Aliases",
          "value": info.aliases ? info.aliases.join(", ") : "None"
        }, {
          "name": "Parameters",
          "value": info.params ? info.params : "None"
        }]
      }
    };
    return message.channel.createMessage(embed);
  } else {
    const categories = {
      general: [],
      moderation: [],
      tags: ["**Every command in this category is a subcommand of the tag command.**\n"],
      fun: [],
      images: ["**These commands support the PNG, JPEG, and WEBP formats.**\n"],
      soundboard: [],
      admin: ["**These commands are only available to the bot owner.**\n"]
    };
    for (const command of commands) {
      const category = collections.info.get(command).category;
      const description = collections.info.get(command).description;
      const params = collections.info.get(command).params;
      if (category === 1) {
        categories.general.push(`**${command}**${params ? ` ${params}` : ""} - ${description}`);
      } else if (category === 2) {
        categories.moderation.push(`**${command}**${params ? ` ${params}` : ""} - ${description}`);
      } else if (category === 3) {
        categories.tags.push(`**${command}**${params ? ` ${params}` : ""} - ${description}`);
      } else if (category === 4) {
        categories.fun.push(`**${command}**${params ? ` ${params}` : ""} - ${description}`);
      } else if (category === 5) {
        categories.images.push(`**${command}**${params ? ` ${params}` : ""} - ${description}`);
      } else if (category === 6) {
        categories.soundboard.push(`**${command}**${params ? ` ${params}` : ""} - ${description}`);
      } else if (category === 7) {
        categories.admin.push(`**${command}**${params ? ` ${params}` : ""} - ${description}`);
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
exports.params = "{command}";