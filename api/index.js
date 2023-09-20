import "dotenv/config";
import { cpus } from "os";
import { Worker } from "worker_threads";
import { join } from "path";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";
import EventEmitter from "events";
import logger from "../utils/logger.js";

const nodeRequire = createRequire(import.meta.url);
const img = nodeRequire(`../build/${process.env.DEBUG && process.env.DEBUG === "true" ? "Debug" : "Release"}/image.node`);
img.imageInit();

const Rerror = 0x01;
const Tqueue = 0x02;
const Rqueue = 0x03;
const Tcancel = 0x04;
const Rcancel = 0x05;
const Twait = 0x06;
const Rwait = 0x07;
const Rinit = 0x08;

const start = process.hrtime();
const log = (msg, jobNum) => {
  logger.log("main", `${jobNum != null ? `[Job ${jobNum}] ` : ""}${msg}`);
};
const error = (msg, jobNum) => {
  logger.error(`${jobNum != null ? `[Job ${jobNum}] ` : ""}${msg}`);
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
// Should look like ID : { msg: "request", num: <job number> }
const queue = [];
// Array of IDs

const MAX_JOBS = process.env.JOBS ? parseInt(process.env.JOBS) : cpus().length * 4; // Completely arbitrary, should usually be some multiple of your amount of cores
const PASS = process.env.PASS ? process.env.PASS : undefined;
let jobAmount = 0;

const acceptJob = (id, sock) => {
  jobAmount++;
  queue.shift();
  const job = jobs.get(id);
  return runJob({
    id: id,
    msg: job.msg,
    num: job.num
  }, sock).then(() => {
    log(`Job ${id} has finished`);
  }).catch((err) => {
    error(`Error on job ${id}: ${err}`, job.num);
    const newJob = jobs.get(id);
    if (!newJob.tag) {
      newJob.error = err.message;
      jobs.set(id, newJob);
      return;
    }
    jobs.delete(id);
    sock.send(Buffer.concat([Buffer.from([Rerror]), newJob.tag, Buffer.from(err.message)]));
  }).finally(() => {
    jobAmount--;
    if (queue.length > 0) {
      acceptJob(queue[0], sock);
    }
  });
};

const waitForVerify = (event) => {
  return new Promise((resolve, reject) => {
    event.once("end", (r) => resolve(r));
    event.once("error", (e) => reject(e));
  });
};

const wss = new WebSocketServer({ clientTracking: true, noServer: true });

wss.on("connection", (ws, request) => {
  logger.log("info", `WS client ${request.socket.remoteAddress}:${request.socket.remotePort} has connected`);
  const num = Buffer.alloc(2);
  num.writeUInt16LE(MAX_JOBS);
  const cur = Buffer.alloc(2);
  cur.writeUInt16LE(jobAmount);
  const formats = {};
  for (const cmd of img.funcs) {
    formats[cmd] = ["image/png", "image/gif", "image/jpeg", "image/webp"];
  }
  const init = Buffer.concat([Buffer.from([Rinit]), Buffer.from([0x00, 0x00]), num, cur, Buffer.from(JSON.stringify(formats))]);
  ws.send(init);

  ws.on("error", (err) => {
    error(err);
  });

  ws.on("message", (msg) => {
    const opcode = msg.readUint8(0);
    const tag = msg.slice(1, 3);
    const req = msg.toString().slice(3);
    if (opcode === Tqueue) {
      const id = msg.readBigInt64LE(3);
      const obj = msg.slice(11);
      const job = { msg: obj, num: jobAmount, verifyEvent: new EventEmitter() };
      jobs.set(id, job);
      queue.push(id);

      const newBuffer = Buffer.concat([Buffer.from([Rqueue]), tag]);
      ws.send(newBuffer);
  
      if (jobAmount < MAX_JOBS) {
        log(`Got WS request for job ${job.msg} with id ${id}`, job.num);
        acceptJob(id, ws);
      } else {
        log(`Got WS request for job ${job.msg} with id ${id}, queued in position ${queue.indexOf(id)}`, job.num);
      }
    } else if (opcode === Tcancel) {
      delete queue[queue.indexOf(req) - 1];
      jobs.delete(req);
      const cancelResponse = Buffer.concat([Buffer.from([Rcancel]), tag]);
      ws.send(cancelResponse);
    } else if (opcode === Twait) {
      const id = msg.readBigUInt64LE(3);
      const job = jobs.get(id);
      if (!job) {
        const errorResponse = Buffer.concat([Buffer.from([Rerror]), tag, Buffer.from("Invalid job ID")]);
        ws.send(errorResponse);
        return;
      }
      if (job.error) {
        job.verifyEvent.emit("error", job.error);
        jobs.delete(id);
        const errorResponse = Buffer.concat([Buffer.from([Rerror]), tag, Buffer.from(job.error)]);
        ws.send(errorResponse);
        return;
      }
      job.verifyEvent.emit("end", tag);
      job.tag = tag;
      jobs.set(id, job);
      //const waitResponse = Buffer.concat([Buffer.from([Rwait]), tag]);
      //ws.send(waitResponse);
    } else {
      logger.warn("Could not parse WS message");
    }
  });

  ws.on("close", () => {
    logger.log("info", `WS client ${request.socket.remoteAddress}:${request.socket.remotePort} has disconnected`);
  });
});

wss.on("error", (err) => {
  logger.error("A WS error occurred: ", err);
});

const httpServer = createServer();

httpServer.on("request", async (req, res) => {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("405 Method Not Allowed");
  }
  if (PASS && req.headers.authentication !== PASS) {
    res.statusCode = 401;
    return res.end("401 Unauthorized");
  }
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  if (reqUrl.pathname === "/image" && req.method === "GET") {
    if (!reqUrl.searchParams.has("id")) {
      res.statusCode = 400;
      return res.end("400 Bad Request");
    }
    const id = BigInt(reqUrl.searchParams.get("id"));
    if (!jobs.has(id)) {
      res.statusCode = 410;
      return res.end("410 Gone");
    }
    log(`Sending image data for job ${id} to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    const ext = jobs.get(id).ext;
    let contentType;
    switch (ext) {
      case "gif":
        contentType = "image/gif";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "jpeg":
      case "jpg":
        contentType = "image/jpeg";
        break;
      case "webp":
        contentType = "image/webp";
        break;
    }
    if (contentType) res.setHeader("Content-Type", contentType);
    else res.setHeader("Content-Type", ext);
    const data = jobs.get(id).data;
    jobs.delete(id);
    return res.end(data, (err) => {
      if (err) error(err);
    });
  } else if (reqUrl.pathname === "/count" && req.method === "GET") {
    log(`Sending job count to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    return res.end(jobAmount.toString(), (err) => {
      if (err) error(err);
    });
  } else {
    res.statusCode = 404;
    return res.end("404 Not Found");
  }
});

httpServer.on("upgrade", (req, sock, head) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (PASS && req.headers.authentication !== PASS) {
    sock.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    sock.destroy();
    return;
  }

  if (reqUrl.pathname === "/sock") {
    wss.handleUpgrade(req, sock, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    sock.destroy();
  }
});

httpServer.on("error", (e) => {
  error("An HTTP error occurred: ", e);
});
const port = parseInt(process.env.PORT) || 3762;
httpServer.listen(port, () => {
  logger.info(`HTTP and WS listening on port ${port}`);
});

const runJob = (job, ws) => {
  return new Promise((resolve, reject) => {
    log(`Job ${job.id} starting...`, job.num);

    const object = JSON.parse(job.msg);
    // If the image has a path, it must also have a type
    if (object.path && !object.params.type) {
      reject(new TypeError("Unknown image type"));
    }

    const worker = new Worker(join(dirname(fileURLToPath(import.meta.url)), "../utils/image-runner.js"), {
      workerData: object
    });
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Job timed out"));
    }, 900000);
    log(`Job ${job.id} started`, job.num);
    worker.once("message", (data) => {
      clearTimeout(timeout);
      log(`Sending result of job ${job.id} back to the bot`, job.num);
      const jobObject = jobs.get(job.id);
      jobObject.data = data.buffer;
      jobObject.ext = data.fileExtension;
      let verifyPromise;
      if (!jobObject.tag) {
        verifyPromise = waitForVerify(jobObject.verifyEvent);
      } else {
        verifyPromise = Promise.resolve(jobObject.tag);
      }
      verifyPromise.then(tag => {
        jobs.set(job.id, jobObject);
        const waitResponse = Buffer.concat([Buffer.from([Rwait]), tag]);
        ws.send(waitResponse);
        resolve();
      });
    });
    worker.once("error", (e) => {
      clearTimeout(timeout);
      reject(e);
    });
  });
};
