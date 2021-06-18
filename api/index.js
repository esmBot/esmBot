require("dotenv").config();
const os = require("os");
//const { run } = require("../utils/image-runner.js");
const { Worker } = require("worker_threads");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const start = process.hrtime();
const log = (msg, jobNum) => {
  console.log(`[${process.hrtime(start)[1] / 1000000}${jobNum !== undefined ? `:${jobNum}` : ""}]\t ${msg}`);
};

class JobCache extends Map {
  set(key, value) {
    super.set(key, value);
    setTimeout(() => {
      if (super.has(key) && this.get(key) === value && value.data) super.delete(key);
    }, 300000); // delete jobs if not requested after 5 minutes
  }
}

const jobs = new JobCache();
// Should look like UUID : { msg: "request", num: <job number> }
const queue = [];
// Array of UUIDs

const { v4: uuidv4 } = require("uuid");

const MAX_JOBS = process.env.JOBS !== "" && process.env.JOBS !== undefined ? parseInt(process.env.JOBS) : os.cpus().length * 4; // Completely arbitrary, should usually be some multiple of your amount of cores
let jobAmount = 0;

const acceptJob = (uuid, sock) => {
  jobAmount++;
  queue.shift();
  const job = jobs.get(uuid);
  return runJob({
    uuid: uuid,
    msg: job.msg,
    num: job.num
  }, sock).then(() => {
    log(`Job ${uuid} has finished`);
  }).catch((err) => {
    console.error(`Error on job ${uuid}:`, err);
    jobs.delete(uuid);
    sock.send(Buffer.concat([Buffer.from([0x2]), Buffer.from(uuid), Buffer.from(err.message)]));
  }).finally(() => {
    jobAmount--;
    if (queue.length > 0) {
      acceptJob(queue[0], sock);
    }
  });
};

const wss = new WebSocket.Server({ clientTracking: true, noServer: true });

wss.on("connection", (ws, request) => {
  log(`WS client ${request.socket.remoteAddress}:${request.socket.remotePort} has connected`);

  ws.on("error", (err) => {
    console.error(err);
  });

  ws.on("message", (msg) => {
    const opcode = msg.readUint8(0);
    const req = msg.toString().slice(1,msg.length);
    console.log(req);
    // 0x00 == Cancel job
    // 0x01 == Queue job
    if (opcode == 0x00) {
      delete queue[queue.indexOf(req) - 1];
      jobs.delete(req);
    } else if (opcode == 0x01) {
      const length = parseInt(req.slice(0, 1));
      const num = req.slice(1, length + 1);
      const obj = req.slice(length + 1);
      const job = { msg: obj, num: jobAmount };
      const uuid = uuidv4();
      jobs.set(uuid, job);
      queue.push(uuid);

      const newBuffer = Buffer.concat([Buffer.from([0x00]), Buffer.from(uuid), Buffer.from(num)]);
      ws.send(newBuffer);
  
      if (jobAmount < MAX_JOBS) {
        log(`Got WS request for job ${job.msg} with id ${uuid}`, job.num);
        acceptJob(uuid, ws);
      } else {
        log(`Got WS request for job ${job.msg} with id ${uuid}, queued in position ${queue.indexOf(uuid)}`, job.num);
      }
    } else {
      log("Could not parse WS message");
    }
  });

  ws.on("close", () => {
    log(`WS client ${request.socket.remoteAddress}:${request.socket.remotePort} has disconnected`);
  });
});

wss.on("error", (err) => {
  console.error("A WS error occurred: ", err);
});

const httpServer = http.createServer();

httpServer.on("request", async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    res.statusCode = 405;
    return res.end("405 Method Not Allowed");
  }
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  if (reqUrl.pathname === "/status" && req.method === "GET") {
    log(`Sending server status to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    return res.end(Buffer.from((MAX_JOBS - jobAmount).toString()));
  } else if (reqUrl.pathname === "/running" && req.method === "GET") {
    log(`Sending currently running jobs to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    const keys = jobs.keys();
    const newObject = { queued: queue.length, runningJobs: jobAmount, max: MAX_JOBS };
    for (const key of keys) {
      const validKeys = Object.keys(jobs.get(key)).filter((value) => value !== "addr" && value !== "port" && value !== "data" && value !== "ext");
      newObject[key] = {};
      for (const validKey of validKeys) {
        if (validKey === "msg") {
          newObject[key][validKey] = JSON.parse(jobs.get(key)[validKey]);
        } else {
          newObject[key][validKey] = jobs.get(key)[validKey];
        }
      }
    }
    return res.end(JSON.stringify(newObject));
  } else if (reqUrl.pathname === "/image" && req.method === "GET") {
    if (!reqUrl.searchParams.has("id")) {
      res.statusCode = 400;
      return res.end("400 Bad Request");
    }
    const id = reqUrl.searchParams.get("id");
    if (!jobs.has(id)) {
      res.statusCode = 410;
      return res.end("410 Gone");
    }
    log(`Sending image data for job ${id} to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    res.setHeader("ext", jobs.get(id).ext);
    const data = jobs.get(id).data;
    jobs.delete(id);
    return res.end(data, (err) => {
      if (err) console.error(err);
    });
  } else {
    res.statusCode = 404;
    return res.end("404 Not Found");
  }
});

httpServer.on("upgrade", (req, sock, head) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (reqUrl.pathname === "/sock") {
    wss.handleUpgrade(req, sock, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    sock.destroy();
  }
});

httpServer.on("error", (e) => {
  console.error("An HTTP error occurred: ", e);
});

httpServer.listen(8080, () => {
  log("HTTP listening on port 8080");
});

const runJob = (job, sock) => {
  return new Promise((resolve, reject) => {
    log(`Job ${job.uuid} starting...`, job.num);

    const object = JSON.parse(job.msg);
    // If the image has a path, it must also have a type
    if (object.path && !object.type) {
      reject(new TypeError("Unknown image type"));
    }

    const worker = new Worker(path.join(__dirname, "../utils/image-runner.js"), {
      workerData: object
    });
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Job timed out"));
    }, 900000);
    log(`Job ${job.uuid} started`, job.num);
    worker.once("message", (data) => {
      clearTimeout(timeout);
      log(`Sending result of job ${job.uuid} back to the bot`, job.num);
      const jobObject = jobs.get(job.uuid);
      jobObject.data = data.buffer;
      jobObject.ext = data.fileExtension;
      jobs.set(job.uuid, jobObject);
      sock.send(Buffer.concat([Buffer.from([0x1]), Buffer.from(job.uuid)]), () => {
        return resolve();
      });
    });
    worker.once("error", (e) => {
      clearTimeout(timeout);
      reject(e);
    });
    /*run(object).then((data) => {
      log(`Sending result of job ${job.uuid} back to the bot`, job.num);
      const jobObject = jobs.get(job.uuid);
      jobObject.data = data.buffer;
      jobObject.ext = data.fileExtension;
      jobs.set(job.uuid, jobObject);
      sock.write(Buffer.concat([Buffer.from([0x1]), Buffer.from(job.uuid)]), (e) => {
        if (e) return reject(e);
        return resolve();
      });
    }).catch(e => {
      reject(e);
    });*/
  });
};