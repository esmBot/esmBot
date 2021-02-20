// code originally provided by tzlil

require("dotenv").config();
const os = require("os");
const { run } = require("../utils/image-runner.js");
const net = require("net");
const http = require("http");

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

const acceptJob = async (uuid, sock) => {
  jobAmount++;
  queue.shift();
  try {
    await runJob({
      uuid: uuid,
      msg: jobs[uuid].msg,
      num: jobs[uuid].num
    }, sock);
    jobAmount--;
    if (queue.length > 0) {
      acceptJob(queue[0], sock);
    }
    log(`Job ${uuid} has finished`);
  } catch (err) {
    console.error(`Error on job ${uuid}:`, err);
    jobAmount--;
    if (queue.length > 0) {
      acceptJob(queue[0], sock);
    }
    delete jobs[uuid];
    sock.write(Buffer.concat([Buffer.from([0x2]), Buffer.from(uuid), Buffer.from(err.toString())]));
  }
};

const httpServer = http.createServer((req, res) => {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("405 Method Not Allowed");
  }
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  if (reqUrl.pathname === "/status") {
    log(`Sending server status to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    return res.end(Buffer.from((MAX_JOBS - jobAmount).toString()));
  } else if (reqUrl.pathname === "/image") {
    if (!reqUrl.searchParams.has("id")) {
      res.statusCode = 400;
      return res.end("400 Bad Request");
    }
    const id = reqUrl.searchParams.get("id");
    if (!jobs[id]) {
      res.statusCode = 410;
      return res.end("410 Gone");
    }
    log(`Sending image data for job ${id} to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    res.setHeader("ext", jobs[id].ext);
    return res.end(jobs[id].data, (err) => {
      if (err) console.error(err);
      delete jobs[id];
    });
  } else {
    res.statusCode = 404;
    return res.end("404 Not Found");
  }
});

httpServer.on("error", (e) => {
  console.error("An HTTP error occurred: ", e);
});

httpServer.listen(8081, () => {
  log("HTTP listening on port 8081");
});

const server = net.createServer((sock) => { // Create a TCP socket/server to listen to requests
  log(`TCP client ${sock.remoteAddress}:${sock.remotePort} has connected`);

  sock.on("error", (e) => {
    console.error(e);
  });

  sock.on("data", (msg) => {
    const opcode = msg.readUint8(0);
    const req = msg.toString().slice(1,msg.length);
    console.log(req);
    // 0x00 == Cancel job
    // 0x01 == Queue job
    if (opcode == 0x00) {
      delete queue[queue.indexOf(req) - 1];
      delete jobs[req];
    } else if (opcode == 0x01) {
      const length = parseInt(req.slice(0, 1));
      const num = req.slice(1, length + 1);
      const obj = req.slice(length + 1);
      const job = { addr: sock.remoteAddress, port: sock.remotePort, msg: obj, num: jobAmount };
      const uuid = uuidv4();
      jobs[uuid] = job;
      queue.push(uuid);

      const newBuffer = Buffer.concat([Buffer.from([0x00]), Buffer.from(uuid), Buffer.from(num)]);
      sock.write(newBuffer);
  
      if (jobAmount < MAX_JOBS) {
        log(`Got TCP request for job ${job.msg} with id ${uuid}`, job.num);
        acceptJob(uuid, sock);
      } else {
        log(`Got TCP request for job ${job.msg} with id ${uuid}, queued in position ${queue.indexOf(uuid)}`, job.num);
      }
    } else {
      log("Could not parse TCP message");
    }
  });

  sock.on("end", () => {
    log(`TCP client ${sock.remoteAddress}:${sock.remotePort} has disconnected`);
  });
});

server.on("error", (e) => {
  console.error("A TCP error occurred: ", e);
});

server.listen(8080, () => {
  log("TCP listening on port 8080");
});

const runJob = (job, sock) => {
  return new Promise(async (resolve, reject) => {
    log(`Job ${job.uuid} starting...`, job.num);

    const object = JSON.parse(job.msg);
    // If the image has a path, it must also have a type
    if (object.path && !object.type) {
      reject(new TypeError("Unknown image type"));
    }

    log(`Job ${job.uuid} started`, job.num);
    try {
      const { buffer, fileExtension } = await run(object);
      log(`Sending result of job ${job.uuid} back to the bot`, job.num);
      jobs[job.uuid].data = buffer;
      jobs[job.uuid].ext = fileExtension;
      sock.write(Buffer.concat([Buffer.from([0x1]), Buffer.from(job.uuid)]), (e) => {
        if (e) return reject(e);
        return resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
};