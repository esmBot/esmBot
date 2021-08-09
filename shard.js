// shard base
const { BaseClusterWorker } = require("eris-fleet");
// path stuff
const { readdir } = require("fs").promises;
// fancy loggings
const logger = require("./utils/logger.js");
// initialize command loader
const handler = require("./utils/handler.js");
// lavalink stuff
const sound = require("./utils/soundplayer.js");
// database stuff
const database = require("./utils/database.js");
// command collections
const collections = require("./utils/collections.js");
// playing messages
const { messages } = require("./messages.json");
// other stuff
const misc = require("./utils/misc.js");
// generate help page
const helpGenerator =
  process.env.OUTPUT !== "" ? require("./utils/help.js") : null;
// whether a broadcast is currently in effect
let broadcast = false;

class Shard extends BaseClusterWorker {
  constructor(bot) {
    super(bot);

    this.init();
  }

  async init() {
    // register commands and their info
    const soundStatus = await sound.checkStatus();
    logger.log("info", "Attempting to load commands...");
    for await (const commandFile of this.getFiles("./commands/")) {
      logger.log("log", `Loading command from ${commandFile}...`);
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
      logger.log("log", `Loading event from ${file}...`);
      const eventName = file.split(".")[0];
      const event = require(`./events/${file}`);
      this.bot.on(eventName, event.bind(null, this.bot, this.clusterID, this.workerID, this.ipc));
    }

    // generate docs
    if (helpGenerator) {
      await helpGenerator.generateList();
      if (this.clusterID === 0 && helpGenerator) {
        await helpGenerator.createPage(process.env.OUTPUT);
        logger.log("info", "The help docs have been generated.");
      }
    }

    this.ipc.register("reload", async (message) => {
      const result = await handler.unload(message.msg);
      if (result) return this.ipc.broadcast("reloadFail", { result: result });
      const result2 = await handler.load(collections.paths.get(message.msg));
      if (result2) return this.ipc.broadcast("reloadFail", { result: result2 });
      return this.ipc.broadcast("reloadSuccess");
    });

    this.bot.privateChannels.limit = 0;

    this.ipc.register("soundreload", async () => {
      const soundStatus = await sound.checkStatus();
      if (!soundStatus) {
        const length = await sound.connect(this.bot);
        return this.ipc.broadcast("soundReloadSuccess", { length });
      } else {
        return this.ipc.broadcast("soundReloadFail");
      }
    });

    this.ipc.register("playbroadcast", (message) => {
      this.bot.editStatus("dnd", {
        name: `${message.msg} | @${this.bot.user.username} help`,
      });
      broadcast = true;
      return this.ipc.broadcast("broadcastSuccess");
    });

    this.ipc.register("broadcastend", () => {
      this.bot.editStatus("dnd", {
        name: `${misc.random(messages)} | @${this.bot.user.username} help`,
      });
      broadcast = false;
      return this.ipc.broadcast("broadcastEnd");
    });
    
    // connect to lavalink
    if (!sound.status && !sound.connected) sound.connect(this.bot);

    database.setup();

    this.activityChanger();

    logger.log("info", `Started worker ${this.workerID}.`);
  }

  // set activity (a.k.a. the gamer code)
  activityChanger() {
    if (!broadcast) {
      this.bot.editStatus("dnd", {
        name: `${misc.random(messages)} | @${this.bot.user.username} help`,
      });
    }
    setTimeout(this.activityChanger.bind(this), 900000);
  }

  async* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
      if (dirent.isDirectory()) {
        yield* this.getFiles(dir + dirent.name);
      } else {
        yield dir + (dir.charAt(dir.length - 1) !== "/" ? "/" : "") + dirent.name;
      }
    }
  }

  shutdown(done) {
    logger.log("warn", "Shutting down...");
    this.bot.editStatus("dnd", {
      name: "Restarting/shutting down..."
    });
    for (const command in collections.commands) {
      handler.unload(command);
    }
    require("./utils/database.js").stop();
    done();
  }

}

module.exports = Shard;
