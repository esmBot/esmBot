// code originally provided by tzlil

require("dotenv").config();
const os = require("os");
const { getType } = require("../utils/image.js");
const { run } = require("../utils/image-runner.js");
const execPromise = require("util").promisify(require("child_process").exec);
const net = require("net");
const dgram = require("dgram"); // for UDP servers
const socket = dgram.createSocket("udp4"); // Our universal UDP socket, this might cause issues and we may have to use a seperate socket for each connection

const start = process.hrtime();
const log = (msg, jobNum) => {
  console.log(`[${process.hrtime(start)[1] / 1000000}${jobNum !== undefined ? `:${jobNum}` : ""}]\t ${msg}`);
};

const jobs = {};
// Should look like UUID : { addr : "someaddr", port: someport msg: "request" }
const queue = [];
// Array of UUIDs

const { v4: uuidv4 } = require("uuid");

const MAX_JOBS = process.env.JOBS !== "" && process.env.JOBS !== undefined ? parseInt(process.env.JOBS) : os.cpus().length * 4; // Completely arbitrary, should usually be some multiple of your amount of cores
let jobAmount = 0;

const acceptJob = async (uuid) => {
  jobAmount++;
  queue.shift();
  try {
    await runJob({
      uuid: uuid,
      msg: jobs[uuid].msg,
      addr: jobs[uuid].addr,
      port: jobs[uuid].port,
      num: jobs[uuid].num
    });
    jobAmount--;
    if (queue.length > 0) {
      acceptJob(queue[0]);
    }
    delete jobs[uuid];
    log(`Job ${uuid} has finished`);
  } catch (err) {
    console.error(`Error on job ${uuid}:`, err);
    socket.send(Buffer.concat([Buffer.from([0x2]), Buffer.from(uuid), Buffer.from(err.toString())]), jobs[uuid].port, jobs[uuid].addr);
    jobAmount--;
    if (queue.length > 0) {
      acceptJob(queue[0]);
    }
    delete jobs[uuid];
  }
};

const server = dgram.createSocket("udp4"); //Create a UDP server for listening to requests, we dont need tcp
server.on("message", (msg, rinfo) => {
  const opcode = msg.readUint8(0);
  const req = msg.toString().slice(1,msg.length);
  // 0x0 == Cancel job
  // 0x1 == Queue job
  // 0x2 == Get CPU usage
  if (opcode == 0x0) {
    delete queue[queue.indexOf(req) - 1];
    delete jobs[req];
  } else if (opcode == 0x1) {
    const job = { addr: rinfo.address, port: rinfo.port, msg: req, num: jobAmount };
    const uuid = uuidv4();
    jobs[uuid] = job;
    queue.push(uuid);

    if (jobAmount < MAX_JOBS) {
      log(`Got request for job ${job.msg} with id ${uuid}`, job.num);
      acceptJob(uuid);
    } else {
      log(`Got request for job ${job.msg} with id ${uuid}, queued in position ${queue.indexOf(uuid)}`, job.num);
    }

    const newBuffer = Buffer.concat([Buffer.from([0x0]), Buffer.from(uuid)]);
    socket.send(newBuffer, rinfo.port, rinfo.address);
  } else if (opcode == 0x2) {
    socket.send(Buffer.concat([Buffer.from([0x3]), Buffer.from((MAX_JOBS - jobAmount).toString())]), rinfo.port, rinfo.address);
  } else {
    log("Could not parse message");
  }
});

server.on("listening", () => {
  const address = server.address();
  log(`server listening ${address.address}:${address.port}`);
});

server.bind(8080); // ATTENTION: Always going to be bound to 0.0.0.0 !!!

const runJob = (job) => {
  return new Promise(async (resolve, reject) => {
    log(`Job ${job.uuid} starting...`, job.num);

    const object = JSON.parse(job.msg);
    let type;
    if (object.path) {
      type = object.type;
      if (!object.type) {
        type = await getType(object.path);
      }
      if (!type) {
        reject(new TypeError("Unknown image type"));
      }
      object.type = type.split("/")[1];
      if (object.type !== "gif" && object.onlyGIF) reject(new TypeError(`Expected a GIF, got ${object.type}`));
      object.delay = object.delay ? object.delay : 0;
    }

    if (object.type === "gif" && !object.delay) {
      const delay = (await execPromise(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${object.path}`)).stdout.replace("\n", "");
      object.delay = (100 / delay.split("/")[0]) * delay.split("/")[1];
    }

    log(`Job ${job.uuid} started`, job.num);
    const data = await run(object, true);

    log(`Sending result of job ${job.uuid} back to the bot`, job.num);
    const server = net.createServer(function(tcpSocket) {
      tcpSocket.write(Buffer.concat([Buffer.from(type ? type : "image/png"), Buffer.from("\n"), data]), (err) => {
        if (err) console.error(err);
        tcpSocket.end(() => {
          server.close();
          resolve(null);
        });
      });
    });
    server.listen(job.port, job.addr);
    // handle address in use errors
    server.on("error", (e) => {
      if (e.code === "EADDRINUSE") {
        log("Address in use, retrying...", job.num);
        setTimeout(() => {
          server.close();
          server.listen(job.port, job.addr);
        }, 500);
      }
    });
    socket.send(Buffer.concat([Buffer.from([0x1]), Buffer.from(job.uuid), Buffer.from(job.port.toString())]), job.port, job.addr);
  });
};