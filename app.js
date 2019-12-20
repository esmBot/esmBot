// check if using node 10 or higher
if (process.version.slice(1).split(".")[0] < 10) throw new Error("Node 10.0.0 or higher is required. Update Node on your system.");

// load config from .env file
require("dotenv").config();

// turn fs.readdir into a promise
const { promisify } = require("util");
const fs = require("fs");
const readdir = promisify(fs.readdir);
// fancy loggings
const logger = require("./utils/logger.js");
// start the client
const client = require("./utils/client.js");
// initialize command loader
const handler = require("./utils/handler.js");

// registers stuff and logs in the bot
async function init() {
  // register commands and their info
  const commands = await readdir("./commands/");
  logger.log("info", `Attempting to load ${commands.length} commands...`);
  for (const commandFile of commands) {
    logger.log("info", `Loading command ${commandFile}...`);
    try {
      await handler.load(commandFile);
    } catch (e) {
      logger.error(`Failed to register command ${commandFile.split(".")[0]}: ${e}`);
    }
  }

  // register events
  const events = await readdir("./events/");
  logger.log("info", `Attempting to load ${events.length} events...`);
  for (const file of events) {
    logger.log("info", `Loading event ${file}...`);
    const eventName = file.split(".")[0];
    const event = require(`./events/${file}`);
    client.on(eventName, event);
  }

  // login
  client.connect();

  // post to DBL
  if (process.env.NODE_ENV === "production") {
    require("./utils/dbl.js");
  }
}

// launch the bot
init();
