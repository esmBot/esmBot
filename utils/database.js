// database stuff
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO);
const guildSchema = new mongoose.Schema({
  id: String,
  tags: Map,
  prefix: String
});
const Guild = mongoose.model("Guild", guildSchema);

const xpSchema = new mongoose.Schema({
  id: String,
  members: Map,
  enabled: Boolean
});
const XP = mongoose.model("XP", xpSchema);

const tweetSchema = new mongoose.Schema({
  tweets: [String],
  replies: [String],
  media: [String],
  phrases: [String],
  games: [String],
  characters: [String],
  enabled: Boolean
});
const TweetCollection = mongoose.model("TweetCollection", tweetSchema);

exports.guilds = Guild;
exports.xp = XP;
exports.tweets = TweetCollection;