if (process.platform === "win32") console.error("\x1b[1m\x1b[31m\x1b[40m" + `WIN32 IS NOT OFFICIALLY SUPPORTED!
Although there's a (very) slim chance of it working, multiple aspects of the bot are built with UNIX-like systems in mind and could break on Win32-based systems. If you want to run the bot on Windows, using Windows Subsystem for Linux is highly recommended.
The bot will continue to run past this message, but keep in mind that it could break at any time. Continue running at your own risk; alternatively, stop the bot using Ctrl+C and install WSL.` + "\x1b[0m");

// load config from .env file
require("dotenv").config();

// main sharding manager
const { Master } = require("eris-sharder");
// dbl posting
const TopGG = require("@top-gg/sdk");
const dbl = process.env.NODE_ENV === "production" && process.env.DBL !== "" ? new TopGG.Api(process.env.DBL) : null;

const master = new Master(`Bot ${process.env.TOKEN}`, "/shard.js", {
  name: "esmBot",
  stats: true,
  clientOptions: {
    disableEvents: {
      CHANNEL_DELETE: true,
      CHANNEL_UPDATE: true,
      GUILD_BAN_REMOVE: true,
      GUILD_MEMBER_ADD: true,
      GUILD_MEMBER_REMOVE: true,
      GUILD_MEMBER_UPDATE: true,
      GUILD_ROLE_CREATE: true,
      GUILD_ROLE_DELETE: true,
      GUILD_ROLE_UPDATE: true,
      TYPING_START: true,
      MESSAGE_DELETE_BULK: true
    },
    allowedMentions: {
      everyone: false,
      roles: false,
      users: true,
      repliedUser: true
    },
    guildSubscriptions: false,
    intents: [
      "guilds",
      "guildVoiceStates",
      "guildMessages",
      "guildMessageReactions",
      "directMessages",
      "directMessageReactions"
    ]
  }
});

master.on("stats", async (stats) => {
  // dbl posting
  if (dbl) {
    await dbl.postStats({
      serverCount: stats.guilds,
      shardCount: await master.calculateShards()
    });
  }
});