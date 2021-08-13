const collections = require("../collections.js");
const logger = require("../logger.js");

const { Pool } = require("pg");
const connection = new Pool({
  connectionString: process.env.DB,
  statement_timeout: 10000
});

exports.getGuild = async (query) => {
  return (await connection.query("SELECT * FROM guilds WHERE guild_id = $1", [query])).rows[0];
};

exports.setPrefix = async (prefix, guild) => {
  await connection.query("UPDATE guilds SET prefix = $1 WHERE guild_id = $2", [prefix, guild.id]);
  collections.prefixCache.set(guild.id, prefix);
};

exports.getTags = async (guild) => {
  const tagArray = (await connection.query("SELECT * FROM tags WHERE guild_id = $1", [guild])).rows;
  const tags = {};
  for (const tag of tagArray) {
    tags[tag.name] = { content: tag.content, author: tag.author };
  }
  return tags;
};

exports.setTag = async (name, content, guild) => {
  await connection.query("INSERT INTO tags (guild_id, name, content, author) VALUES ($1, $2, $3, $4)", [guild.id, name, content.content, content.author]);
};

exports.editTag = async (name, content, guild) => {
  await connection.query("UPDATE tags SET content = $1, author = $2 WHERE guild_id = $3 AND name = $4", [content.content, content.author, guild.id, name]);
};

exports.removeTag = async (name, guild) => {
  await connection.query("DELETE FROM tags WHERE guild_id = $1 AND name = $2", [guild.id, name]);
};

exports.disableCommand = async (guild, command) => {
  const guildDB = await this.getGuild(guild);
  await connection.query("UPDATE guilds SET disabled_commands = $1 WHERE guild_id = $2", [(guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command]).filter((v) => v !== undefined), guild]);
  collections.disabledCmdCache.set(guild, guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command].filter((v) => v !== undefined));
};

exports.enableCommand = async (guild, command) => {
  const guildDB = await this.getGuild(guild);
  const newDisabled = guildDB.disabled_commands ? guildDB.disabled_commands.filter(item => item !== command) : [];
  await connection.query("UPDATE guilds SET disabled_commands = $1 WHERE guild_id = $2", [newDisabled, guild]);
  collections.disabledCmdCache.set(guild, newDisabled);
};

exports.disableChannel = async (channel) => {
  const guildDB = await this.getGuild(channel.guild.id);
  await connection.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [[...guildDB.disabled, channel.id], channel.guild.id]);
  collections.disabledCache.set(channel.guild.id, [...guildDB.disabled, channel.id]);
};

exports.enableChannel = async (channel) => {
  const guildDB = await this.getGuild(channel.guild.id);
  const newDisabled = guildDB.disabled.filter(item => item !== channel.id);
  await connection.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [newDisabled, channel.guild.id]);
  collections.disabledCache.set(channel.guild.id, newDisabled);
};

exports.getCounts = async () => {
  const counts = await connection.query("SELECT * FROM counts");
  //const countArray = [];
  const countObject = {};
  for (const { command, count } of counts.rows) {
    countObject[command] = count;
  }
  return countObject;
};

exports.addCount = async (command) => {
  let count = await connection.query("SELECT * FROM counts WHERE command = $1", [command]);
  if (!count.rows[0]) {
    await connection.query("INSERT INTO counts (command, count) VALUES ($1, $2)", [command, 0]);
    count = await connection.query("SELECT * FROM counts WHERE command = $1", [command]);
  }
  await connection.query("UPDATE counts SET count = $1 WHERE command = $2", [count.rows[0].count ? count.rows[0].count + 1 : 1, command]);
};

exports.addGuild = async (guild) => {
  const query = await this.getGuild(guild);
  if (query) return query;
  await connection.query("INSERT INTO guilds (guild_id, prefix, disabled, disabled_commands) VALUES ($1, $2, $3, $4)", [guild.id, process.env.PREFIX, [], []]);
  return await this.getGuild(guild.id);
};

exports.fixGuild = async (guild) => {
  const guildDB = await connection.query("SELECT exists(SELECT 1 FROM guilds WHERE guild_id = $1)", [guild.id]);
  if (!guildDB.rows[0].exists) {
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