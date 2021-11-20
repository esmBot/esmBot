import { BaseServiceWorker } from "eris-fleet";
import * as logger from "../logger.js";
import fetch from "node-fetch";
import WebSocket from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";
import { EventEmitter } from "events";

class ImageWorker extends BaseServiceWorker {
  constructor(setup) {
    super(setup);

    if (process.env.API === "true") {
      this.jobs = {};
      this.connections = new Map();
      this.servers = JSON.parse(fs.readFileSync("./servers.json", { encoding: "utf8" })).image;
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
    const data = await fs.promises.readFile("./servers.json", { encoding: "utf8" });
    this.servers = JSON.parse(data).image;
    return;
  }

  async getRunning() {
    let serversLeft = this.connections.size;
    const statuses = [];
    for (const address of this.connections.keys()) {
      const connection = this.connections.get(address);
      if (connection.readyState !== 0 && connection.readyState !== 1) {
        serversLeft--;
        continue;
      }
      const controller = new AbortController(); // eslint-disable-line no-undef
      const timeout = setTimeout(() => {
        controller.abort();
      }, 2000);
      try {
        const auth = this.servers.filter((val) => val.server === address)[0].auth;
        const statusRequest = await fetch(`http://${address}:8080/running`, {
          signal: controller.signal,
          headers: {
            "Authentication": auth && auth !== "" ? auth : undefined
          }
        });
        clearTimeout(timeout);
        const status = await statusRequest.json();
        serversLeft--;
        statuses.push(status);
      } catch (e) {
        if (e.name === "AbortError") {
          serversLeft--;
          continue;
        } else if (e.code === "ECONNREFUSED") {
          serversLeft--;
          continue;
        }
        throw e;
      }
    }
    if (!serversLeft) {
      return statuses;
    } else {
      throw new Error("Loop ended before all servers could be checked");
    }
  }

  async chooseServer(ideal) {
    if (ideal.length === 0) throw "No available servers";
    const sorted = ideal.sort((a, b) => {
      return b.load - a.load;
    }).filter((e, i, array) => {
      return !(e.load < array[0].load);
    }).sort((a, b) => {
      return a.queued - b.queued;
    });
    return sorted[0];
  }

  async getIdeal() {
    let serversLeft = this.connections.size;
    if (serversLeft < this.servers.length) {
      for (const server of this.servers) {
        try {
          if (!this.connections.has(server.server)) await this.connect(server.server, server.auth);
        } catch (e) {
          logger.error(e);
        }
      }
      serversLeft = this.connections.size;
    }
    const idealServers = [];
    for (const address of this.connections.keys()) {
      const connection = this.connections.get(address);
      if (connection.readyState !== 0 && connection.readyState !== 1) {
        serversLeft--;
        continue;
      }
      const controller = new AbortController(); // eslint-disable-line no-undef
      const timeout = setTimeout(() => {
        controller.abort();
      }, 5000);
      try {
        const auth = this.servers.filter((val) => val.server === address)[0].auth;
        const statusRequest = await fetch(`http://${address}:8080/status`, {
          signal: controller.signal,
          headers: {
            "Authentication": auth && auth !== "" ? auth : undefined
          }
        });
        clearTimeout(timeout);
        const status = await statusRequest.json();
        serversLeft--;
        idealServers.push({
          addr: address,
          load: status.load,
          queued: status.queued
        });
      } catch (e) {
        if (e.name === "AbortError") {
          serversLeft--;
          continue;
        } else if (e.code === "ECONNREFUSED") {
          serversLeft--;
          continue;
        }
        throw e;
      } finally {
        clearTimeout(timeout);
      }
    }
    if (!serversLeft) {
      const server = await this.chooseServer(idealServers);
      return { addr: server.addr, sock: this.connections.get(server.addr) };
    } else {
      throw new Error("Loop ended before all servers could be checked");
    }
  }

  async connect(server, auth) {
    const connection = new WebSocket(`ws://${server}:8080/sock`, {
      headers: {
        "Authentication": auth && auth !== "" ? auth : undefined
      }
    });
    connection.on("message", async (msg) => {
      const opcode = msg.readUint8(0);
      const req = msg.slice(37, msg.length);
      const uuid = msg.slice(1, 37).toString();
      if (opcode === 0x00) { // Job queued
        if (this.jobs[req]) {
          this.jobs[req].event.emit("uuid", uuid);
        }
      } else if (opcode === 0x01) { // Job completed successfully
        // the image API sends all job responses over the same socket; make sure this is ours
        if (this.jobs[uuid]) {
          const imageReq = await fetch(`http://${server}:8080/image?id=${uuid}`, {
            headers: {
              "Authentication": auth && auth !== "" ? auth : undefined
            }
          });
          const image = Buffer.from(await imageReq.arrayBuffer());
          // The response data is given as the file extension/ImageMagick type of the image (e.g. "png"), followed
          // by a newline, followed by the image data.

          this.jobs[uuid].event.emit("image", image, imageReq.headers.get("ext"));
        }
      } else if (opcode === 0x02) { // Job errored
        if (this.jobs[uuid]) {
          this.jobs[uuid].event.emit("error", new Error(req));
        }
      }
    });
    connection.on("error", (e) => {
      logger.error(e.toString());
    });
    connection.once("close", () => {
      for (const uuid of Object.keys(this.jobs)) {
        if (this.jobs[uuid].addr === server) {
          this.jobs[uuid].event.emit("error", "Job ended prematurely due to a closed connection; please run your image job again");
          delete this.jobs[uuid];
        }
      }
      //logger.log(`Lost connection to ${server}, attempting to reconnect...`);
      this.connections.delete(server);
    });
    this.connections.set(server, connection);
  }

  async disconnect() {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    for (const uuid of Object.keys(this.jobs)) {
      this.jobs[uuid].event.emit("error", "Job ended prematurely (not really an error; just run your image job again)");
      delete this.jobs[uuid];
    }
    this.connections.clear();
    return;
  }

  async start(object, num) {
    const currentServer = await this.getIdeal();
    const data = Buffer.concat([Buffer.from([0x01 /* queue job */]), Buffer.from(num.length.toString()), Buffer.from(num), Buffer.from(JSON.stringify(object))]);
    currentServer.sock.send(data);
    const event = new EventEmitter();
    this.jobs[num] = { event, addr: currentServer.addr };
    const uuid = await new Promise((resolve, reject) => {
      event.once("uuid", (uuid) => resolve(uuid));
      event.once("error", reject);
    });
    delete this.jobs[num];
    this.jobs[uuid] = { event: event, addr: currentServer.addr };
    return { uuid: uuid, event: event };
  }

  run(object) {
    return new Promise((resolve, reject) => {
      if (process.env.API === "true") {
        // Connect to best image server
        const num = Math.floor(Math.random() * 100000).toString().slice(0, 5);
        const timeout = setTimeout(() => {
          if (this.jobs[num]) delete this.jobs[num];
          reject("The image request timed out after 25 seconds. Try uploading your image elsewhere.");
        }, 25000);
        this.start(object, num).then((data) => {
          clearTimeout(timeout);
          if (!data.event) reject("Not connected to image server");
          data.event.once("image", (image, type) => {
            delete this.jobs[data.uuid];
            const payload = {
              // Take just the image data
              buffer: image,
              type: type
            };
            resolve(payload);
          });
          data.event.once("error", (err) => {
            delete this.jobs[data.uuid];
            reject(err);
          });
          return;
        }).catch(err => reject(err));
      } else {
        // Called from command (not using image API)
        const worker = new Worker(path.join(path.dirname(fileURLToPath(import.meta.url)), "../image-runner.js"), {
          workerData: object
        });
        worker.once("message", (data) => {
          resolve({
            buffer: Buffer.from([...data.buffer]),
            type: data.fileExtension
          });
        });
        worker.once("error", reject);
      }
    });
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
