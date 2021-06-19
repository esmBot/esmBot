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

exports.getRunning = async () => {
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
      const statusRequest = await fetch(`http://${address}:8080/running`, { signal: controller.signal });
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
};

exports.connect = (server) => {
  const connection = new WebSocket(`ws://${server}:8080/sock`);
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
    //logger.log(`Lost connection to ${server}, attempting to reconnect...`);
    this.connections.delete(server);
  });
  this.connections.set(server, connection);
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

const getIdeal = async () => {
  let serversLeft = this.connections.size;
  if (serversLeft === 0) {
    for (const server of this.servers) {
      try {
        await this.connect(server);
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
    }, 2000);
    try {
      const statusRequest = await fetch(`http://${address}:8080/status`, { signal: controller.signal });
      clearTimeout(timeout);
      const status = await statusRequest.text();
      serversLeft--;
      idealServers.push({
        addr: address,
        load: parseInt(status)
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
    const server = await chooseServer(idealServers);
    return { addr: server.addr, sock: this.connections.get(server.addr) };
  } else {
    throw new Error("Loop ended before all servers could be checked");
  }
};

const start = async (object, num) => {
  const currentServer = await getIdeal();
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
    if (parseInt(size) > 26214400) { // 25 MB
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
