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
    this.listener = async (message, emoji, userID) => await this.verify(message, emoji, userID);
    this.bot.on("messageReactionAdd", this.listener);
    if (options.time) setTimeout(() => this.stop("time"), options.time);
  }

  async verify(message, emoji, userID) {
    if (this.message.id !== message.id) return false;
    if (this.filter(message, emoji, userID)) {
      this.collected.push({ message: message, emoji: emoji, userID: userID });
      this.emit("reaction", await client.getMessage(message.channel.id, message.id), emoji, userID);
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
