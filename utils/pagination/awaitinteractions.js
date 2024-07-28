// oceanic doesn't come with a method to wait for interactions by default, so we make our own
import { EventEmitter } from "node:events";
import { ComponentInteraction } from "oceanic.js";

class InteractionCollector extends EventEmitter {
  /**
   * @param {import("oceanic.js").Client} client
   * @param {import("oceanic.js").Message} message
   */
  constructor(client, message) {
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
