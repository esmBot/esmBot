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

import { reloadImageConnections } from "./utils/image.js";

// main services
import { Client } from "oceanic.js";
import pm2 from "pm2";
// some utils
import { promises, readFileSync } from "fs";
import { logger } from "./utils/logger.js";
import { exec as baseExec } from "child_process";
import { promisify } from "util";
const exec = promisify(baseExec);
// initialize command loader
import { load } from "./utils/handler.js";
// command collections
import { paths } from "./utils/collections.js";
// database stuff
import database from "./utils/database.js";
// lavalink stuff
import { reload, connect, connected } from "./utils/soundplayer.js";
// events
import { endBroadcast, startBroadcast } from "./utils/misc.js";
import { parseThreshold } from "./utils/tempimages.js";

const { types } = JSON.parse(readFileSync(new URL("./config/commands.json", import.meta.url)));
const esmBotVersion = JSON.parse(readFileSync(new URL("./package.json", import.meta.url))).version;

const intents = [
  "GUILD_VOICE_STATES",
  "DIRECT_MESSAGES",
  "GUILDS"
];
if (types.classic) {
  intents.push("GUILD_MESSAGES");
  intents.push("MESSAGE_CONTENT");
}

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

async function init() {
  await exec("git rev-parse HEAD").then(output => output.stdout.substring(0, 7), () => "unknown commit").then(o => process.env.GIT_REV = o);
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

  if (!types.classic && !types.application) {
    logger.error("Both classic and application commands are disabled! Please enable at least one command type in config/commands.json.");
    return process.exit(1);
  }

  // database handling
  const dbResult = await database.upgrade(logger);
  if (dbResult === 1) return process.exit(1);

  // process the threshold into bytes early
  if (process.env.TEMPDIR && process.env.THRESHOLD) {
    await parseThreshold();
  }

  // register commands and their info
  logger.log("info", "Attempting to load commands...");
  for await (const commandFile of getFiles(resolve(dirname(fileURLToPath(import.meta.url)), "./commands/"))) {
    logger.log("main", `Loading command from ${commandFile}...`);
    try {
      await load(null, commandFile);
    } catch (e) {
      logger.error(`Failed to register command from ${commandFile}: ${e}`);
    }
  }
  logger.log("info", "Finished loading commands.");

  await database.setup();
  if (process.env.API_TYPE === "ws") await reloadImageConnections();

  // create the oceanic client
  const client = new Client({
    auth: `Bot ${process.env.TOKEN}`,
    allowedMentions: {
      everyone: false,
      roles: false,
      users: true,
      repliedUser: true
    },
    gateway: {
      concurrency: "auto",
      maxShards: "auto",
      shardIDs: process.env.SHARDS ? JSON.parse(process.env.SHARDS)[process.env.pm_id - 1] : null,
      presence: {
        status: "idle",
        activities: [{
          type: 0,
          name: "Starting esmBot..."
        }]
      },
      intents
    },
    collectionLimits: {
      messages: 50
    }
  });

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
    client.on(eventName, event.bind(null, client));
  }
  logger.log("info", "Finished loading events.");

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
            await load(client, path, true);
            break;
          case "soundreload":
            await reload(client);
            break;
          case "imagereload":
            await reloadImageConnections();
            break;
          case "broadcastStart":
            startBroadcast(client, packet.data.message);
            break;
          case "broadcastEnd":
            endBroadcast(client);
            break;
          case "serverCounts":
            pm2.sendDataToProcessId(0, {
              id: 0,
              type: "process:msg",
              data: {
                type: "serverCounts",
                guilds: client.guilds.size,
                shards: client.shards.size
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

  // connect to lavalink
  if (!connected) connect(client);

  client.connect();
}

init();