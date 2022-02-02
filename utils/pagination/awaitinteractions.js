// eris doesn't come with a method to wait for interactions by default, so we make our own
import { EventEmitter } from "events";

class InteractionCollector extends EventEmitter {
  constructor(client, message, type, timeout = 120000) {
    super();
    this.message = message;
    this.type = type;
    this.ended = false;
    this.bot = client;
    this.listener = async (interaction) => {
      await this.verify(interaction);
    };
    this.bot.on("interactionCreate", this.listener);
    setTimeout(() => this.stop("time"), timeout);
  }

  async verify(interaction) {
    if (!(interaction instanceof this.type)) return false;
    if (this.message.id !== interaction.message.id) return false;
    this.emit("interaction", interaction);
    return true;
  }

  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    this.bot.removeListener("interactionCreate", this.listener);
    this.emit("end", this.collected, reason);
  }
}

export default InteractionCollector;
