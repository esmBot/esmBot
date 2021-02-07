// eris doesn't come with an awaitReactions method by default, so we make our own
const EventEmitter = require("events").EventEmitter;
const client = require("../client.js");

class ReactionCollector extends EventEmitter {
  constructor(message, filter, options = {}) {
    super();
    this.filter = filter;
    this.message = message;
    this.options = options;
    this.ended = false;
    this.collected = [];
    this.bot = client;
    this.listener = async (message, emoji, member) => await this.verify(message, emoji, member);
    this.bot.on("messageReactionAdd", this.listener);
    if (options.time) setTimeout(() => this.stop("time"), options.time);
  }

  async verify(message, emoji, member) {
    if (this.message.id !== message.id) return false;
    if (this.filter(message, emoji, member)) {
      this.collected.push({ message: message, emoji: emoji, member: member });
      this.emit("reaction", await client.getMessage(message.channel.id, message.id), emoji, member);
      if (this.collected.length >= this.options.maxMatches) this.stop("maxMatches");
      return true;
    }
    return false;
  }

  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    this.bot.removeListener("messageReactionAdd", this.listener);
    this.emit("end", this.collected, reason);
  }
}

module.exports = ReactionCollector;
