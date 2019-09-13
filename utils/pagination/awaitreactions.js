// eris doesn't come with an awaitReactions method by default, so we make our own
const EventEmitter = require("events").EventEmitter;
class ReactionCollector extends EventEmitter {
  constructor(message, filter, options = {}) {
    super();
    this.filter = filter;
    this.message = message;
    this.options = options;
    this.ended = false;
    this.collected = [];
    this.bot = message.channel.guild ? message.channel.guild.shard.client : message.channel._client;
    this.listener = (message, emoji, userID) => this.verify(message, emoji, userID);
    this.bot.on("messageReactionAdd", this.listener);
    if (options.time) setTimeout(() => this.stop("time"), options.time);
  }

  verify(message, emoji, userID) {
    if (this.message.id !== message.id) return false;
    if (this.filter(message, emoji, userID)) {
      this.collected.push({ message: message, emoji: emoji, userID: userID });
      this.emit("reaction", message, emoji, userID);
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
