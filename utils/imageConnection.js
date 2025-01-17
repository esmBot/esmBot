import WebSocket from "ws";
import logger from "./logger.js";
import { setTimeout } from "node:timers/promises";

const Rerror = 0x01;
const Tqueue = 0x02;
//const Rqueue = 0x03;
const Tcancel = 0x04;
//const Rcancel = 0x05;
const Twait = 0x06;
//const Rwait = 0x07;
const Rinit = 0x08;
const Rsent = 0x09;
const Rclose = 0xFF;

class ImageConnection {
  constructor(host, auth, name, tls = false) {
    this.requests = new Map();
    this.host = host.includes(":") ? host : `${host}:3762`;
    this.auth = auth;
    this.name = name;
    this.tag = 0;
    this.disconnected = false;
    this.formats = {};
    this.funcs = [];
    this.wsproto = null;
    if (tls) {
      this.wsproto = "wss";
    } else {
      this.wsproto = "ws";
    }
    this.sockurl = `${this.wsproto}://${this.host}/sock`;
    const headers = {};
    if (auth) {
      headers.Authentication = auth;
    }
    this.conn = new WebSocket(this.sockurl, { headers });
    let httpproto;
    if (tls) {
      httpproto = "https";
    } else {
      httpproto = "http";
    }
    this.httpurl = `${httpproto}://${this.host}`;
    this.conn.on("message", (msg) => this.onMessage(msg));
    this.conn.once("error", (err) => this.onError(err));
    this.conn.once("close", () => this.onClose());
  }

  /**
   * @param {WebSocket.RawData} msg
   */
  async onMessage(msg) {
    const op = msg.readUint8(0);
    logger.debug(`Received message from image server ${this.host} with opcode ${op}`);
    if (op === Rinit) {
      this.formats = JSON.parse(msg.toString("utf8", 7));
      this.funcs = Object.keys(this.formats);
      return;
    }
    if (op === Rclose) {
      this.reconnect = true;
      this.close();
      return;
    }
    const tag = msg.readUint16LE(1);
    const promise = this.requests.get(tag);
    if (!promise) {
      logger.error(`Received response for unknown request ${tag}`);
      return;
    }
    this.requests.delete(tag);
    if (op === Rerror) {
      promise.reject(new Error(msg.slice(3, msg.length).toString()));
      return;
    }
    if (op === Rsent) {
      promise.resolve(true);
    } else {
      promise.resolve();
    }
  }

  onError(e) {
    logger.error(e.toString());
  }

  async onClose() {
    for (const [tag, obj] of this.requests.entries()) {
      obj.reject("Request ended prematurely due to a closed connection");
      this.requests.delete(tag);
    }
    if (!this.disconnected || this.reconnect) {
      logger.warn(`${this.reconnect ? `${this.host} requested a reconnect` : `Lost connection to ${this.host}`}, attempting to reconnect in 5 seconds...`);
      await setTimeout(5000);
      this.conn = new WebSocket(this.sockurl, {
        headers: {
          Authentication: this.auth
        }
      });
      this.conn.on("message", (msg) => this.onMessage(msg));
      this.conn.once("error", (err) => this.onError(err));
      this.conn.once("close", () => this.onClose());
    }
    this.reconnect = false;
    this.disconnected = false;
  }

  close() {
    this.disconnected = true;
    this.conn.close();
  }

  queue(jobid, jobobj) {
    logger.debug(`Queuing ${jobid} on image server ${this.host}`);
    const str = JSON.stringify(jobobj);
    const buf = Buffer.alloc(8);
    buf.writeBigUint64LE(jobid);
    return this.do(Tqueue, jobid, Buffer.concat([buf, Buffer.from(str)]));
  }

  wait(jobid) {
    logger.debug(`Waiting for ${jobid} on image server ${this.host}`);
    const buf = Buffer.alloc(8);
    buf.writeBigUint64LE(jobid);
    return this.do(Twait, jobid, buf);
  }

  cancel(jobid) {
    logger.debug(`Cancelling ${jobid} on image server ${this.host}`);
    const buf = Buffer.alloc(8);
    buf.writeBigUint64LE(jobid);
    return this.do(Tcancel, jobid, buf);
  }

  async getOutput(jobid) {
    logger.debug(`Getting output of ${jobid} on image server ${this.host}`);
    const req = await fetch(`${this.httpurl}/image?id=${jobid}`, {
      headers: {
        authentication: this.auth || undefined
      }
    });
    const contentType = req.headers.get("content-type");
    let type;
    switch (contentType) {
      case "image/gif":
        type = "gif";
        break;
      case "image/png":
        type = "png";
        break;
      case "image/jpeg":
        type = "jpg";
        break;
      case "image/webp":
        type = "webp";
        break;
      case "image/avif":
        type = "avif";
        break;
      default:
        type = contentType ?? "unknown";
        break;
    }
    return { buffer: Buffer.from(await req.arrayBuffer()), type };
  }

  async getCount() {
    const req = await fetch(`${this.httpurl}/count`, {
      headers: {
        authentication: this.auth || undefined
      }
    });
    if (req.status !== 200) return;
    const res = Number.parseInt(await req.text());
    return res;
  }

  async do(op, id, data) {
    const buf = Buffer.alloc(1 + 2);
    let tag = this.tag++;
    if (tag > 65535) tag = this.tag = 0;
    buf.writeUint8(op);
    buf.writeUint16LE(tag, 1);
    this.conn.send(Buffer.concat([buf, data]));
    const promise = new Promise((resolve, reject) => {
      this.requests.set(tag, { resolve, reject, id, op });
    });
    return promise;
  }
}

export default ImageConnection;
