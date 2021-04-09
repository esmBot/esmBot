if (process.platform === "win32") console.error("\x1b[1m\x1b[31m\x1b[40m" + `WIN32 IS NOT OFFICIALLY SUPPORTED!
Although there's a (very) slim chance of it working, multiple aspects of the bot are built with UNIX-like systems in mind and could break on Win32-based systems. If you want to run the bot on Windows, using Windows Subsystem for Linux is highly recommended.
The bot will continue to run past this message, but keep in mind that it could break at any time. Continue running at your own risk; alternatively, stop the bot using Ctrl+C and install WSL.` + "\x1b[0m");

// load config from .env file
require("dotenv").config();

// path stuff
const { readdir } = require("fs").promises;
// fancy loggings
const logger = require("./utils/logger.js");
// start the client
const client = require("./utils/client.js");
// initialize command loader
const handler = require("./utils/handler.js");
const collections = require("./utils/collections.js");
const sound = require("./utils/soundplayer.js");
const image = require("./utils/image.js");

// util for reading a directory recursively
async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      yield* getFiles(dir + dirent.name);
    } else {
      yield dir + (dir.charAt(dir.length - 1) !== "/" ? "/" : "") + dirent.name;
    }
  }
}

// registers stuff and connects the bot
async function init() {
  logger.log("info", "Starting esmBot...");
  // register commands and their info
  const soundStatus = await sound.checkStatus();
  logger.log("info", "Attempting to load commands...");
  for await (const commandFile of getFiles("./commands/")) {
    logger.log("info", `Loading command from ${commandFile}...`);
    try {
      await handler.load(commandFile, soundStatus);
    } catch (e) {
      logger.error(`Failed to register command from ${commandFile}: ${e}`);
    }
  }

  // register events
  const events = await readdir("./events/");
  logger.log("info", `Attempting to load ${events.length} events...`);
  for (const file of events) {
    logger.log("info", `Loading event from ${file}...`);
    const eventName = file.split(".")[0];
    const event = require(`./events/${file}`);
    client.on(eventName, event.bind(null, client));
  }

  // connect to image api if enabled
  if (process.env.API === "true") {
    for (const server of image.servers) {
      try {
        await image.connect(server);
      } catch (e) {
        logger.error(e);
      }
    }
  }

  // login
  client.connect();

  // post to DBL
  if (process.env.NODE_ENV === "production" && process.env.DBL !== "") {
    require("./utils/dbl.js");
  }

  // handle ctrl+c and pm2 stop
  process.on("SIGINT", () => {
    logger.log("info", "SIGINT detected, shutting down...");
    client.editStatus("dnd", {
      name: "Restarting/shutting down..."
    });
    for (const command in collections.commands) {
      handler.unload(command);
    }
    client.disconnect();
    require("./utils/database.js").stop();
    process.exit(0);
  });
}

// launch the bot
init();