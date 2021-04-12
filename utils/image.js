const magick = require("../build/Release/image.node");
const { Worker } = require("worker_threads");
const fetch = require("node-fetch");
const fs = require("fs");
const net = require("net");
const fileType = require("file-type");
const path = require("path");
const { EventEmitter } = require("events");
const logger = require("./logger.js");

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const jobs = {};

exports.connections = [];

const statuses = {};

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
    let serversLeft = this.connections.length;
    const statuses = [];
    const timeout = setTimeout(() => {
      resolve(statuses);
    }, 5000);
    for (const connection of this.connections) {
      if (!connection.remoteAddress) continue;
      fetch(`http://${connection.remoteAddress}:8081/running`).then(statusRequest => statusRequest.json()).then((status) => {
        serversLeft--;
        statuses.push(status);
        if (!serversLeft) {
          clearTimeout(timeout);
          resolve(statuses);
        }
        return;
      }).catch(e => reject(e));
    }
  });
};

exports.connect = (server) => {
  return new Promise((resolve, reject) => {
    const connection = net.createConnection(8080, server);
    const timeout = setTimeout(() => {
      const connectionIndex = this.connections.indexOf(connection);
      if (connectionIndex < 0) delete this.connections[connectionIndex];
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
    this.connections.push(connection);
    resolve();
  });
};

exports.disconnect = async () => {
  for (const connection of this.connections) {
    connection.destroy();
  }
  for (const uuid of Object.keys(jobs)) {
    jobs[uuid].emit("error", new Error("Job ended prematurely (not really an error; just run your image job again)"));
  }
  this.connections = [];
  return;
};

const getIdeal = () => {
  return new Promise((resolve, reject) => {
    let serversLeft = this.connections.length;
    const idealServers = [];
    const timeout = setTimeout(async () => {
      try {
        const server = await chooseServer(idealServers);
        resolve(this.connections.find(val => val.remoteAddress === server.addr));
      } catch (e) {
        reject(e);
      }
    }, 5000);
    for (const connection of this.connections) {
      if (!connection.remoteAddress) continue;
      fetch(`http://${connection.remoteAddress}:8081/status`).then(statusRequest => statusRequest.text()).then(async (status) => {
        serversLeft--;
        idealServers.push({
          addr: connection.remoteAddress,
          load: parseInt(status)
        });
        if (!serversLeft) {
          clearTimeout(timeout);
          const server = await chooseServer(idealServers);
          resolve(this.connections.find(val => val.remoteAddress === server.addr));
        }
        return;
      }).catch(e => reject(e));
    }
  });
};

const start = (object, num) => {
  return getIdeal().then(async (currentServer) => {
    const data = Buffer.concat([Buffer.from([0x01 /* queue job */]), Buffer.from(num.length.toString()), Buffer.from(num), Buffer.from(JSON.stringify(object))]);
    return new Promise((resolve, reject) => {
      currentServer.write(data, (err) => {
        if (err) {
          if (err.code === "EPIPE") {
            logger.log(`Lost connection to ${currentServer.remoteAddress}, attempting to reconnect...`);
            currentServer.connect(8080, currentServer.remoteAddress, () => {
              const res = start(object, num);
              reject(res); // this is done to differentiate the result from a step
            });
          } else {
            reject(err);
          }
        } else {
          resolve();
        }
      });
    });
  }).then(() => {
    const event = new EventEmitter();
    return new Promise((resolve) => {
      event.once("uuid", (uuid) => resolve({ event, uuid }));
      jobs[num] = event;
    });
  }, (result) => {
    throw result;
  }).then(data => {
    delete jobs[num];
    jobs[data.uuid] = data.event;
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
  return new Promise((resolve, reject) => {
    if (process.env.API === "true") {
      // Connect to best image server
      const num = Math.floor(Math.random() * 100000).toString().slice(0, 5);
      const timeout = setTimeout(() => {
        if (jobs[num]) delete jobs[num];
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
          delete jobs[data.uuid];
          const payload = {
          // Take just the image data
            buffer: image,
            type: type
          };
          resolve(payload);
        });
        data.event.once("error", (err) => {
          reject(err);
        });
        return;
      }).catch(err => reject(err));
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
