const client = require("../utils/client.js");
const database = require("../utils/database.js");
const logger = require("../utils/logger.js");
const messages = require("../messages.json");
const misc = require("../utils/misc.js");
const soundPlayer = require("../utils/soundplayer.js");
const helpGenerator =
  process.env.OUTPUT !== "" ? require("../utils/help.js") : null;
const twitter =
  process.env.TWITTER === "true" ? require("../utils/twitter.js") : null;
const first = process.env.PMTWO === "true" ? process.env.NODE_APP_INSTANCE === "0" : true;

// run when ready
module.exports = async () => {
  // connect to lavalink
  if (!soundPlayer.status && !soundPlayer.connected) await soundPlayer.connect();

  await database.setup();

  // generate docs
  if (helpGenerator && first) await helpGenerator(process.env.OUTPUT);

  // set activity (a.k.a. the gamer code)
  (async function activityChanger() {
    client.editStatus("dnd", {
      name: `${misc.random(messages)} | @${client.user.username} help`,
    });
    setTimeout(activityChanger, 900000);
  })();

  // tweet stuff
  if (twitter !== null && twitter.active === false && first) {
    const blocks = await twitter.client.blocks.ids();
    const tweet = async () => {
      const tweetContent = await misc.getTweet(twitter.tweets);
      try {
        const info = await twitter.client.statuses.update(tweetContent);
        logger.log(`Tweet with id ${info.id_str} has been posted.`);
        // with status code ${info.resp.statusCode} ${info.resp.statusMessage}
      } catch (e) {
        const error = JSON.stringify(e);
        if (error.includes("Status is a duplicate.")) {
          logger.log("Duplicate tweet, will retry in 30 minutes");
        } else {
          logger.error(e);
        }
      }
    };
    tweet();
    setInterval(tweet, 1800000);
    twitter.active = true;
    try {
      const stream = twitter.client.statuses.filter(`@${process.env.HANDLE}`);
      stream.on("data", async (tweet) => {
        if (tweet.user.screen_name !== "esmBot_" && !blocks.ids.includes(tweet.user.id_str)) {
          const tweetContent = await misc.getTweet(twitter.tweets, true).replace(/{{user}}/gm, `@${tweet.user.screen_name}`);
          const payload = {
            status: `@${tweet.user.screen_name} ${tweetContent}`,
            in_reply_to_status_id: tweet.id_str,
          };
          const info = await twitter.client.statuses.update(payload);
          logger.log(`Reply with id ${info.id_str} has been posted.`);
        // with status code ${info.resp.statusCode} ${info.resp.statusMessage}
        }
      });
    } catch (e) {
      logger.error(`The Twitter streaming API ran into an error: ${e}`);
    }
  }

  if (process.env.PMTWO === "true") process.send("ready");
  logger.log(`Successfully started ${client.user.username}#${client.user.discriminator} with ${client.users.size} users in ${client.guilds.size} servers.`);
};
