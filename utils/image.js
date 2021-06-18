const magick = require("../build/Release/image.node");
const { Worker } = require("worker_threads");
const fetch = require("node-fetch");
const fs = require("fs");
const WebSocket = require("ws");
const fileType = require("file-type");
const path = require("path");
const { EventEmitter } = require("events");
const logger = require("./logger.js");

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/mov"];

exports.jobs = {};

exports.connections = new Map();

exports.servers = JSON.parse(fs.readFileSync("./servers.json", { encoding: "utf8" })).image;

const chooseServer = async (ideal) => {
  if (ideal.length === 0) throw "No available servers";
  const sorted = ideal.sort((a, b) => {
    return b.load - a.load;
  });
  return sorted[0];
};

exports.repopulate = async () => {
  const data = await fs.promises.readFile("./servers.json", { encoding: "utf8" });
  this.servers = JSON.parse(data).image;
  return;
};

exports.getStatus = () => {
  return new Promise((resolve, reject) => {
    let serversLeft = this.connections.size;
    const statuses = [];
    const timeout = setTimeout(() => {
      resolve(statuses);
    }, 5000);
    for (const address of this.connections.keys()) {
      const connection = this.connections.get(address);
      if (connection.readyState !== 1) {
        serversLeft--;
        continue;
      }
      fetch(`http://${address}:8080/running`).then(statusRequest => statusRequest.json()).then((status) => {
        serversLeft--;
        statuses.push(status);
        if (!serversLeft) {
          clearTimeout(timeout);
          resolve(statuses);
        }
        return;
      }).catch(e => {
        if (e.code === "ECONNREFUSED") {
          serversLeft--;
          return;
        }
        reject(e);
      });
    }
    if (!serversLeft) {
      clearTimeout(timeout);
      resolve(statuses);
    }
  });
};

exports.connect = (server) => {
  return new Promise((resolve, reject) => {
    const connection = new WebSocket(`ws://${server}:8080/sock`);
    const timeout = setTimeout(() => {
      this.connections.delete(server);
      reject(`Failed to connect to ${server}`);
    }, 5000);
    connection.once("open", () => {
      clearTimeout(timeout);
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
          const imageReq = await fetch(`http://${server}:8080/image?id=${uuid}`);
          const image = await imageReq.buffer();
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
        if (this.jobs[uuid].addr === server) this.jobs[uuid].event.emit("error", "Job ended prematurely due to a closed connection; please run your image job again");
      }
      logger.log(`Lost connection to ${server}, attempting to reconnect...`);
      this.connections.delete(server);
      //this.connect(server);
    });
    this.connections.set(server, connection);
    resolve();
  });
};

exports.disconnect = async () => {
  for (const connection of this.connections.values()) {
    connection.close();
  }
  for (const uuid of Object.keys(this.jobs)) {
    this.jobs[uuid].event.emit("error", "Job ended prematurely (not really an error; just run your image job again)");
    delete this.jobs[uuid];
  }
  this.connections.clear();
  return;
};

const getIdeal = () => {
  return new Promise((resolve, reject) => {
    let serversLeft = this.connections.size;
    if (serversLeft === 0) {
      for (const server of this.servers) {
        this.connect(server).catch(e => {
          logger.error(e);
        });
      }
      serversLeft = this.connections.size;
    }
    const idealServers = [];
    const timeout = setTimeout(async () => {
      try {
        const server = await chooseServer(idealServers);
        resolve({ addr: server.addr, sock: this.connections.get(server.addr) });
      } catch (e) {
        reject(e);
      }
    }, 5000);
    for (const address of this.connections.keys()) {
      const connection = this.connections.get(address);
      if (connection.readyState !== 1) {
        serversLeft--;
        continue;
      }
      fetch(`http://${address}:8080/status`).then(statusRequest => statusRequest.text()).then((status) => {
        serversLeft--;
        idealServers.push({
          addr: address,
          load: parseInt(status)
        });
        return;
      }).then(async () => {
        if (!serversLeft) {
          clearTimeout(timeout);
          const server = await chooseServer(idealServers);
          resolve({ addr: server.addr, sock: this.connections.get(server.addr) });
        }
      }).catch(e => {
        if (e.code === "ECONNREFUSED") {
          serversLeft--;
          return;
        }
        reject(e);
      });
    }
    if (!serversLeft) {
      clearTimeout(timeout);
      chooseServer(idealServers).then(server => {
        resolve({ addr: server.addr, sock: this.connections.get(server.addr) });
      }).catch(e => reject(e));
    }
  });
};

const start = (object, num) => {
  return getIdeal().then(async (currentServer) => {
    const data = Buffer.concat([Buffer.from([0x01 /* queue job */]), Buffer.from(num.length.toString()), Buffer.from(num), Buffer.from(JSON.stringify(object))]);
    return new Promise((resolve) => {
      currentServer.sock.send(data, () => {
        resolve(currentServer.addr);
      });
    });
  }).catch((result) => {
    throw result;
  }).then((addr) => {
    const event = new EventEmitter();
    return new Promise((resolve, reject) => {
      event.once("uuid", (uuid) => resolve({ event, uuid, addr }));
      event.once("error", reject);
      this.jobs[num] = { event, addr };
    });
  }).then(data => {
    delete this.jobs[num];
    this.jobs[data.uuid] = { event: data.event, addr: data.addr };
    return { uuid: data.uuid, event: data.event };
  });
};

exports.check = (cmd) => {
  return magick[cmd] ? true : false;
};

exports.getType = async (image) => {
  if (!image.startsWith("http")) {
    const imageType = await fileType.fromFile(image);
    if (imageType && formats.includes(imageType.mime)) {
      return imageType.mime;
    }
    return undefined;
  }
  let type;
  const controller = new AbortController(); // eslint-disable-line no-undef
  const timeout = setTimeout(() => {
    controller.abort();
  }, 25000);
  try {
    const imageRequest = await fetch(image, {
      signal: controller.signal, headers: {
        "Range": "bytes=0-1023"
      }
    });
    clearTimeout(timeout);
    const size = imageRequest.headers.has("Content-Range") ? imageRequest.headers.get("Content-Range").split("/")[1] : imageRequest.headers.get("Content-Length");
    if (parseInt(size) > 20971520) {
      type = "large";
      return type;
    }
    const imageBuffer = await imageRequest.buffer();
    const imageType = await fileType.fromBuffer(imageBuffer);
    if (imageType && formats.includes(imageType.mime)) {
      type = imageType.mime;
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw Error("Timed out");
    } else {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
  return type;
};

exports.run = object => {
  return new Promise((resolve, reject) => {
    if (process.env.API === "true") {
      // Connect to best image server
      const num = Math.floor(Math.random() * 100000).toString().slice(0, 5);
      const timeout = setTimeout(() => {
        if (this.jobs[num]) delete this.jobs[num];
        reject("the image request timed out after 25 seconds. Try uploading your image elsewhere.");
      }, 25000);
      start(object, num).catch(err => { // incredibly hacky code incoming
        clearTimeout(timeout);
        if (err instanceof Error) return reject(err);
        return err;
      }).then((data) => {
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
      const worker = new Worker(path.join(__dirname, "image-runner.js"), {
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
};
