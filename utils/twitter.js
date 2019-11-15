const Twit = require("twit");
const tweets = require("../tweets.json");
const T = new Twit({
  consumer_key: process.env.TWITTER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_SECRET
});
module.exports = {
  client: T,
  tweets: tweets
};