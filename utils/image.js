const magick = require("../build/Release/image.node");
const fetch = require("node-fetch");
const { promisify } = require("util");
const AbortController = require("abort-controller");
const net = require("net");
const dgram = require("dgram");
const fileType = require("file-type");
const execPromise = promisify(require("child_process").exec);
const servers = require("../servers.json").image;

const formats = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

exports.run = (object, fromAPI = false) => {
  return new Promise(async (resolve, reject) => {
    if (process.env.API === "true" && !fromAPI) {
      const currentServer = servers[Math.floor(Math.random() * servers.length)];
      const socket = dgram.createSocket("udp4");
      const data = Buffer.concat([Buffer.from([0x1]), Buffer.from(JSON.stringify(object))]);
  
      //let jobID;
      socket.on("message", (msg) => {
        const opcode = msg.readUint8(0);
        const req = msg.slice(1, msg.length);
        if (opcode === 0x0) {
          //jobID = req;
          //console.log(`Our job UUID is: ${jobID}`);
        } else if (opcode === 0x1) {
          //console.log(`Job ${jobID} is finished!`);
          const client = net.createConnection(req.toString(), currentServer);
          const array = [];
          client.on("data", (rawData) => {
            array.push(rawData);
            /*if (rawData.length < 32 * 1024) {
              client.end();
            }*/
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
            throw err;
          });
        } else if (opcode === 0x2) {
          reject(req);
        }
      });
  
      socket.send(data, 8080, currentServer, (err) => {
        if (err) reject(err);
      });
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
      resolve(fromAPI ? data : {
        buffer: data,
        type: type
      });
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
    const imageRequest = await fetch(image, { signal: controller.signal, highWaterMark: 512 });
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
