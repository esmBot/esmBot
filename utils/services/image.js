import { BaseServiceWorker } from "eris-fleet";
import * as logger from "../logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";
import { createRequire } from "module";

// only requiring this to work around an issue regarding worker threads
const nodeRequire = createRequire(import.meta.url);
nodeRequire(`../../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`);

import ImageConnection from "../imageConnection.js";

class ImageWorker extends BaseServiceWorker {
  constructor(setup) {
    super(setup);

    console.info = (str) => this.ipc.sendToAdmiral("info", str);

    if (process.env.API === "true") {
      this.jobs = {};
      this.connections = new Map();
      this.servers = JSON.parse(fs.readFileSync(new URL("../../servers.json", import.meta.url), { encoding: "utf8" })).image;
      this.nextID = 0;
    }

    this.begin().then(() => this.serviceReady());
  }

  async begin() {
    // connect to image api if enabled
    if (process.env.API === "true") {
      for (const server of this.servers) {
        try {
          await this.connect(server.server, server.auth);
        } catch (e) {
          logger.error(e);
        }
      }
    }
  }

  async repopulate() {
    const data = await fs.promises.readFile(new URL("../../servers.json", import.meta.url), { encoding: "utf8" });
    this.servers = JSON.parse(data).image;
    return;
  }

  async getRunning() {
    const statuses = [];
    if (process.env.API === "true") {
      for (const [address, connection] of this.connections) {
        if (connection.conn.readyState !== 0 && connection.conn.readyState !== 1) {
          continue;
        }
        statuses.push({
          address,
          runningJobs: connection.njobs,
          max: connection.max
        });
      }
    }
    return statuses;
  }

  async chooseServer(ideal) {
    if (ideal.length === 0) throw "No available servers";
    const sorted = ideal.sort((a, b) => {
      return a.load - b.load;
    }).filter((e, i, array) => {
      return !(e.load < array[0].load);
    });
    return sorted[0];
  }

  async getIdeal(object) {
    const idealServers = [];
    for (const [address, connection] of this.connections) {
      if (connection.conn.readyState !== 0 && connection.conn.readyState !== 1) {
        continue;
      }
      if (object.params.type && connection.formats[object.cmd] && !connection.formats[object.cmd].includes(object.params.type)) continue;
      idealServers.push({
        addr: address,
        load: connection.njobs / connection.max
      });
    }
    const server = await this.chooseServer(idealServers);
    return this.connections.get(server.addr);
  }

  async connect(server, auth) {
    const connection = new ImageConnection(server, auth);
    this.connections.set(server, connection);
  }

  async disconnect() {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
    return;
  }

  waitForWorker(worker) {
    return new Promise((resolve, reject) => {
      worker.once("message", (data) => {
        resolve({
          buffer: Buffer.from([...data.buffer]),
          type: data.fileExtension
        });
      });
      worker.once("error", reject);
    });
  }

  async run(object) {
    if (process.env.API === "true") {
      let num = this.nextID++;
      if (num > 4294967295) num = this.nextID = 0;
      for (let i = 0; i < 3; i++) {
        const currentServer = await this.getIdeal(object);
        try {
          await currentServer.queue(num, object);
          await currentServer.wait(num);
          const output = await currentServer.getOutput(num);
          return output;
        } catch (e) {
          if (i < 2 && e === "Request ended prematurely due to a closed connection") {
            continue;
          } else {
            if (e === "No available servers" && i >= 2) throw "Request ended prematurely due to a closed connection";
            throw e;
          }
        }
      }
    } else {
      // Called from command (not using image API)
      const worker = new Worker(path.join(path.dirname(fileURLToPath(import.meta.url)), "../image-runner.js"), {
        workerData: object
      });
      return await this.waitForWorker(worker);
    }
  }

  async handleCommand(data) {
    try {
      if (data.type === "run") {
        const result = await this.run(data.obj);
        return result;
      } else if (data.type === "reload") {
        await this.disconnect();
        await this.repopulate();
        let amount = 0;
        for (const server of this.servers) {
          try {
            await this.connect(server.server, server.auth);
            amount += 1;
          } catch (e) {
            logger.error(e);
          }
        }
        return amount;
      } else if (data.type === "stats") {
        return await this.getRunning();
      }
    } catch (err) {
      return { err: typeof err === "string" ? err : err.message };
    }
  }

  shutdown(done) {
    done();
  }
}

export default ImageWorker;
