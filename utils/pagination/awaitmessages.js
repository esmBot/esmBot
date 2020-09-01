// eris doesn't come with an awaitMessages method by default, so we make our own
const EventEmitter = require("events").EventEmitter;
const client = require("../client.js");

class MessageCollector extends EventEmitter {
  constructor(channel, filter, options = {}) {
    super();
    this.filter = filter;
    this.channel = channel;
    this.options = options;
    this.ended = false;
    this.collected = [];
    this.bot = client;
    this.listener = message => this.verify(message);
    this.bot.on("messageCreate", this.listener);
    if (options.time) setTimeout(() => this.stop("time"), options.time);
  }

  verify(message) {
    if (this.channel.id !== message.channel.id) return false;
    if (this.filter(message)) {
      this.collected.push(message);
      this.emit("message", message);
      if (this.collected.length >= this.options.maxMatches) this.stop("maxMatches");
      return true;
    }
    return false;
  }

  stop(reason) {
    if (this.ended) return;
    this.ended = true;
    this.bot.removeListener("messageCreate", this.listener);
    this.emit("end", this.collected, reason);
  }
}

module.exports = MessageCollector;
