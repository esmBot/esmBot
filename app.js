if (process.platform === "win32") console.error("\x1b[1m\x1b[31m\x1b[40m" + `WIN32 IS NOT OFFICIALLY SUPPORTED!
Although there's a (very) slim chance of it working, multiple aspects of the bot are built with UNIX-like systems in mind and could break on Win32-based systems. If you want to run the bot on Windows, using Windows Subsystem for Linux is highly recommended.
The bot will continue to run past this message, but keep in mind that it could break at any time. Continue running at your own risk; alternatively, stop the bot using Ctrl+C and install WSL.` + "\x1b[0m");
if (process.versions.node.split(".")[0] < 15) {
  console.error(`You are currently running Node.js version ${process.version}.
esmBot requires Node.js version 15 or above.
Please refer to step 3 of the setup guide.`);
  process.exit(1);
}

// load config from .env file
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env") });

// main sharding manager
import { Fleet } from "eris-fleet";
import { isMaster } from "cluster";
// main services
import Shard from "./shard.js";
import ImageWorker from "./utils/services/image.js";
import PrometheusWorker from "./utils/services/prometheus.js";
// some utils
import { readFileSync } from "fs";
import winston from "winston";
import { exec as baseExec } from "child_process";
import { promisify } from "util";
const exec = promisify(baseExec);
// database stuff
import database from "./utils/database.js";
// dbl posting
import { Api } from "@top-gg/sdk";
const dbl = process.env.NODE_ENV === "production" && process.env.DBL ? new Api(process.env.DBL) : null;

if (isMaster) {
  const esmBotVersion = JSON.parse(readFileSync(new URL("./package.json", import.meta.url))).version;
  const erisFleetVersion = JSON.parse(readFileSync(new URL("./node_modules/eris-fleet/package.json", import.meta.url))).version; // a bit of a hacky way to get the eris-fleet version
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
          
esmBot ${esmBotVersion} (${(await exec("git rev-parse HEAD").then(output => output.stdout.substring(0, 7), () => "unknown commit"))}), powered by eris-fleet ${erisFleetVersion}
`);
}

const Admiral = new Fleet({
  BotWorker: Shard,
  token: `Bot ${process.env.TOKEN}`,
  fetchTimeout: 900000,
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
      TYPING_START: true,
      MESSAGE_DELETE_BULK: true,
      WEBHOOKS_UPDATE: true,
      STAGE_INSTANCE_CREATE: true,
      STAGE_INSTANCE_DELETE: true,
      STAGE_INSTANCE_UPDATE: true,
      MESSAGE_REACTION_ADD: true,
      MESSAGE_REACTION_REMOVE: true,
      MESSAGE_REACTION_REMOVE_ALL: true,
      MESSAGE_REACTION_REMOVE_EMOJI: true,
      INVITE_CREATE: true,
      INVITE_DELETE: true,
      THREAD_UPDATE: true,
      THREAD_DELETE: true
    },
    allowedMentions: {
      everyone: false,
      roles: false,
      users: true,
      repliedUser: true
    },
    restMode: true,
    messageLimit: 50,
    intents: [
      "guilds",
      "guildVoiceStates",
      "guildMessages",
      "directMessages"
    ],
    stats: {
      requestTimeout: 30000
    }
  },
  services: [
    { name: "prometheus", ServiceWorker: PrometheusWorker },
    { name: "image", ServiceWorker: ImageWorker }
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
    level: process.env.DEBUG_LOG ? "debug" : "main",
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
    debug: "magenta",
    warn: "yellow",
    error: "red"
  });

  database.upgrade(logger).then(result => {
    if (result === 1) return process.exit(1);
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
