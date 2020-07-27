const fs = require("fs");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/esmBot");

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

TweetCollection.findOne({}, (err, res) => {
  if (err) throw err;
  fs.writeFileSync("tweets.json", JSON.stringify(res));
  console.log("Migrated!");
  mongoose.connection.close();
});