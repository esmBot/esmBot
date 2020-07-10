const Twitter = require("node-tweet");
const client = new Twitter({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_SECRET
});
exports.client = client;
exports.active = false;
exports.tweets = require("../tweets.json");