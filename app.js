if (process.platform === "win32") console.error("\x1b[1m\x1b[31m\x1b[40m" + `WIN32 IS NOT OFFICIALLY SUPPORTED!
Although there's a (very) slim chance of it working, multiple aspects of the bot are built with UNIX-like systems in mind and could break on Win32-based systems. If you want to run the bot on Windows, using Windows Subsystem for Linux is highly recommended.
The bot will continue to run past this message, but keep in mind that it could break at any time. Continue running at your own risk; alternatively, stop the bot using Ctrl+C and install WSL.` + "\x1b[0m");

// load config from .env file
require("dotenv").config();

// main sharding manager
const { Fleet } = require("eris-fleet");
const { isMaster } = require("cluster");
// some utils
const path = require("path");
const winston = require("winston");
// dbl posting
const TopGG = require("@top-gg/sdk");
const dbl = process.env.NODE_ENV === "production" && process.env.DBL !== "" ? new TopGG.Api(process.env.DBL) : null;

if (isMaster) {
  console.log(`
     ,*\`$                    z\`"v       
    F zBw\`%                 A ,W "W     
  ,\` ,EBBBWp"%. ,-=~~==-,+*  4BBE  T    
  M  BBBBBBBB* ,w=####Wpw  4BBBBB#  1   
 F  BBBBBBBMwBBBBBBBBBBBBB#wXBBBBBH  E  
 F  BBBBBBkBBBBBBBBBBBBBBBBBBBBE4BL  k  
 #  BFBBBBBBBBBBBBF"      "RBBBW    F  
  V ' 4BBBBBBBBBBM            TBBL  F   
   F  BBBBBBBBBBF              JBB  L   
   F  FBBBBBBBEB                BBL 4   
   E  [BB4BBBBEBL               BBL 4   
   I   #BBBBBBBEB              4BBH  *w 
   A   4BBBBBBBBBEW,         ,BBBB  W  [
.A  ,k  4BBBBBBBBBBBEBW####BBBBBBM BF  F
k  <BBBw BBBBEBBBBBBBBBBBBBBBBBQ4BM  # 
 5,  REBBB4BBBBB#BBBBBBBBBBBBP5BFF  ,F  
   *w  \`*4BBW\`"FF#F##FFFF"\` , *   +"    
      *+,   " F'"'*^~~~^"^\`  V+*^       
          \`"""                          
          
esmBot ${require("./package.json").version}, powered by eris-fleet ${require("./node_modules/eris-fleet/package.json").version}
`);
// a bit of a hacky way to get the eris-fleet version
}

const Admiral = new Fleet({
  path: path.join(__dirname, "./shard.js"),
  token: `Bot ${process.env.TOKEN}`,
  startingStatus: {
    status: "idle",
    game: {
      name: "Starting esmBot..."
    }
  },
  whatToLog: {
    blacklist: ["stats_update"]
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
  },
  services: [
    { name: "prometheus", path: path.join(__dirname, "./utils/services/prometheus.js") },
    { name: "image", path: path.join(__dirname, "./utils/services/image.js")},
    { name: "database", path: path.join(__dirname, "./utils/services/database.js")}
  ]
});

if (isMaster) {
  const logger = winston.createLogger({
    levels: { 
      error: 0,
      warn: 1,
      info: 2,
      main: 3,
      debug: 4
    },
    transports: [
      new winston.transports.Console({ format: winston.format.colorize({ all: true }), stderrLevels: ["error", "warn"] }),
      new winston.transports.File({ filename: "logs/error.log", level: "error" }),
      new winston.transports.File({ filename: "logs/main.log" })
    ],
    level: "main",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf((info) => {
        const {
          timestamp, level, message, ...args
        } = info;
    
        return `[${timestamp}]: [${level.toUpperCase()}] - ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ""}`;
      }),
    )
  });
  
  winston.addColors({
    info: "green",
    main: "gray",
    debug: "purple",
    warn: "yellow",
    error: "red"
  });

  Admiral.on("log", (m) => logger.main(m));
  Admiral.on("info", (m) => logger.info(m));
  Admiral.on("debug", (m) => logger.debug(m));
  Admiral.on("warn", (m) => logger.warn(m));
  Admiral.on("error", (m) => logger.error(m));

  if (dbl) {
    Admiral.on("stats", async (m) => {
      await dbl.postStats({
        serverCount: m.guilds,
        shardCount: m.shardCount
      });
    });
  }
}