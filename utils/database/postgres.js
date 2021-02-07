const collections = require("../collections.js");
const logger = require("../logger.js");
const misc = require("../misc.js");

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DB
});
const connection = pool;

exports.getGuild = async (query) => {
  return (await connection.query("SELECT * FROM guilds WHERE guild_id = $1", [query])).rows[0];
};

exports.setPrefix = async (prefix, guild) => {
  await connection.query("UPDATE guilds SET prefix = $1 WHERE guild_id = $2", [prefix, guild.id]);
  collections.prefixCache.set(guild.id, prefix);
};

exports.setTag = async (name, content, guild) => {
  const guildDB = await this.getGuild(guild.id);
  guildDB.tags[name] = content;
  await connection.query("UPDATE guilds SET tags = $1 WHERE guild_id = $2", [guildDB.tags, guild.id]);
};

exports.removeTag = async (name, guild) => {
  const guildDB = await this.getGuild(guild.id);
  delete guildDB.tags[name];
  await connection.query("UPDATE guilds SET tags = $1 WHERE guild_id = $2", [guildDB.tags, guild.id]);
};

exports.toggleTags = async (guild) => {
  const guildDB = await this.getGuild(guild.id);
  guildDB.tags_disabled = !guildDB.tags_disabled;
  await connection.query("UPDATE guilds SET tags_disabled = $1 WHERE guild_id = $2", [guildDB.tags_disabled, guild.id]);
  return guildDB.tags_disabled;
};

exports.disableChannel = async (channel) => {
  const guildDB = await this.getGuild(channel.guild.id);
  await connection.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [[...guildDB.disabled, channel.id], channel.guild.id]);
  collections.disabledCache.set(channel.guild.id, guildDB.disabled);
};

exports.enableChannel = async (channel) => {
  const guildDB = await this.getGuild(channel.guild.id);
  const newDisabled = guildDB.disabled.filter(item => item !== channel.id);
  await connection.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [newDisabled, channel.guild.id]);
  collections.disabledCache.set(channel.guild.id, guildDB.disabled);
};

exports.getCounts = async () => {
  const counts = await connection.query("SELECT * FROM counts");
  const countArray = [];
  for (const { command, count } of counts.rows) {
    countArray.push([command, count]);
  }
  return countArray;
};

exports.addCount = async (command) => {
  const count = await connection.query("SELECT * FROM counts WHERE command = $1", [command]);
  await connection.query("UPDATE counts SET count = $1 WHERE command = $2", [count.rows[0].count ? count.rows[0].count + 1 : 1, command]);
};

exports.addGuild = async (guild) => {
  await connection.query("INSERT INTO guilds (guild_id, tags, prefix, disabled, tags_disabled) VALUES ($1, $2, $3, $4, $5)", [guild.id, misc.tagDefaults, process.env.PREFIX, [], false]);
  return await this.getGuild(guild.id);
};

exports.fixGuild = async (guild) => {
  const guildDB = await connection.query("SELECT * FROM guilds WHERE guild_id = $1", [guild.id]);
  if (guildDB.rows.length === 0) {
    logger.log(`Registering guild database entry for guild ${guild.id}...`);
    return await this.addGuild(guild);
  }
};

exports.setup = async () => {
  let counts;
  try {
    counts = await connection.query("SELECT * FROM counts");
  } catch {
    counts = { rows: [] };
  }

  if (!counts.rows[0]) {
    for (const command of collections.commands.keys()) {
      await connection.query("INSERT INTO counts (command, count) VALUES ($1, $2)", [command, 0]);
    }
  } else {
    const exists = [];
    for (const command of collections.commands.keys()) {
      const count = await connection.query("SELECT * FROM counts WHERE command = $1", [command]);
      if (!count.rows[0]) {
        await connection.query("INSERT INTO counts (command, count) VALUES ($1, $2)", [command, 0]);
      }
      exists.push(command);
    }
      
    for (const { command } of counts.rows) {
      if (!exists.includes(command)) {
        await connection.query("DELETE FROM counts WHERE command = $1", [command]);
      }
    }
  }
};

exports.stop = async () => {
  await connection.end();
};