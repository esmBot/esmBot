if (process.versions.node.split(".")[0] < 16) {
  console.error(`You are currently running Node.js version ${process.version}.
esmBot requires Node.js version 16 or above.
Please refer to step 3 of the setup guide.`);
  process.exit(1);
}
if (process.platform === "win32") {
  console.error("\x1b[1m\x1b[31m\x1b[40m" + `WINDOWS IS NOT OFFICIALLY SUPPORTED!
Although there's a (very) slim chance of it working, multiple aspects of the bot are built with UNIX-like systems in mind and could break on Win32-based systems. If you want to run the bot on Windows, using Windows Subsystem for Linux is highly recommended.
The bot will continue to run past this message in 5 seconds, but keep in mind that it could break at any time. Continue running at your own risk; alternatively, stop the bot using Ctrl+C and install WSL.` + "\x1b[0m");
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000);
}

// load config from .env file
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env") });

import { generateList, createPage } from "./utils/help.js";
import { reloadImageConnections } from "./utils/image.js";

// main services
import Eris from "eris";
import pm2 from "pm2";
// some utils
import { promises, readFileSync } from "fs";
import { logger } from "./utils/logger.js";
import { exec as baseExec } from "child_process";
import { promisify } from "util";
const exec = promisify(baseExec);
// initialize command loader
import { load, send } from "./utils/handler.js";
// command collections
import { paths } from "./utils/collections.js";
// database stuff
import database from "./utils/database.js";
// lavalink stuff
import { checkStatus, connect, reload, status, connected } from "./utils/soundplayer.js";
// events
import { endBroadcast, startBroadcast, activityChanger, checkBroadcast } from "./utils/misc.js";
import { parseThreshold } from "./utils/tempimages.js";

const { types } = JSON.parse(readFileSync(new URL("./config/commands.json", import.meta.url)));

const esmBotVersion = JSON.parse(readFileSync(new URL("./package.json", import.meta.url))).version;
exec("git rev-parse HEAD").then(output => output.stdout.substring(0, 7), () => "unknown commit").then(o => process.env.GIT_REV = o).then(() => {
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
       
esmBot ${esmBotVersion} (${process.env.GIT_REV})
`);
});

const intents = [
  "guildVoiceStates",
  "directMessages"
];
if (types.classic) {
  intents.push("guilds");
  intents.push("guildMessages");
  intents.push("messageContent");
}

// PM2-specific handling
if (process.env.PM2_USAGE) {
  pm2.launchBus((err, pm2Bus) => {
    if (err) {
      logger.error(err);
      return;
    }

    pm2Bus.on("process:msg", async (packet) => {
      switch (packet.data?.type) {
        case "reload":
          var path = paths.get(packet.data.message);
          await load(bot, path, await checkStatus(), true);
          break;
        case "soundreload":
          var soundStatus = await checkStatus();
          if (!soundStatus) {
            reload();
          }
          break;
        case "imagereload":
          await reloadImageConnections();
          break;
        case "broadcastStart":
          startBroadcast(bot, packet.data.message);
          break;
        case "broadcastEnd":
          endBroadcast(bot);
          break;
        case "serverCounts":
          pm2.sendDataToProcessId(0, {
            id: 0,
            type: "process:msg",
            data: {
              type: "serverCounts",
              guilds: bot.guilds.size,
              shards: bot.shards.size
            },
            topic: true
          }, (err) => {
            if (err) logger.error(err);
          });
          break;
      }
    });
  });
}

database.upgrade(logger).then(result => {
  if (result === 1) return process.exit(1);
});

// process the threshold into bytes early
if (process.env.TEMPDIR && process.env.THRESHOLD) {
  parseThreshold();
}

if (!types.classic && !types.application) {
  logger.error("Both classic and application commands are disabled! Please enable at least one command type in config/commands.json.");
  process.exit(1);
}

const bot = new Eris(`Bot ${process.env.TOKEN}`, {
  allowedMentions: {
    everyone: false,
    roles: false,
    users: true,
    repliedUser: true
  },
  restMode: true,
  maxShards: "auto",
  messageLimit: 50,
  intents,
  connectionTimeout: 30000
});

bot.once("ready", async () => {
  // register commands and their info
  const soundStatus = await checkStatus();
  logger.log("info", "Attempting to load commands...");
  for await (const commandFile of getFiles(resolve(dirname(fileURLToPath(import.meta.url)), "./commands/"))) {
    logger.log("main", `Loading command from ${commandFile}...`);
    try {
      await load(bot, commandFile, soundStatus);
    } catch (e) {
      logger.error(`Failed to register command from ${commandFile}: ${e}`);
    }
  }
  if (types.application) {
    try {
      await send(bot);
    } catch (e) {
      logger.log("error", e);
      logger.log("error", "Failed to send command data to Discord, slash/message commands may be unavailable.");
    }
  }
  logger.log("info", "Finished loading commands.");
  
  if (process.env.API_TYPE === "ws") await reloadImageConnections();
  await database.setup();
  
  // register events
  logger.log("info", "Attempting to load events...");
  for await (const file of getFiles(resolve(dirname(fileURLToPath(import.meta.url)), "./events/"))) {
    logger.log("main", `Loading event from ${file}...`);
    const eventArray = file.split("/");
    const eventName = eventArray[eventArray.length - 1].split(".")[0];
    if (eventName === "interactionCreate" && !types.application) {
      logger.log("warn", `Skipped loading event from ${file} because application commands are disabled`);
      continue;
    }
    const { default: event } = await import(file);
    bot.on(eventName, event.bind(null, bot));
  }
  logger.log("info", "Finished loading events.");
  
  // generate docs
  if (process.env.OUTPUT && process.env.OUTPUT !== "") {
    generateList();
    await createPage(process.env.OUTPUT);
    logger.log("info", "The help docs have been generated.");
  }
  
  // connect to lavalink
  if (!status && !connected) connect(bot);

  checkBroadcast(bot);
  activityChanger(bot);
  
  logger.log("info", "Started esmBot.");
});

async function* getFiles(dir) {
  const dirents = await promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const name = dir + (dir.charAt(dir.length - 1) !== "/" ? "/" : "") + dirent.name;
    if (dirent.isDirectory()) {
      yield* getFiles(name);
    } else if (dirent.name.endsWith(".js")) {
      yield name;
    }
  }
}

bot.connect();