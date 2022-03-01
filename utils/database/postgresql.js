import { prefixCache, disabledCmdCache, disabledCache, commands } from "../collections.js";
import * as logger from "../logger.js";

import Postgres from "pg";
const connection = new Postgres.Pool({
  connectionString: process.env.DB,
  statement_timeout: 10000
});

const psqlUpdates = [
  "", // reserved
  "CREATE TABLE IF NOT EXISTS settings ( id smallint PRIMARY KEY, version integer NOT NULL, CHECK(id = 1) );\nALTER TABLE guilds ADD COLUMN accessed timestamp;",
  "ALTER TABLE guilds DROP COLUMN accessed"
];

export async function setup() {
  let counts;
  try {
    counts = await connection.query("SELECT * FROM counts");
  } catch {
    counts = { rows: [] };
  }

  if (!counts.rows[0]) {
    for (const command of commands.keys()) {
      await connection.query("INSERT INTO counts (command, count) VALUES ($1, $2)", [command, 0]);
    }
  } else {
    const exists = [];
    for (const command of commands.keys()) {
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
}

export async function upgrade(logger) {
  let version;
  try {
    version = (await connection.query("SELECT version FROM settings WHERE id = 1")).rows[0].version;
  } catch {
    version = 0;
  }
  if (version < (psqlUpdates.length - 1)) {
    logger.warn(`Migrating PostgreSQL database, which is currently at version ${version}...`);
    await connection.query("BEGIN");
    try {
      while (version < (psqlUpdates.length - 1)) {
        version++;
        logger.warn(`Running version ${version} update script (${psqlUpdates[version]})...`);
        await connection.query(psqlUpdates[version]);
      }
      await connection.query("COMMIT");
      await connection.query("INSERT INTO settings (id, version) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET version = $1", [psqlUpdates.length - 1]);
    } catch (e) {
      logger.error(`PostgreSQL migration failed: ${e}`);
      await connection.query("ROLLBACK");
      logger.error("Unable to start the bot, quitting now.");
      return 1;
    }
  }
}

export async function getGuild(query) {
  return (await connection.query("SELECT * FROM guilds WHERE guild_id = $1", [query])).rows[0];
}

export async function setPrefix(prefix, guild) {
  await connection.query("UPDATE guilds SET prefix = $1 WHERE guild_id = $2", [prefix, guild.id]);
  prefixCache.set(guild.id, prefix);
}

export async function getTag(guild, tag) {
  const tagResult = (await connection.query("SELECT * FROM tags WHERE guild_id = $1 AND name = $2", [guild, tag])).rows;
  return tagResult[0] ? { content: tagResult[0].content, author: tagResult[0].author } : undefined;
}

export async function getTags(guild) {
  const tagArray = (await connection.query("SELECT * FROM tags WHERE guild_id = $1", [guild])).rows;
  const tags = {};
  for (const tag of tagArray) {
    tags[tag.name] = { content: tag.content, author: tag.author };
  }
  return tags;
}

export async function setTag(name, content, guild) {
  await connection.query("INSERT INTO tags (guild_id, name, content, author) VALUES ($1, $2, $3, $4)", [guild.id, name, content.content, content.author]);
}

export async function editTag(name, content, guild) {
  await connection.query("UPDATE tags SET content = $1, author = $2 WHERE guild_id = $3 AND name = $4", [content.content, content.author, guild.id, name]);
}

export async function removeTag(name, guild) {
  await connection.query("DELETE FROM tags WHERE guild_id = $1 AND name = $2", [guild.id, name]);
}

export async function disableCommand(guild, command) {
  const guildDB = await this.getGuild(guild);
  await connection.query("UPDATE guilds SET disabled_commands = $1 WHERE guild_id = $2", [(guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command]).filter((v) => !!v), guild]);
  disabledCmdCache.set(guild, guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command].filter((v) => !!v));
}

export async function enableCommand(guild, command) {
  const guildDB = await this.getGuild(guild);
  const newDisabled = guildDB.disabled_commands ? guildDB.disabled_commands.filter(item => item !== command) : [];
  await connection.query("UPDATE guilds SET disabled_commands = $1 WHERE guild_id = $2", [newDisabled, guild]);
  disabledCmdCache.set(guild, newDisabled);
}

export async function disableChannel(channel) {
  const guildDB = await this.getGuild(channel.guild.id);
  await connection.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [[...guildDB.disabled, channel.id], channel.guild.id]);
  disabledCache.set(channel.guild.id, [...guildDB.disabled, channel.id]);
}

export async function enableChannel(channel) {
  const guildDB = await this.getGuild(channel.guild.id);
  const newDisabled = guildDB.disabled.filter(item => item !== channel.id);
  await connection.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [newDisabled, channel.guild.id]);
  disabledCache.set(channel.guild.id, newDisabled);
}

export async function getCounts() {
  const counts = await connection.query("SELECT * FROM counts");
  //const countArray = [];
  const countObject = {};
  for (const { command, count } of counts.rows) {
    countObject[command] = count;
  }
  return countObject;
}

export async function addCount(command) {
  let count = await connection.query("SELECT * FROM counts WHERE command = $1", [command]);
  if (!count.rows[0]) {
    await connection.query("INSERT INTO counts (command, count) VALUES ($1, $2)", [command, 0]);
    count = await connection.query("SELECT * FROM counts WHERE command = $1", [command]);
  }
  await connection.query("UPDATE counts SET count = $1 WHERE command = $2", [count.rows[0].count ? count.rows[0].count + 1 : 1, command]);
}

export async function addGuild(guild) {
  const query = await this.getGuild(guild);
  if (query) return query;
  try {
    await connection.query("INSERT INTO guilds (guild_id, prefix, disabled, disabled_commands) VALUES ($1, $2, $3, $4)", [guild.id, process.env.PREFIX, [], []]);
  } catch (e) {
    logger.error(`Failed to register guild ${guild.id}: ${e}`);
  }
  return await this.getGuild(guild.id);
}

export async function fixGuild(guild) {
  const guildDB = await connection.query("SELECT exists(SELECT 1 FROM guilds WHERE guild_id = $1)", [guild.id]);
  if (!guildDB.rows[0].exists) {
    logger.log(`Registering guild database entry for guild ${guild.id}...`);
    return await this.addGuild(guild);
  }
}

export async function stop() {
  await connection.end();
}
