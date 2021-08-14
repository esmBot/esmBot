// eris doesn't come with a method to wait for interactions by default, so we make our own
const EventEmitter = require("events").EventEmitter;

class InteractionCollector extends EventEmitter {
  constructor(client, message, options = {}) {
    super();
    this.message = message;
    this.options = options;
    this.ended = false;
    this.bot = client;
    this.listener = async (packet) => {
      if (packet.t !== "INTERACTION_CREATE") return;
      await this.verify(packet.d.message, packet.d.data.custom_id, packet.d.id, packet.d.token, packet.d.member ? packet.d.member.id : packet.d.user.id);
    };
    this.bot.on("rawWS", this.listener);
    if (options.time) setTimeout(() => this.stop("time"), options.time);
  }

  async verify(message, interaction, id, token, member) {
    if (this.message.id !== message.id) return false;
    const msg = await this.bot.getMessage(message.channel_id, message.id);
    this.emit("interaction", msg, interaction, id, token, member);
    return true;
  }

  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    this.bot.removeListener("rawWS", this.listener);
    this.emit("end", this.collected, reason);
  }
}

module.exports = InteractionCollector;
