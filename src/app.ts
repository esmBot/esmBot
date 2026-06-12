import process from "node:process";

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 13) || (major === 23 && minor < 4)) {
  console.error(`You are currently running Node.js version ${process.versions.node}.
esmBot requires Node.js version 22.13.0/23.4.0 or above.
Please refer to step 2 of the setup guide: https://docs.esmbot.net/setup/#2-install-nodejs`);
  process.exit(1);
}
if (process.platform === "win32") {
  console.error(
    "\x1b[1m\x1b[31m\x1b[40m" +
      `WINDOWS IS NOT OFFICIALLY SUPPORTED!
Although there's a (very) slim chance of it working, multiple aspects of esmBot are built with UNIX-like systems in mind and could break on Win32-based systems. If you want to run esmBot on Windows, using Windows Subsystem for Linux is highly recommended.
esmBot will continue to run past this message in 5 seconds, but keep in mind that it could break at any time. Continue running at your own risk; alternatively, stop the bot using Ctrl+C and install WSL.` +
      "\x1b[0m",
  );
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "") await import("./utils/sentry.ts");

if (!process.env.TOKEN) {
  console.error(`No token was provided!
esmBot requires a valid Discord bot token to function. Generate a new token from the "Bot" tab in your Discord application settings and paste it into your .env file.`);
  process.exit(1);
}

if (process.env.TOKEN.length < 59) {
  console.error(`Incorrect bot token length!
You may have accidentally copied the OAuth2 client secret. Try generating a new token from the "Bot" tab in your Discord application settings.`);
  process.exit(1);
}

import { glob, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client, type ClientEvents, Constants } from "oceanic.js";
import commandConfig from "#config/commands.json" with { type: "json" };
import { locales, paths } from "#utils/collections.js";
import detectRuntime from "#utils/detectRuntime.js";
import { load } from "#utils/handler.js";
import logger from "#utils/logger.js";
import { initMediaLib, reloadMediaConnections } from "#utils/media.js";
import { endBroadcast, exit, getVers, initLog, startBroadcast } from "#utils/misc.js";
import { connect, connected, reload } from "#utils/soundplayer.js";
import { parseThreshold } from "#utils/tempimages.js";
import { init as dbInit } from "./database.ts";
import events from "./events/index.ts";

const intents = [Constants.Intents.GUILD_VOICE_STATES, Constants.Intents.DIRECT_MESSAGES, Constants.Intents.GUILDS];
if (commandConfig.types.classic) {
  intents.push(Constants.Intents.GUILD_MESSAGES);
  intents.push(Constants.Intents.MESSAGE_CONTENT);
}

const runtime = detectRuntime();

await getVers();
if (process.env.CLUSTER_TYPE !== "node") initLog();

if (!commandConfig.types.classic && !commandConfig.types.application) {
  logger.error(
    "Both classic and application commands are disabled! Please enable at least one command type in config/commands.json.",
  );
  process.exit(1);
}

const database = await dbInit();
if (database) {
  // database handling
  const dbResult = await database.upgrade();
  if (dbResult === 1) process.exit(1);
}

// process the threshold into bytes early
if (process.env.TEMPDIR && process.env.THRESHOLD) {
  await parseThreshold();
}

// register locales
logger.log("info", "Attempting to load locale data...");
for await (const localeFile of glob(resolve(import.meta.dirname, "..", "locales", "*.json"))) {
  logger.log("main", `Loading locales from ${localeFile}...`);
  try {
    const commandArray = localeFile.split("/");
    const localeName = commandArray.at(-1)!.split(".")[0];
    const data = await readFile(localeFile, { encoding: "utf8" });
    locales.set(localeName, JSON.parse(data));
  } catch (e) {
    logger.error(`Failed to register locales from ${localeFile}: ${e}`);
  }
}
logger.log("info", "Finished loading locale data.");

// register commands and their info
logger.log("info", "Attempting to load commands...");
for await (const commandFile of glob(
  resolve(import.meta.dirname, "..", "commands", "*", runtime.tsLoad ? "*.{js,ts}" : "*.js"),
)) {
  try {
    await load(commandFile);
  } catch (e) {
    logger.error(`Failed to register command from ${commandFile}: ${e}`);
  }
}
logger.log("info", "Finished loading commands.");

if (database) {
  await database.setup();
}
if (process.env.API_TYPE === "ws") await reloadMediaConnections();
else await initMediaLib();

const shardArray = process.env.SHARDS ? JSON.parse(process.env.SHARDS) : null;

// create the oceanic client
const client = new Client({
  auth: `Bot ${process.env.TOKEN}`,
  allowedMentions: {
    everyone: false,
    roles: false,
    users: true,
    repliedUser: true,
  },
  gateway: {
    concurrency: "auto",
    maxShards: "auto",
    shardIDs: shardArray,
    presence: {
      status: "idle",
      activities: [
        {
          type: 0,
          name: "Starting esmBot...",
        },
      ],
    },
    intents,
  },
  rest: {
    baseURL: process.env.REST_PROXY && process.env.REST_PROXY !== "" ? process.env.REST_PROXY : undefined,
    requestTimeout: Number(process.env.REST_TIMEOUT_MS) || 15000,
  },
  collectionLimits: {
    messages: 50,
    channels: !commandConfig.types.classic ? 0 : Number.POSITIVE_INFINITY,
    guildThreads: !commandConfig.types.classic ? 0 : Number.POSITIVE_INFINITY,
    emojis: 0,
  },
});

// register events
logger.log("info", "Registering events...");
for (const [name, event] of Object.entries(events)) {
  logger.log("main", `Registering ${name} event...`);
  client.on(name as keyof ClientEvents, (event as Function).bind(null, { client, database }));
}
logger.log("info", "Registered events.");

// Cluster-specific handling
if (process.env.CLUSTER_TYPE === "node") {
  process.on("message", async (packet: { data?: { type: string; from?: string; message: string } }) => {
    if (packet.data?.from === process.env.pm_id) return;
    switch (packet.data?.type) {
      case "reload": {
        const cmdPath = paths.get(packet.data.message);
        if (cmdPath) await load(cmdPath);
        break;
      }
      case "soundreload":
        await reload(client);
        break;
      case "mediareload":
        await reloadMediaConnections();
        break;
      case "broadcastStart":
        startBroadcast(client, packet.data.message);
        break;
      case "broadcastEnd":
        endBroadcast(client);
        break;
      case "eval":
        // oxlint-disable-next-line no-eval
        eval(packet.data.message);
        break;
      case "serverCounts":
        process.send?.({
          data: {
            type: "serverCounts",
            guilds: client.guilds.size,
            shards: client.shards.map((v) => {
              return {
                id: v.id,
                procId: Number.parseInt(process.env.pm_id as string),
                latency: v.latency,
                status: v.status,
              };
            }),
            mem: process.memoryUsage().heapUsed,
          },
        });
        break;
    }
  });
}

// connect to lavalink
if (!connected) connect(client);

process.on("SIGINT", async () => {
  logger.info("SIGINT detected, shutting down...");
  await exit(client, database);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM detected, shutting down...");
  await exit(client, database);
});

try {
  await client.connect();
} catch (e) {
  logger.error("esmBot failed to connect to Discord!");
  logger.error(e);
  logger.error("The bot is unable to start, stopping now...");
  process.exit(1);
}
