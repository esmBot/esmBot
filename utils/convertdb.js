require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DB
});
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO, { poolSize: 10, bufferMaxEntries: 0, useNewUrlParser: true, useUnifiedTopology: true });
const guildSchema = new mongoose.Schema({
  id: String,
  tags: Map,
  prefix: String,
  disabled: [String],
  tagsDisabled: Boolean
});
const Guild = mongoose.model("Guild", guildSchema);

const globalSchema = new mongoose.Schema({
  cmdCounts: Map
});
const Global = mongoose.model("Global", globalSchema);

(async () => {
  console.log("Migrating guilds...");
  const guilds = await Guild.find();
  try {
    await pool.query("CREATE TABLE guilds ( guild_id VARCHAR(30) NOT NULL, tags json NOT NULL, prefix VARCHAR(15) NOT NULL, warns json NOT NULL, disabled text ARRAY NOT NULL, tags_disabled boolean NOT NULL )");
  } catch {
    console.log("Skipping table creation due to error...");
  }
  for (const guild of guilds) {
    console.log(guild.tagsDisabled);
    if ((await pool.query("SELECT * FROM guilds WHERE guild_id = $1", [guild.id])).rows.length !== 0) {
      await pool.query("UPDATE guilds SET tags = $1, prefix = $2, warns = $3, disabled = $4, tags_disabled = $5 WHERE guild_id = $6", [guild.tags, guild.prefix.substring(0, 15), {}, guild.disabled ? guild.disabled : guild.disabledChannels, guild.tagsDisabled === undefined ? false : guild.tagsDisabled, guild.id]);
    } else {
      await pool.query("INSERT INTO guilds (guild_id, tags, prefix, warns, disabled, tags_disabled) VALUES ($1, $2, $3, $4, $5, $6)", [guild.id, guild.tags, guild.prefix.substring(0, 15), {}, guild.disabled ? guild.disabled : guild.disabledChannels, guild.tagsDisabled === undefined ? false : guild.tagsDisabled]);
    }
    console.log(`Migrated guild with ID ${guild.id}`);
  }
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