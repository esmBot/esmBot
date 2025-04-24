// oceanic doesn't come with a method to wait for interactions by default, so we make our own
import { TypedEmitter, type Client, type ComponentInteraction, type Message } from "oceanic.js";

interface InteractionCollectorEvents {
  interaction: [interaction: ComponentInteraction];
  end: [deleted?: boolean];
}

class InteractionCollector extends TypedEmitter<InteractionCollectorEvents> {
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
