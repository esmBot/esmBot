require("dotenv").config();
const { promisify } = require("util");
const { writeFile } = require("fs");
const { Pool } = require("pg");
const pool = new Pool({
  user: "esmbot",
  host: "localhost",
  database: "esmbot",
  port: 5432
});
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO, { poolSize: 10, bufferMaxEntries: 0, reconnectTries: 5000, useNewUrlParser: true, useUnifiedTopology: true });
const guildSchema = new mongoose.Schema({
  id: String,
  tags: Map,
  prefix: String,
  warns: Map,
  disabledChannels: [String]
});
const Guild = mongoose.model("Guild", guildSchema);

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

const globalSchema = new mongoose.Schema({
  cmdCounts: Map
});
const Global = mongoose.model("Global", globalSchema);

(async () => {
  console.log("Migrating guilds...");
  const guilds = await Guild.find();
  try {
    await pool.query("CREATE TABLE guilds ( guild_id VARCHAR(30) NOT NULL, tags json NOT NULL, prefix VARCHAR(15) NOT NULL, warns json NOT NULL, disabled text ARRAY NOT NULL )");
  } catch {
    console.log("Skipping table creation due to error...");
  }
  for (const guild of guilds) {
    if ((await pool.query("SELECT * FROM guilds WHERE guild_id = $1", [guild.id])).rows.length !== 0) {
      await pool.query("UPDATE guilds SET tags = $1, prefix = $2, warns = $3, disabled = $4 WHERE guild_id = $5", [guild.tags, guild.prefix, guild.warns, guild.disabledChannels, guild.id]);
    } else {
      await pool.query("INSERT INTO guilds (guild_id, tags, prefix, warns, disabled) VALUES ($1, $2, $3, $4, $5)", [guild.id, guild.tags, guild.prefix, guild.warns, guild.disabledChannels]);
    }
    console.log(`Migrated guild with ID ${guild.id}`);
  }
  console.log("Migrating Tweets...");
  const tweets = await TweetCollection.find();
  await promisify(writeFile)("../tweets.json", JSON.stringify(tweets, null, 2));
  console.log("Migrating command counts...");
  const global = await Global.findOne();
  try {
    await pool.query("CREATE TABLE counts ( command VARCHAR NOT NULL, count integer NOT NULL )");
  } catch {
    console.log("Skipping table creation due to error...");
  }
  console.log(global);
  for (const [key, value] of global.cmdCounts) {
    if ((await pool.query("SELECT * FROM counts WHERE command = $1", [key])).rows.length !== 0) {
      await pool.query("UPDATE counts SET count = $1 WHERE command = $2", [value, key]);
    } else {
      await pool.query("INSERT INTO counts (command, count) VALUES ($1, $2)", [key, value]);
    }
    console.log(`Migrated counts for command ${key}`);
  }
  console.log("Done!");
  return;
})();