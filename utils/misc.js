// random(array) to select a random entry in array
exports.random = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// clean(text) to clean message of any private info or mentions
exports.clean = async (text) => {
  if (text && text.constructor.name == "Promise")
    text = await text;
  if (typeof text !== "string")
    text = require("util").inspect(text, { depth: 1 });

  text = text
    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
    .replace(/@/g, `@${String.fromCharCode(8203)}`)
    .replace(process.env.TOKEN, "<redacted>")
    .replace(process.env.MASHAPE, "<redacted>")
    .replace(process.env.CAT, "<redacted>")
    .replace(process.env.GOOGLE, "<redacted>")
    .replace(process.env.CSE, "<redacted>")
    .replace(process.env.DBL, "<redacted>")
    .replace(process.env.MONGO, "<redacted>")
    .replace(process.env.TWITTER_KEY, "<redacted>")
    .replace(process.env.CONSUMER_SECRET, "<redacted>")
    .replace(process.env.ACCESS_TOKEN, "<redacted>")
    .replace(process.env.ACCESS_SECRET, "<redacted>");

  return text;
};

// get random tweet to post
exports.getTweet = async (tweets, reply = false, isDownload = false) => {
  const randomTweet = this.random(reply ? (isDownload ? tweets.download : tweets.replies) : tweets.tweets);
  if (randomTweet.match("{{message}}")) {
    return randomTweet.replace(/{{message}}/g, await this.getRandomMessage());
  } else {
    return randomTweet.replace(/{{media}}/g, this.random(tweets.media))
      .replace(/{{games}}/g, this.random(tweets.games))
      .replace(/{{phrases}}/g, this.random(tweets.phrases))
      .replace(/{{characters}}/g, this.random(tweets.characters));
  }
};

exports.getRandomMessage = async () => {
  const messages = await require("./client.js").guilds.get("631290275456745502").channels.get("631290275888627713").getMessages(50);
  const randomMessage = this.random(messages);
  if (randomMessage.content.length > 144) return await this.getRandomMessage();
  if (randomMessage.content.match(/<@!?\d+>/g)) return await this.getRandomMessage();
  return randomMessage.content;
};

// regexEscape(string) to escape characters in a string for use in a regex
exports.regexEscape = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

// define defaults for prefixes and tags
exports.defaults = {
  prefix: "&"
};
exports.tagDefaults = {
  help: {
    content: "https://essem.space/esmBot/commands.html?dev=true",
    author: "198198681982205953"
  }
};
