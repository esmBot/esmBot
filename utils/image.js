const magick = require("../build/Release/image.node");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const fetch = require("node-fetch");
const { promisify } = require("util");
const AbortController = require("abort-controller");
const net = require("net");
const dgram = require("dgram");
const fileType = require("file-type");
const execPromise = promisify(require("child_process").exec);
const servers = require("../servers.json").image;

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const chooseServer = async (ideal) => {
  if (ideal.length === 0) throw "No available servers";
  const sorted = ideal.sort((a, b) => {
    return b.load - a.load;
  });
  return sorted[0];
};

const getIdeal = () => {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    let serversLeft = servers.length;
    const idealServers = [];
    const timeout = setTimeout(() => {
      socket.close(async () => {
        try {
          const server = await chooseServer(idealServers);
          resolve(server);
        } catch (e) {
          reject(e);
        }
      });
    }, 5000);
    socket.on("message", async (msg, rinfo) => {
      const opcode = msg.readUint8(0);
      const res = parseInt(msg.slice(1, msg.length).toString());
      if (opcode === 0x3) {
        serversLeft--;
        idealServers.push({
          addr: rinfo.address,
          load: res
        });
        if (!serversLeft) {
          clearTimeout(timeout);
          socket.close(async () => {
            try {
              const server = await chooseServer(idealServers);
              resolve(server);
            } catch (e) {
              reject(e);
            }
          });
        }
      }
    });
    for (const server of servers) {
      socket.send(Buffer.from([0x2]), 8080, server, (err) => {
        if (err) reject(err);
      });
    }
  });
};

const getFormat = (buffer, delimiter) => {
  for (var i = 0; i < buffer.length ; i++) {
    if (String.fromCharCode(buffer[i]) === delimiter) {
      return {
        buffer: buffer.slice(0, i),
        dataStart: i
      };
    }
  }
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

exports.run = (object, fromAPI = false) => {
  return new Promise(async (resolve, reject) => {
    if (process.env.API === "true" && !fromAPI) {
      const currentServer = await getIdeal();
      const socket = dgram.createSocket("udp4");
      const data = Buffer.concat([Buffer.from([0x1]), Buffer.from(JSON.stringify(object))]);

      const timeout = setTimeout(() => {
        reject("UDP timed out");
      }, 25000);
      
      let jobID;
      socket.on("message", (msg) => {
        const opcode = msg.readUint8(0);
        const req = msg.slice(37, msg.length);
        const uuid = msg.slice(1, 36).toString();
        if (opcode === 0x0) {
          clearTimeout(timeout);
          jobID = uuid;
        } else if (opcode === 0x1) {
          if (jobID === uuid) {
            const client = net.createConnection(req.toString(), currentServer.addr);
            const array = [];
            client.on("data", (rawData) => {
              array.push(rawData);
            });
            client.once("end", () => {
              const data = Buffer.concat(array);
              const format = getFormat(data, "\n");
              const payload = {
                buffer: data.slice(format.dataStart + 1),
                type: format.buffer.toString().split("/")[1]
              };
              socket.close();
              resolve(payload);
            });
            client.on("error", (err) => {
              reject(err);
            });
          }
        } else if (opcode === 0x2) {
          if (jobID === uuid) reject(req);
        }
      });
  
      socket.send(data, 8080, currentServer.addr, (err) => {
        if (err) reject(err);
      });
    } else if (isMainThread && !fromAPI) {
      const worker = new Worker(__filename, {
        workerData: object
      });
      worker.on("message", (data) => {
        resolve({
          buffer: Buffer.from([...data.buffer]),
          type: data.type
        });
      });
      worker.on("error", reject);
    } else {
      let type;
      if (!fromAPI && object.path) {
        const newType = (object.type ? object.type : await this.getType(object.path));
        type = newType ? newType.split("/")[1] : "png";
        if (type !== "gif" && object.onlyGIF) resolve({
          buffer: "nogif",
          type: null
        });
        object.type = type;
        const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${object.path}`)).stdout.replace("\n", "");
        object.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
      }
      const data = await promisify(magick[object.cmd])(object);
      const returnObject = fromAPI ? data : {
        buffer: data,
        type: type
      };
      if (!isMainThread && !fromAPI) {
        parentPort.postMessage(returnObject);
        process.exit();
      } else {
        resolve(returnObject);
      }
    }
  });
};

if (!isMainThread && process.env.API !== "true") this.run(workerData);
