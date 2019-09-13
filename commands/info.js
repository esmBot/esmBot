const client = require("../utils/client.js");
const config = require("../config.json");

exports.run = async (message) => {
  const dev = client.users.get(config.botOwner);
  const artist = client.users.get("401980971517214723");
  const infoEmbed = {
    "embed": {
      "description": "**You are currently using esmBot Dev! Things may change at any time without warning and there will be bugs. Many bugs.**",
      "color": 16711680,
      "author": {
        "name": "esmBot Info/Credits",
        "icon_url": client.user.avatarURL
      },
      "fields": [{
        "name": "📝 Credits:",
        "value": `Bot by **${dev.username}#${dev.discriminator}**\nIcon by **${artist.username}#${artist.discriminator}**`
      },
      {
        "name": "👪 Total Users:",
        "value": client.users.size
      },
      {
        "name": "💬 Total Servers:",
        "value": client.guilds.size
      },
      {
        "name": "✅ Official Server:",
        "value": "[Click here!](https://discord.gg/vfFM7YT)"
      },
      {
        "name": "💻 Source Code:",
        "value": "[Click here!](https://github.com/TheEssem/esmBot-rewrite)"
      }
      ]
    }
  };
  return message.channel.createMessage(infoEmbed);
};

exports.aliases = ["botinfo", "credits"];
