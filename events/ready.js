const client = require("../utils/client.js");
const database = require("../utils/database.js");
const logger = require("../utils/logger.js");
const messages = require("../messages.json");
const misc = require("../utils/misc.js");
const twitter = process.env.TWITTER === "true" ? require("../utils/twitter.js") : null;

// run when ready
module.exports = async () => {
  // make sure settings/tags exist
  for (const [id, guild] of client.guilds) {
    const guildDB = (await database.guilds.find({ id: id }).exec())[0];
    const xpDB = (await database.xp.find({ id: id }).exec())[0];
    // .length === 0 && guildDB.constructor === Object
    // !Object.entries(guildDB)
    if (!guildDB) {
      console.log(`Registering guild database entry for guild ${id}...`);
      const newGuild = new database.guilds({
        id: id,
        tags: misc.tagDefaults,
        prefix: "&"
      });
      await newGuild.save();
    }
    // .length === 0 && xpDB.constructor === Object
    // !Object.entries(xpDB)
    if (!xpDB) {
      console.log(`Registering xp database entry for guild ${id}...`);
      const memberInfo = {};
      for (const [id] of guild.members) {
        memberInfo[id] = {
          xpAmount: 0,
          level: 0
        };
      }
      const newXP = new database.xp({
        id: id,
        members: memberInfo,
        enabled: false
      });
      await newXP.save();
    }
  }

  // set activity (a.k.a. the gamer code)
  (async function activityChanger() {
    client.editStatus("dnd", { name: `${misc.random(messages)} | @esmBot help` });
    setTimeout(activityChanger, 900000);
  })();

  // tweet stuff
  if (twitter !== null) {
    const tweet = async () => {
      const tweets = (await database.tweets.find({ enabled: true }).exec())[0];
      const tweetContent = await misc.getTweet(tweets);
      const info = await twitter.client.post("statuses/update", { status: tweetContent });
      logger.log(`Tweet with id ${info.data.id_str} has been tweeted with status code ${info.resp.statusCode} ${info.resp.statusMessage}`);
    };
    tweet();
    setInterval(tweet, 1800000);
    const stream = twitter.client.stream("statuses/filter", {
      track: `@${process.env.HANDLE}`
    });
    stream.on("tweet", async (tweet) => {
      if (tweet.user.screen_name !== "esmBot_") {
        const tweets = (await database.tweets.find({ enabled: true }).exec())[0];
        const tweetContent = await misc.getTweet(tweets, true);
        const payload = {
          status: `@${tweet.user.screen_name} ${tweetContent}`,
          in_reply_to_status_id: tweet.id_str
        };
        const info = await twitter.client.post("statuses/update", payload);
        logger.log(`Reply with id ${info.data.id_str} has been tweeted with status code ${info.resp.statusCode} ${info.resp.statusMessage}`);
      }
    });
  }

  logger.log("info", `Successfully started ${client.user.username}#${client.user.discriminator} with ${client.users.size} users in ${client.guilds.size} servers.`);
};
