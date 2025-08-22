import "dotenv/config";
import { Buffer } from "node:buffer";
import EventEmitter from "node:events";
import { createServer } from "node:http";
import process from "node:process";
import { DiscordHTTPError, DiscordRESTError, type RawMessage } from "oceanic.js";
import type WSocket from "ws";
import { WebSocketServer, type ErrorEvent } from "ws";
import run from "#utils/image-runner.js";
import { img } from "#utils/imageLib.js";
import logger from "#utils/logger.js";
import type { ImageParams } from "#utils/types.js";

const formats = Object.keys(img.imageInit());

const Rerror = 0x01;
const Tqueue = 0x02;
const Rqueue = 0x03;
const Tcancel = 0x04;
const Rcancel = 0x05;
const Twait = 0x06;
const Rwait = 0x07;
const Rinit = 0x08;
const Rsent = 0x09;
const Rclose = 0xff;

const log = (msg: string, jobNum?: number) => {
  logger.log("main", `${jobNum != null ? `[Job ${jobNum}] ` : ""}${msg}`);
};
const error = (msg: string | Error | ErrorEvent, jobNum?: number) => {
  logger.error(`${jobNum != null ? `[Job ${jobNum}] ` : ""}${msg}`);
};

interface VerifyEvents {
  error: [err: string];
  end: [tag: Buffer];
}

interface Job {
  num: number;
  msg: ImageParams;
  verifyEvent: EventEmitter<VerifyEvents>;
  tag?: Buffer;
  error?: string;
  data?: Buffer;
  ext?: string;
}

interface MiniJob {
  id: bigint;
  msg: ImageParams;
  num: number;
}

class JobCache<K, V extends Job> extends Map {
  set(key: K, value: V) {
    super.set(key, value);
    setTimeout(() => {
      if (super.has(key) && this.get(key) === value && value.data) super.delete(key);
    }, 900000); // delete jobs if not requested after 15 minutes
    return this;
  }

  _delListener(_size: number) {}

  delete(key: K) {
    const out = super.delete(key);
    this._delListener(this.size);
    return out;
  }

  delListen(func: (size: number) => void) {
    this._delListener = func;
  }

  get(key: K): V {
    return super.get(key);
  }
}

const jobs = new JobCache<bigint, Job>();
// Should look like ID : { msg: "request", num: <job number> }

const PASS = process.env.PASS ? process.env.PASS : undefined;

// Used for direct image uploads
const clientID = process.env.CLIENT_ID;
const discordBaseURL =
  process.env.REST_PROXY && process.env.REST_PROXY !== "" ? process.env.REST_PROXY : "https://discord.com/api/v10";

/**
 * Accept an image job.
 */
async function acceptJob(id: bigint, sock: WSocket): Promise<void> {
  const job = jobs.get(id);
  try {
    await runJob(
      {
        id: id,
        msg: job.msg,
        num: job.num,
      },
      sock,
    );
    log(`Job ${id} has finished`);
  } catch (err) {
    if (!(err instanceof Error)) return;
    error(`Error on job ${id}: ${err}`, job.num);
    const newJob = jobs.get(id);
    if (!newJob.tag) {
      newJob.error = err.message;
      jobs.set(id, newJob);
      return;
    }
    jobs.delete(id);
    sock.send(Buffer.concat([Buffer.from([Rerror]), newJob.tag, Buffer.from(err.message)]));
  }

  // Because malloc_trim can sometimes take longer than expected,
  // we wait until all* jobs are finished before trimming to avoid potential issues.
  // See the comment in natives/node/image.cc for more info
  if (jobs.size <= 1) {
    img.trim();
  }
}

function waitForVerify(event: EventEmitter<VerifyEvents>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    event.once("end", (r) => resolve(r));
    event.once("error", (e) => reject(e));
  });
}

const wss = new WebSocketServer({ clientTracking: true, noServer: true });

wss.on("connection", (ws, request) => {
  logger.log("info", `WS client ${request.socket.remoteAddress}:${request.socket.remotePort} has connected`);
  ws.binaryType = "nodebuffer";
  const cur = Buffer.alloc(2);
  cur.writeUInt16LE(jobs.size);
  const cmdFormats: { [cmd: string]: string[] } = {};
  for (const cmd of img.funcs) {
    cmdFormats[cmd] = formats;
  }
  const init = Buffer.concat([
    Buffer.from([Rinit]),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    cur,
    Buffer.from(JSON.stringify(cmdFormats)),
  ]);
  ws.send(init);

  ws.addEventListener("error", (err) => {
    error(err);
  });

  ws.addEventListener("message", ({ data: msg }) => {
    if (!(msg instanceof Buffer)) return;
    const opcode = msg.readUint8(0);
    const tag = msg.subarray(1, 3);
    const req = msg.toString().slice(3);
    if (opcode === Tqueue) {
      const id = msg.readBigInt64LE(3);
      const obj = msg.subarray(11).toString();
      const job = { msg: JSON.parse(obj), num: jobs.size, verifyEvent: new EventEmitter<VerifyEvents>() };
      jobs.set(id, job);

      const newBuffer = Buffer.concat([Buffer.from([Rqueue]), tag]);
      ws.send(newBuffer);

      log(`Got WS request for job ${obj} with id ${id}`, job.num);
      acceptJob(id, ws);
    } else if (opcode === Tcancel) {
      jobs.delete(BigInt(req));
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
    } else {
      logger.warn("Could not parse WS message");
    }
  });

  ws.addEventListener("close", () => {
    logger.log("info", `WS client ${request.socket.remoteAddress}:${request.socket.remotePort} has disconnected`);
  });
});

