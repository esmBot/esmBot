// oceanic doesn't come with a method to wait for interactions by default, so we make our own
import { EventEmitter } from "node:events";
import { ComponentInteraction } from "oceanic.js";

class InteractionCollector extends EventEmitter {
  /**
   * @param {import("oceanic.js").Client} client
   * @param {import("oceanic.js").Message} message
   * @param {number} [timeout]
   */
  constructor(client, message, timeout = 120000) {
    super();
    this.message = message;
    this.ended = false;
    this.bot = client;
    this.timeout = timeout;
    this.listener = async (interaction) => {
      await this.verify(interaction);
    };
    this.bot.on("interactionCreate", this.listener);
    this.end = setTimeout(() => this.stop(), timeout);
  }

  async verify(interaction) {
    if (!(interaction instanceof ComponentInteraction)) return false;
    if (this.message.id !== interaction.message.id) return false;
    this.emit("interaction", interaction);
    return true;
  }

  extend() {
    clearTimeout(this.end);
    this.end = setTimeout(() => this.stop(), this.timeout);
  }

  stop() {
    if (this.ended) return;
    this.ended = true;
    this.bot.removeListener("interactionCreate", this.listener);
    this.emit("end");
  }
}

export default InteractionCollector;
