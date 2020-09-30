// database stuff
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO, { poolSize: 10, bufferMaxEntries: 0, reconnectTries: 5000, useNewUrlParser: true, useUnifiedTopology: true });
const guildSchema = new mongoose.Schema({
  id: String,
  tags: Map,
  prefix: String,
  warns: Map,
  disabledChannels: [String],
  tagsDisabled: Boolean
});
const Guild = mongoose.model("Guild", guildSchema);

const tweetSchema = new mongoose.Schema({
  tweets: [String],
  replies: [String],
  media: [String],
  phrases: [String],
  games: [String],
  characters: [String],
  download: [String],
  enabled: Boolean
});
const TweetCollection = mongoose.model("TweetCollection", tweetSchema);

const globalSchema = new mongoose.Schema({
  cmdCounts: Map
});
const Global = mongoose.model("Global", globalSchema);

exports.guilds = Guild;
exports.tweets = TweetCollection;
exports.global = Global;