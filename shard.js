// shard base
import { BaseClusterWorker } from "eris-fleet";
// path stuff
import { readdir } from "fs/promises";
import { readFileSync } from "fs";
// fancy loggings
import { log, error } from "./utils/logger.js";
// initialize command loader
import { load } from "./utils/handler.js";
// lavalink stuff
import { checkStatus, connect, status, connected } from "./utils/soundplayer.js";
// database stuff
import database from "./utils/database.js";
// command collections
import { paths } from "./utils/collections.js";
// playing messages
const { messages } = JSON.parse(readFileSync(new URL("./messages.json", import.meta.url)));
// other stuff
import { random } from "./utils/misc.js";
// generate help page
import { generateList, createPage } from "./utils/help.js";
// whether a broadcast is currently in effect
let broadcast = false;

class Shard extends BaseClusterWorker {
  constructor(bot) {
    super(bot);

    console.info = (str) => this.ipc.sendToAdmiral("info", str);
    this.init();
  }

  async init() {
    // register commands and their info
    const soundStatus = await checkStatus();
    log("info", "Attempting to load commands...");
    for await (const commandFile of this.getFiles("./commands/")) {
      log("log", `Loading command from ${commandFile}...`);
      try {
        await load(commandFile, soundStatus);
      } catch (e) {
        error(`Failed to register command from ${commandFile}: ${e}`);
      }
    }
    log("info", "Finished loading commands.");

    await database.setup(this.ipc);

    // register events
    log("info", "Attempting to load events...");
    for await (const file of this.getFiles("./events/")) {
      log("log", `Loading event from ${file}...`);
      const eventArray = file.split("/");
      const eventName = eventArray[eventArray.length - 1].split(".")[0];
      const { default: event } = await import(`./${file}`);
      this.bot.on(eventName, event.bind(null, this.bot, this.clusterID, this.workerID, this.ipc));
    }
    log("info", "Finished loading events.");

    // generate docs
    if (process.env.OUTPUT && process.env.OUTPUT !== "") {
      await generateList();
      if (this.clusterID === 0) {
        await createPage(process.env.OUTPUT);
        log("info", "The help docs have been generated.");
      }
    }

    this.ipc.register("reload", async (message) => {
      const path = paths.get(message);
      if (!path) return this.ipc.broadcast("reloadFail", { result: "I couldn't find that command!" });
      const result = await load(path, await checkStatus());
      if (result) return this.ipc.broadcast("reloadFail", { result });
      return this.ipc.broadcast("reloadSuccess");
    });

    this.bot.privateChannels.limit = 0;

    this.ipc.register("soundreload", async () => {
      const soundStatus = await checkStatus();
      if (!soundStatus) {
        const length = await connect(this.bot);
        return this.ipc.broadcast("soundReloadSuccess", { length });
      } else {
        return this.ipc.broadcast("soundReloadFail");
      }
    });

    this.ipc.register("playbroadcast", (message) => {
      this.bot.editStatus("dnd", {
        name: `${message} | @${this.bot.user.username} help`,
      });
      broadcast = true;
      return this.ipc.broadcast("broadcastSuccess");
    });

    this.ipc.register("broadcastend", () => {
      this.bot.editStatus("dnd", {
        name: `${random(messages)} | @${this.bot.user.username} help`,
      });
      broadcast = false;
      return this.ipc.broadcast("broadcastEnd");
    });

    // connect to lavalink
    if (!status && !connected) connect(this.bot);

    this.activityChanger();

    log("info", `Started worker ${this.workerID}.`);
  }

  // set activity (a.k.a. the gamer code)
  activityChanger() {
    if (!broadcast) {
      this.bot.editStatus("dnd", {
        name: `${random(messages)} | @${this.bot.user.username} help`,
      });
    }
    setTimeout(this.activityChanger.bind(this), 900000);
  }

  async* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
      if (dirent.isDirectory()) {
        yield* this.getFiles(dir + dirent.name);
      } else if (dirent.name.endsWith(".js")) {
        yield dir + (dir.charAt(dir.length - 1) !== "/" ? "/" : "") + dirent.name;
      }
    }
  }

  shutdown(done) {
    log("warn", "Shutting down...");
    this.bot.editStatus("dnd", {
      name: "Restarting/shutting down..."
    });
    database.stop();
    done();
  }

}

export default Shard;
