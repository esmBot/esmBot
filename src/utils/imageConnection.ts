import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers/promises";
import WSocket, { type Data, type ErrorEvent } from "ws";
import logger from "./logger.ts";

const Rerror = 0x01;
const Tqueue = 0x02;
//const Rqueue = 0x03;
const Tcancel = 0x04;
//const Rcancel = 0x05;
const Twait = 0x06;
const Rwait = 0x07;
const Rinit = 0x08;
const Rsent = 0x09;
const Rclose = 0xff;

interface RequestState {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  id: bigint;
  op: number;
}

type WaitResponse = { sent: true; data: Buffer } | { sent: false };

class ImageConnection {
  requests: Map<number, RequestState>;
  host: string;
  auth?: string;
  name?: string;
  tag: number;
  disconnected: boolean;
  formats: { [key: string]: string[] };
  funcs: string[];
  wsproto: string;
  sockurl: string;
  conn: WSocket;
  httpurl: string;
  reconnect?: boolean;
  constructor(host: string, auth?: string, name?: string, tls = false) {
    this.requests = new Map();
    this.host = host.includes(":") ? host : `${host}:3762`;
    this.auth = auth;
    this.name = name;
    this.tag = 0;
    this.disconnected = false;
    this.formats = {};
    this.funcs = [];
    if (tls) {
      this.wsproto = "wss";
    } else {
      this.wsproto = "ws";
    }
    this.sockurl = `${this.wsproto}://${this.host}/sock`;
    const headers: { [key: string]: string } = {};
    if (auth) {
      headers.Authentication = auth;
    }
    this.conn = new WSocket(this.sockurl, { headers });
    this.conn.binaryType = "nodebuffer";
    let httpproto: string;
    if (tls) {
      httpproto = "https";
    } else {
      httpproto = "http";
    }
    this.httpurl = `${httpproto}://${this.host}`;
    this.conn.addEventListener("message", (msg) => this.onMessage(msg.data));
    this.conn.addEventListener("error", (err) => this.onError(err), { once: true });
    this.conn.addEventListener("close", () => this.onClose(), { once: true });
  }

  onMessage(msg: Data) {
    if (!(msg instanceof Buffer)) return;
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
      promise.reject(new Error(msg.subarray(3, msg.length).toString()));
      return;
    }
    if (op === Rsent) {
      promise.resolve({ sent: true, data: msg.subarray(3, msg.length) });
      return;
    }
    if (op === Rwait) {
      promise.resolve({ sent: false });
      return;
    }
    promise.resolve();
  }

  onError(e: Error | ErrorEvent) {
    logger.error(e);
  }

  async onClose() {
    for (const [tag, obj] of this.requests.entries()) {
      obj.reject("Request ended prematurely due to a closed connection");
      this.requests.delete(tag);
    }
    if (!this.disconnected || this.reconnect) {
      logger.warn(
        `${this.reconnect ? `${this.host} requested a reconnect` : `Lost connection to ${this.host}`}, attempting to reconnect in 5 seconds...`,
      );
      await setTimeout(5000);
      this.conn = new WSocket(this.sockurl, {
        headers: {
          Authentication: this.auth,
        },
      });
      this.conn.addEventListener("message", (msg) => this.onMessage(msg.data));
      this.conn.addEventListener("error", (err) => this.onError(err), { once: true });
      this.conn.addEventListener("close", () => this.onClose(), { once: true });
    }
    this.reconnect = false;
    this.disconnected = false;
  }

  close() {
    this.disconnected = true;
    this.conn.close();
  }

  queue(jobid: bigint, jobobj: object): Promise<void> {
    logger.debug(`Queuing ${jobid} on image server ${this.host}`);
    const str = JSON.stringify(jobobj);
    const buf = Buffer.alloc(8);
    buf.writeBigUint64LE(jobid);
    return this.do(Tqueue, jobid, Buffer.concat([buf, Buffer.from(str)]));
  }

  wait(jobid: bigint): Promise<WaitResponse> {
    logger.debug(`Waiting for ${jobid} on image server ${this.host}`);
    const buf = Buffer.alloc(8);
    buf.writeBigUint64LE(jobid);
    return this.do(Twait, jobid, buf);
  }

  cancel(jobid: bigint): Promise<void> {
    logger.debug(`Cancelling ${jobid} on image server ${this.host}`);
    const buf = Buffer.alloc(8);
    buf.writeBigUint64LE(jobid);
    return this.do(Tcancel, jobid, buf);
  }

  async getOutput(jobid: string) {
    logger.debug(`Getting output of ${jobid} on image server ${this.host}`);
    const req = await fetch(
      `${this.httpurl}/image?id=${jobid}`,
      this.auth
        ? {
            headers: {
              authentication: this.auth,
            },
          }
        : undefined,
    );
    const contentType = req.headers.get("content-type");
    let type: string;
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
    const req = await fetch(
      `${this.httpurl}/count`,
      this.auth
        ? {
            headers: {
              authentication: this.auth,
            },
          }
        : undefined,
    );
    if (req.status !== 200) return -1;
    const res = Number.parseInt(await req.text());
    return res;
  }

  do<T>(op: number, id: bigint, data: Buffer): Promise<T> {
    const buf = Buffer.alloc(1 + 2);
    let tag = this.tag++;
    if (tag > 65535) tag = this.tag = 0;
    buf.writeUint8(op);
    buf.writeUint16LE(tag, 1);
    this.conn.send(Buffer.concat([buf, data]));
    const promise = new Promise<T>((resolve, reject) => {
      this.requests.set(tag, { resolve, reject, id, op } as RequestState);
    });
    return promise;
  }
}

export default ImageConnection;
