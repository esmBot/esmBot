const Twit = require("twit");
const database = require("../utils/database.js");
const T = new Twit({
  consumer_key: process.env.TWITTER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_SECRET
});
exports.client = T;
exports.active = false;
database.tweets.find({ enabled: true }, (error, docs) => {
  if (error) throw error;
  exports.tweets = docs[0];
});