const Twitter = require("node-tweet");
const database = require("../utils/database.js");
const client = new Twitter({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET
});
exports.client = client;
exports.active = false;
database.tweets.find({ enabled: true }, (error, docs) => {
  if (error) throw error;
  exports.tweets = docs[0];
});