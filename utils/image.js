const magick = require("../build/Release/image.node");
const { Worker } = require("worker_threads");
const fetch = require("node-fetch");
const AbortController = require("abort-controller");
const net = require("net");
const fileType = require("file-type");
exports.servers = require("../servers.json").image;
const path = require("path");
const { EventEmitter } = require("events");
const logger = require("./logger.js");

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const jobs = {};

const connections = [];

const statuses = {};

const chooseServer = async (ideal) => {
  if (ideal.length === 0) throw "No available servers";
  const sorted = ideal.sort((a, b) => {
    return b.load - a.load;
  });
  return sorted[0];
};

exports.connect = (server) => {
  return new Promise((resolve, reject) => {
    const connection = net.createConnection(8080, server);
    const timeout = setTimeout(() => {
      const connectionIndex = connections.indexOf(connection);
      if (connectionIndex < 0) delete connections[connectionIndex];
      reject(`Failed to connect to ${server}`);
    }, 5000);
    connection.once("connect", () => {
      clearTimeout(timeout);
    });
    connection.on("data", async (msg) => {
      const opcode = msg.readUint8(0);
      const req = msg.slice(37, msg.length);
      const uuid = msg.slice(1, 37).toString();
      if (opcode === 0x00) { // Job queued
        if (jobs[req]) {
          jobs[req].emit("uuid", uuid);
        }
      } else if (opcode === 0x01) { // Job completed successfully
      // the image API sends all job responses over the same socket; make sure this is ours
        if (jobs[uuid]) {
          const imageReq = await fetch(`http://${connection.remoteAddress}:8081/image?id=${uuid}`);
          const image = await imageReq.buffer();
          // The response data is given as the file extension/ImageMagick type of the image (e.g. "png"), followed
          // by a newline, followed by the image data.

          jobs[uuid].emit("image", image, imageReq.headers.get("ext"));
        }
      } else if (opcode === 0x02) { // Job errored
        if (jobs[uuid]) {
          jobs[uuid].emit("error", new Error(req));
        }
      } else if (opcode === 0x03) {
      // we use the uuid part here because queue info requests don't respond with one
        statuses[`${connection.remoteAddress}:${connection.remotePort}`] = parseInt(uuid);
      }
    });
    connection.on("error", (e) => {
      console.error(e);
    });
    connections.push(connection);
    resolve();
  });
};

const getIdeal = () => {
  return new Promise(async (resolve, reject) => {
    let serversLeft = connections.length;
    const idealServers = [];
    const timeout = setTimeout(async () => {
      try {
        const server = await chooseServer(idealServers);
        resolve(connections.find(val => val.remoteAddress === server.addr));
      } catch (e) {
        reject(e);
      }
    }, 5000);
    for (const connection of connections) {
      if (!connection.remoteAddress) continue;
      try {
        const statusRequest = await fetch(`http://${connection.remoteAddress}:8081/status`);
        const status = await statusRequest.text();
        serversLeft--;
        idealServers.push({
          addr: connection.remoteAddress,
          load: parseInt(status)
        });
        if (!serversLeft) {
          clearTimeout(timeout);
          const server = await chooseServer(idealServers);
          resolve(connections.find(val => val.remoteAddress === server.addr));
        }
      } catch (e) {
        reject(e);
      }
    }
  });
};

const start = (object, num) => {
  return new Promise(async (resolve, reject) => {
    try {
      const currentServer = await getIdeal();
      const data = Buffer.concat([Buffer.from([0x01 /* queue job */]), Buffer.from(num.length.toString()), Buffer.from(num), Buffer.from(JSON.stringify(object))]);
      currentServer.write(data, (err) => {
        if (err) {
          if (err.code === "EPIPE") {
            logger.log(`Lost connection to ${currentServer.remoteAddress}, attempting to reconnect...`);
            currentServer.connect(8080, currentServer.remoteAddress, async () => {
              const res = start(object, num);
              resolve(res);
            });
          } else {
            reject(err);
          }
        }
      });
      const event = new EventEmitter();
      event.once("uuid", (uuid) => {
        delete jobs[num];
        jobs[uuid] = event;
        resolve({ uuid, event });
      });
      jobs[num] = event;
    } catch (e) {
      reject(e);
    }
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
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 25000);
  try {
    const imageRequest = await fetch(image, { signal: controller.signal, headers: {
      "Range": "bytes=0-1023"
    }});
    clearTimeout(timeout);
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
  return new Promise(async (resolve, reject) => {
    if (process.env.API === "true") {
      try {
        // Connect to best image server
        const num = Math.floor(Math.random() * 100000).toString().slice(0, 5);
        const timeout = setTimeout(() => {
          if (jobs[num]) delete jobs[num];
          reject("Request timed out");
        }, 25000);
        const { uuid, event } = await start(object, num);
        clearTimeout(timeout);
        event.once("image", (image, type) => {
          delete jobs[uuid];
          const payload = {
            // Take just the image data
            buffer: image,
            type: type
          };
          resolve(payload);
        });
        event.once("error", (err) => {
          reject(err);
        });
      } catch (e) {
        reject(e);
      }
    } else {
      // Called from command (not using image API)
      const worker = new Worker(path.join(__dirname, "image-runner.js"), {
        workerData: object
      });
      worker.on("message", (data) => {
        resolve({
          buffer: Buffer.from([...data.buffer]),
          type: data.fileExtension
        });
      });
      worker.on("error", reject);
    }
  });
};
