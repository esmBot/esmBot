if (process.platform === "win32") console.error("\x1b[1m\x1b[31m\x1b[40m" + `WIN32 IS NOT OFFICIALLY SUPPORTED!
Although there's a (very) slim chance of it working, multiple aspects of the bot are built with UNIX-like systems in mind and could break on Win32-based systems. If you want to run the bot on Windows, using Windows Subsystem for Linux is highly recommended.
The bot will continue to run past this message, but keep in mind that it could break at any time. Continue running at your own risk; alternatively, stop the bot using Ctrl+C and install WSL.` + "\x1b[0m");

// load config from .env file
require("dotenv").config();

// main sharding manager
const { Fleet } = require("eris-fleet");
const { isMaster } = require("cluster");
const path = require("path");
const { inspect } = require("util");
// dbl posting
const TopGG = require("@top-gg/sdk");
const dbl = process.env.NODE_ENV === "production" && process.env.DBL !== "" ? new TopGG.Api(process.env.DBL) : null;

const Admiral = new Fleet({
  path: path.join(__dirname, "./shard.js"),
  token: `Bot ${process.env.TOKEN}`,
  startingStatus: {
    status: "idle",
    game: {
      name: "Starting esmBot..."
    }
  },
  clientOptions: {
    disableEvents: {
      CHANNEL_DELETE: true,
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
    ],
    stats: {
      requestTimeout: 30000
    }
  }
});

if (isMaster) {
  Admiral.on("log", (m) => console.log(m));
  Admiral.on("debug", (m) => console.debug(m));
  Admiral.on("warn", (m) => console.warn(m));
  Admiral.on("error", (m) => console.error(inspect(m)));

  if (dbl) {
    Admiral.on("stats", async (m) => {
      await dbl.postStats({
        serverCount: m.guilds,
        shardCount: m.shardCount
      });
    });
  }
}