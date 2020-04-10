// database stuff
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO);
const guildSchema = new mongoose.Schema({
  id: String,
  tags: Map,
  prefix: String,
  warns: Map,
  disabledChannels: [String]
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

exports.guilds = Guild;
exports.tweets = TweetCollection;