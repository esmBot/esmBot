// eris doesn't come with a method to wait for interactions by default, so we make our own
import { EventEmitter } from "events";

class InteractionCollector extends EventEmitter {
  constructor(client, message, timeout = 120000) {
    super();
    this.message = message;
    //this.time = timeout;
    this.ended = false;
    this.bot = client;
    this.listener = async (packet) => {
      if (packet.t !== "INTERACTION_CREATE") return;
      await this.verify(packet.d.message, packet.d.data.custom_id, packet.d.id, packet.d.token, packet.d.member ? packet.d.member.user.id : packet.d.user.id);
    };
    this.bot.on("rawWS", this.listener);
    setTimeout(() => this.stop("time"), timeout);
  }

  async verify(message, interaction, id, token, member) {
    if (this.message.id !== message.id) return false;
    this.emit("interaction", interaction, id, token, member);
    return true;
  }

  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    this.bot.removeListener("rawWS", this.listener);
    this.emit("end", this.collected, reason);
  }
}

export default InteractionCollector;
