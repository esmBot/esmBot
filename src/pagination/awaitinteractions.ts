// oceanic doesn't come with a method to wait for interactions by default, so we make our own
import { EventEmitter } from "node:events";
import type { Client, Message } from "oceanic.js";

class InteractionCollector extends EventEmitter {
  message: Message;
  ended: boolean;
  bot: Client;
  timeout: number;
  end: ReturnType<typeof setTimeout>;
  constructor(client: Client, message: Message) {
    super();
    this.message = message;
    this.ended = false;
    this.bot = client;
    this.timeout = 120000;
    this.end = setTimeout(() => this.stop(), this.timeout);
  }

  extend() {
    clearTimeout(this.end);
    this.end = setTimeout(() => this.stop(), this.timeout);
  }

  stop() {
    if (this.ended) return;
    this.ended = true;
    this.emit("end");
  }
}

export default InteractionCollector;