wss.on("error", (err) => {
  logger.error("A WS error occurred: ", err);
});

const httpServer = createServer();

httpServer.on("request", (req, res) => {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("405 Method Not Allowed");
  }
  if (PASS && req.headers.authentication !== PASS) {
    res.statusCode = 401;
    return res.end("401 Unauthorized");
  }
  if (!req.url) {
    res.statusCode = 400;
    return res.end("400 Bad Request");
  }
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  if (reqUrl.pathname === "/image" && req.method === "GET") {
    const param = reqUrl.searchParams.get("id");
    if (!param) {
      res.statusCode = 400;
      return res.end("400 Bad Request");
    }
    const id = BigInt(param);
    if (!jobs.has(id)) {
      res.statusCode = 404;
      return res.end("404 Not Found");
    }
    log(`Sending image data for job ${id} to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    const ext = jobs.get(id).ext;
    let contentType: string | undefined;
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
      case "avif":
        contentType = "image/avif";
        break;
    }
    if (contentType) res.setHeader("Content-Type", contentType);
    else res.setHeader("Content-Type", ext ?? "application/octet-stream");
    const data = jobs.get(id).data;
    jobs.delete(id);
    return res.end(data);
  }
  if (reqUrl.pathname === "/count" && req.method === "GET") {
    log(`Sending job count to ${req.socket.remoteAddress}:${req.socket.remotePort} via HTTP`);
    return res.end(jobs.size.toString());
  }
  res.statusCode = 404;
  return res.end("404 Not Found");
});

httpServer.on("upgrade", (req, sock, head) => {
  if (!req.url) {
    sock.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    sock.destroy();
    return;
  }
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
  error("An HTTP error occurred: " + e);
});
const port = process.env.PORT && process.env.PORT !== "" ? Number.parseInt(process.env.PORT) : 3762;
httpServer.listen(port, () => {
  logger.info(`HTTP and WS listening on port ${port}`);
});

function stopHTTPServer() {
  httpServer.close((e) => {
    if (e) {
      error(e);
      process.exit(1);
    }
    logger.info("Stopped HTTP server");
    process.exit();
  });
}

let stopping = false;
process.on("SIGINT", () => {
  if (stopping) {
    logger.info("Another SIGINT detected, forcing shutdown...");
    process.exit();
  }
  stopping = true;
  logger.info("SIGINT detected, finishing jobs and shutting down...");
  httpServer.removeAllListeners("upgrade");
  const closeResponse = Buffer.concat([Buffer.from([Rclose])]);
  for (const client of wss.clients) {
    client.send(closeResponse);
  }
  wss.close((e) => {
    if (e) {
      error(e);
      process.exit(1);
    }
    logger.info("Stopped WS server");
    if (jobs.size > 0) {
      jobs.delListen((size) => {
        if (size > 0) return;
        logger.info("All jobs finished");
        stopHTTPServer();
      });
    } else {
      stopHTTPServer();
    }
  });
});

const allowedExtensions = ["gif", "png", "jpeg", "jpg", "webp", "avif"];
const fileSize = 10485760;

async function finishJob(
  data: { buffer: Buffer; fileExtension: string },
  job: MiniJob,
  object: ImageParams,
  ws: WSocket,
) {
  log(`Sending result of job ${job.id}`, job.num);
  const jobObject = jobs.get(job.id);
  jobObject.data = data.buffer;
  jobObject.ext = data.fileExtension;
  let tag: Buffer;
  if (!jobObject.tag) {
    tag = await waitForVerify(jobObject.verifyEvent);
  } else {
    tag = jobObject.tag;
  }

  if (!jobObject.ext || !jobObject.data) {
    throw Error("Job result not found despite finish signal");
  }

  jobs.set(job.id, jobObject);
  let r: RawMessage | undefined;
  if (clientID && object.token && allowedExtensions.includes(jobObject.ext) && jobObject.data.length < fileSize) {
    const form = new FormData();
    form.set(
      "files[0]",
      new Blob([jobObject.data]),
      `${object.spoiler ? "SPOILER_" : ""}${object.cmd}.${jobObject.ext}`,
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);
    try {
      const res = await fetch(`${discordBaseURL}/webhooks/${clientID}/${object.token}`, {
        method: "POST",
        signal: controller.signal,
        body: form,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        let resObj: string | object;
        try {
          resObj = (await res.json()) as Record<string, unknown>;
        } catch {
          try {
            resObj = await res.text();
          } catch {
            throw new Error(`Request failed with response ${res.status}`);
          }
        }
        throw new (typeof resObj === "string" ? DiscordHTTPError : DiscordRESTError)(res, resObj, "POST");
      }
      r = (await res.json()) as RawMessage;
    } catch (e) {
      error(`Error while sending job ${job.id}, will attempt to send back to the bot: ${e}`, job.num);
    }
  }

  let response: Buffer;
  if (r) {
    jobs.delete(job.id);
    const attachment = r.attachments[0];
    response = Buffer.concat([Buffer.from([Rsent]), tag, Buffer.from(JSON.stringify(attachment ?? {}))]);
  } else {
    response = Buffer.concat([Buffer.from([Rwait]), tag]);
  }
  ws.send(response);
}

/**
 * Run an image job.
 */
async function runJob(job: MiniJob, ws: WSocket): Promise<void> {
  log(`Job ${job.id} starting...`, job.num);

  const object = job.msg;
  // If the image has a path, it must also have a type
  if (object.path && !object.input?.type) {
    throw new TypeError("Unknown image type");
  }

  log(`Job ${job.id} started`, job.num);
  const data = await run(object);
  await finishJob(data, job, object, ws);
}
