import { BaseServiceWorker } from "eris-fleet";
import * as logger from "../logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";
import { createRequire } from "module";
import { createServer } from "http";
import fetch from "node-fetch";
import EventEmitter from "events";

// only requiring this to work around an issue regarding worker threads
const nodeRequire = createRequire(import.meta.url);
nodeRequire(`../../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`);

import ImageConnection from "../imageConnection.js";

class ImageWorker extends BaseServiceWorker {
  constructor(setup) {
    super(setup);

    console.info = (str) => this.ipc.sendToAdmiral("info", str);

    if (process.env.API_TYPE === "ws") {
      this.connections = new Map();
      this.servers = JSON.parse(fs.readFileSync(new URL("../../config/servers.json", import.meta.url), { encoding: "utf8" })).image;
      this.nextID = 0;
    } else if (process.env.API_TYPE === "azure") {
      this.jobs = new Map();
      this.webhook = createServer();
      this.port = parseInt(process.env.WEBHOOK_PORT) || 3763;
    }

    this.begin().then(() => this.serviceReady());
  }

  async begin() {
    // connect to image api if enabled
    if (process.env.API_TYPE === "ws") {
      for (const server of this.servers) {
        try {
          await this.connect(server.server, server.auth);
        } catch (e) {
          logger.error(e);
        }
      }
    } else if (process.env.API_TYPE === "azure") {
      this.webhook.on("request", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end("405 Method Not Allowed");
        }
        if (process.env.AZURE_PASS && req.headers.authorization !== process.env.AZURE_PASS) {
          res.statusCode = 401;
          return res.end("401 Unauthorized");
        }
        const reqUrl = new URL(req.url, `http://${req.headers.host}`);
        if (reqUrl.pathname === "/callback") {
          try {
            const chunks = [];
            req.on("data", (data) => {
              chunks.push(data);
            });
            req.once("end", () => {
              if (this.jobs.has(req.headers["x-azure-id"])) {
                try {
                  const error = JSON.parse(Buffer.concat(chunks).toString());
                  if (error.error) this.jobs.get(req.headers["x-azure-id"]).emit("error", new Error(error.message));
                } catch {
                  // no-op
                }
                const contentType = req.headers["content-type"];
                let type;
                switch (contentType) {
                  case "image/gif":
                    type = "gif";
                    break;
                  case "image/png":
                    type = "png";
                    break;
                  case "image/jpeg":
                    type = "jpg";
                    break;
                  case "image/webp":
                    type = "webp";
                    break;
                  default:
                    type = contentType;
                    break;
                }
                this.jobs.get(req.headers["x-azure-id"]).emit("image", { buffer: Buffer.concat(chunks), type });
                return res.end("OK");
              } else {
                res.statusCode = 409;
                return res.end("409 Conflict");
              }
            });
          } catch (e) {
            logger.error("An error occurred while processing a webhook request: ", e);
            res.statusCode = 500;
            return res.end("500 Internal Server Error");
          }
        } else {
          res.statusCode = 404;
          return res.end("404 Not Found");
        }
      });
      this.webhook.on("error", (e) => {
        logger.error("An error occurred on the Azure webhook: ", e);
      });
      this.webhook.listen(this.port, () => {
        logger.log(`Azure HTTP webhook listening on port ${this.port}`);
      });
    }
  }

  async repopulate() {
    const data = await fs.promises.readFile(new URL("../../config/servers.json", import.meta.url), { encoding: "utf8" });
    this.servers = JSON.parse(data).image;
    return;
  }

  async getRunning() {
    const statuses = [];
    if (process.env.API_TYPE === "ws") {
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
      if (object.params.type && !connection.formats[object.cmd]?.includes(object.params.type)) continue;
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

  waitForAzure(event) {
    return new Promise((resolve, reject) => {
      event.once("image", (data) => {
        resolve(data);
      });
      event.once("error", reject);
    });
  }

  async run(object) {
    if (process.env.API_TYPE === "ws") {
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
    } else if (process.env.API_TYPE === "azure") {
      object.callback = `${process.env.AZURE_CALLBACK_URL}:${this.port}/callback`;
      const response = await fetch(`${process.env.AZURE_URL}/api/orchestrators/ImageOrchestrator`, { method: "POST", body: JSON.stringify(object) }).then(r => r.json());
      const event = new EventEmitter();
      this.jobs.set(response.id, event);
      return await this.waitForAzure(event);
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
