const client = require("../utils/client.js");
const database = require("../utils/database.js");
const collections = require("../utils/collections.js");
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

  // make sure settings/tags exist
  for (const [id] of client.guilds) {
    const guildDB = await database.guilds.findOne({id: id});
    if (!guildDB) {
      logger.log(`Registering guild database entry for guild ${id}...`);
      const newGuild = new database.guilds({
        id: id,
        tags: misc.tagDefaults,
        prefix: process.env.PREFIX,
        warns: {},
        disabledChannels: [],
        tagsDisabled: false
      });
      await newGuild.save();
    } else {
      if (!guildDB.warns) {
        logger.log(`Creating warn object for guild ${id}...`);
        guildDB.set("warns", {});
        await guildDB.save();
      } else if (!guildDB.disabledChannels) {
        logger.log(`Creating disabled channels object for guild ${id}...`);
        guildDB.set("disabledChannels", []);
        await guildDB.save();
      }
    }
  }

  const global = await database.global.findOne({});
  if (!global) {
    const countObject = {};
    for (const command of collections.commands.keys()) {
      countObject[command] = 0;
    }
    const newGlobal = new database.global({
      cmdCounts: countObject
    });
    await newGlobal.save();
  } else {
    const exists = [];
    for (const command of collections.commands.keys()) {
      if (!global.cmdCounts.has(command)) {
        global.cmdCounts.set(command, 0);
      }
      exists.push(command);
    }
    for (const command of global.cmdCounts.keys()) {
      if (!exists.includes(command)) {
        global.cmdCounts.set(command, undefined);
      }
    }
    await global.save();
  }

  // generate docs
  if (helpGenerator && first) await helpGenerator(process.env.OUTPUT);

  // set activity (a.k.a. the gamer code)
  (async function activityChanger() {
    client.editStatus("dnd", {
      name: `${misc.random(messages)} | @esmBot help`,
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
        if (
          tweet.user.screen_name !== "esmBot_" &&
        !blocks.ids.includes(tweet.user.id_str)
        ) {
          let tweetContent;
          if (new RegExp(["@this_vid", "@DownloaderBot", "GetVideoBot", "@thisvid_"].join("|")).test(tweet.text)) {
            tweetContent = await misc.getTweet(twitter.tweets, true, true);
          } else {
            tweetContent = await misc.getTweet(twitter.tweets, true).replace(/{{user}}/gm, `@${tweet.user.screen_name}`);
          }
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
