const util = require("util");
const client = require("./client.js");

// random(array) to select a random entry in array
exports.random = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const optionalReplace = (token) => {
  return token === "" ? "" : "<redacted>";
};

// clean(text) to clean message of any private info or mentions
exports.clean = async (text) => {
  if (text && text.constructor.name == "Promise")
    text = await text;
  if (typeof text !== "string")
    text = util.inspect(text, { depth: 1 });

  text = text
    .replaceAll("`", `\`${String.fromCharCode(8203)}`)
    .replaceAll("@", `@${String.fromCharCode(8203)}`)
    .replaceAll(process.env.TOKEN, optionalReplace(process.env.TOKEN))
    .replaceAll(process.env.MASHAPE, optionalReplace(process.env.MASHAPE))
    .replaceAll(process.env.CAT, optionalReplace(process.env.CAT))
    .replaceAll(process.env.GOOGLE, optionalReplace(process.env.GOOGLE))
    .replaceAll(process.env.DBL, optionalReplace(process.env.DBL))
    .replaceAll(process.env.MONGO, optionalReplace(process.env.MONGO))
    .replaceAll(process.env.TWITTER_KEY, optionalReplace(process.env.TWITTER_KEY))
    .replaceAll(process.env.CONSUMER_SECRET, optionalReplace(process.env.CONSUMER_SECRET))
    .replaceAll(process.env.ACCESS_TOKEN, optionalReplace(process.env.ACCESS_TOKEN))
    .replaceAll(process.env.ACCESS_SECRET, optionalReplace(process.env.ACCESS_SECRET));

  return text;
};

// get random tweet to post
exports.getTweet = async (tweets, reply = false, isDownload = false) => {
  const randomTweet = this.random(reply ? (isDownload ? tweets.download : tweets.replies) : tweets.tweets);
  if (randomTweet.match("{{message}}")) {
    return randomTweet.replaceAll("{{message}}", await this.getRandomMessage());
  } else {
    return randomTweet
      .replaceAll("{{media}}", () => {
        return this.random(tweets.media);
      })
      .replaceAll("{{games}}", () => {
        return this.random(tweets.games);
      })
      .replaceAll("{{phrases}}", () => {
        return this.random(tweets.phrases);
      })
      .replaceAll("{{characters}}", () => {
        return this.random(tweets.characters);
      });
  }
};

exports.getRandomMessage = async () => {
  const messages = await client.guilds.get("631290275456745502").channels.get("631290275888627713").getMessages(50);
  const randomMessage = this.random(messages);
  if (randomMessage.content.length > 144) return await this.getRandomMessage();
  if (randomMessage.content.match(/<@!?\d+>/g)) return await this.getRandomMessage();
  return randomMessage.content;
};

// regexEscape(string) to escape characters in a string for use in a regex
exports.regexEscape = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

// decodeEntities(string)
exports.decodeEntities = (string) => {
  var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  var translate = {
    "nbsp": " ",
    "amp": "&",
    "quot": "\"",
    "lt": "<",
    "gt": ">"
  };
  return string.replace(translate_re, function(match, entity) {
    return translate[entity];
  }).replace(/&#(\d+);/gi, function(match, numStr) {
    var num = parseInt(numStr, 10);
    return String.fromCharCode(num);
  });
};

// define defaults for prefixes and tags
exports.defaults = {
  prefix: process.env.PREFIX
};
exports.tagDefaults = {
  help: {
    content: "https://projectlounge.pw/esmBot/help.html",
    author: "198198681982205953"
  }
};
