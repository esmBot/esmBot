import * as collections from "../collections.js";
import * as logger from "../logger.js";

import sqlite3 from "better-sqlite3";
const connection = sqlite3(process.env.DB.replace("sqlite://", ""));

const sqliteUpdates = [
  "", // reserved
  "ALTER TABLE guilds ADD COLUMN accessed int",
  "ALTER TABLE guilds DROP COLUMN accessed"
];

export async function setup() {
  const counts = connection.prepare("SELECT * FROM counts").all();
  if (!counts) {
    for (const command of collections.commands.keys()) {
      connection.prepare("INSERT INTO counts (command, count) VALUES (?, ?)").run(command, 0);
    }
  } else {
    const exists = [];
    for (const command of collections.commands.keys()) {
      const count = connection.prepare("SELECT * FROM counts WHERE command = ?").get(command);
      if (!count) {
        connection.prepare("INSERT INTO counts (command, count) VALUES (?, ?)").run(command, 0);
      }
      exists.push(command);
    }

    for (const { command } of counts) {
      if (!exists.includes(command)) {
        connection.prepare("DELETE FROM counts WHERE command = ?").run(command);
      }
    }
  }
}

export async function stop() {
  connection.close();
}

export async function upgrade(logger) {
  connection.prepare("CREATE TABLE IF NOT EXISTS guilds ( guild_id VARCHAR(30) NOT NULL PRIMARY KEY, prefix VARCHAR(15) NOT NULL, disabled text NOT NULL, disabled_commands text NOT NULL )").run();
  connection.prepare("CREATE TABLE IF NOT EXISTS counts ( command VARCHAR NOT NULL PRIMARY KEY, count integer NOT NULL )").run();
  connection.prepare("CREATE TABLE IF NOT EXISTS tags ( guild_id VARCHAR(30) NOT NULL, name text NOT NULL, content text NOT NULL, author VARCHAR(30) NOT NULL, UNIQUE(guild_id, name) )").run();

  let version = connection.pragma("user_version", { simple: true });
  if (version < (sqliteUpdates.length - 1)) {
    logger.warn(`Migrating SQLite database at ${process.env.DB}, which is currently at version ${version}...`);
    connection.prepare("BEGIN TRANSACTION").run();
    try {
      while (version < (sqliteUpdates.length - 1)) {
        version++;
        logger.warn(`Running version ${version} update script (${sqliteUpdates[version]})...`);
        connection.prepare(sqliteUpdates[version]).run();
      }
      connection.pragma(`user_version = ${version}`); // insecure, but the normal templating method doesn't seem to work here
      connection.prepare("COMMIT").run();
    } catch (e) {
      logger.error(`SQLite migration failed: ${e}`);
      connection.prepare("ROLLBACK").run();
      logger.error("Unable to start the bot, quitting now.");
      return 1;
    }
  }
}

export async function fixGuild(guild) {
  let guildDB;
  try {
    guildDB = connection.prepare("SELECT * FROM guilds WHERE guild_id = ?").get(guild.id);
  } catch {
    connection.prepare("CREATE TABLE guilds ( guild_id VARCHAR(30) NOT NULL PRIMARY KEY, prefix VARCHAR(15) NOT NULL, disabled text NOT NULL, disabled_commands text NOT NULL )").run();
  }
  if (!guildDB) {
    logger.log(`Registering guild database entry for guild ${guild.id}...`);
    return await this.addGuild(guild);
  }
}

export async function addCount(command) {
  connection.prepare("UPDATE counts SET count = count + 1 WHERE command = ?").run(command);
}

export async function getCounts() {
  const counts = connection.prepare("SELECT * FROM counts").all();
  const countObject = {};
  for (const { command, count } of counts) {
    countObject[command] = count;
  }
  return countObject;
}

export async function disableCommand(guild, command) {
  const guildDB = await this.getGuild(guild);
  connection.prepare("UPDATE guilds SET disabled_commands = ? WHERE guild_id = ?").run(JSON.stringify((guildDB.disabledCommands ? [...JSON.parse(guildDB.disabledCommands), command] : [command]).filter((v) => !!v)), guild);
  collections.disabledCmdCache.set(guild, guildDB.disabled_commands ? [...JSON.parse(guildDB.disabledCommands), command] : [command].filter((v) => !!v));
}

export async function enableCommand(guild, command) {
  const guildDB = await this.getGuild(guild);
  const newDisabled = guildDB.disabledCommands ? JSON.parse(guildDB.disabledCommands).filter(item => item !== command) : [];
  connection.prepare("UPDATE guilds SET disabled_commands = ? WHERE guild_id = ?").run(JSON.stringify(newDisabled), guild);
  collections.disabledCmdCache.set(guild, newDisabled);
}

export async function disableChannel(channel) {
  const guildDB = await this.getGuild(channel.guild.id);
  connection.prepare("UPDATE guilds SET disabled = ? WHERE guild_id = ?").run(JSON.stringify([...JSON.parse(guildDB.disabled), channel.id]), channel.guild.id);
  collections.disabledCache.set(channel.guild.id, [...JSON.parse(guildDB.disabled), channel.id]);
}

export async function enableChannel(channel) {
  const guildDB = await this.getGuild(channel.guild.id);
  const newDisabled = JSON.parse(guildDB.disabled).filter(item => item !== channel.id);
  connection.prepare("UPDATE guilds SET disabled = ? WHERE guild_id = ?").run(JSON.stringify(newDisabled), channel.guild.id);
  collections.disabledCache.set(channel.guild.id, newDisabled);
}

export async function getTag(guild, tag) {
  const tagResult = connection.prepare("SELECT * FROM tags WHERE guild_id = ? AND name = ?").get(guild, tag);
  return tagResult ? { content: tagResult.content, author: tagResult.author } : undefined;
}

export async function getTags(guild) {
  const tagArray = connection.prepare("SELECT * FROM tags WHERE guild_id = ?").all(guild);
  const tags = {};
  if (!tagArray) return [];
  for (const tag of tagArray) {
    tags[tag.name] = { content: tag.content, author: tag.author };
  }
  return tags;
}

export async function setTag(name, content, guild) {
  const tag = {
    id: guild.id,
    name: name,
    content: content.content,
    author: content.author
  };
  connection.prepare("INSERT INTO tags (guild_id, name, content, author) VALUES (@id, @name, @content, @author)").run(tag);
}

export async function removeTag(name, guild) {
  connection.prepare("DELETE FROM tags WHERE guild_id = ? AND name = ?").run(guild.id, name);
}

export async function editTag(name, content, guild) {
  connection.prepare("UPDATE tags SET content = ?, author = ? WHERE guild_id = ? AND name = ?").run(content.content, content.author, guild.id, name);
}

export async function setPrefix(prefix, guild) {
  connection.prepare("UPDATE guilds SET prefix = ? WHERE guild_id = ?").run(prefix, guild.id);
  collections.prefixCache.set(guild.id, prefix);
}

export async function addGuild(guild) {
  const query = await this.getGuild(guild);
  if (query) return query;
  const guildObject = {
    id: guild.id,
    prefix: process.env.PREFIX,
    disabled: "[]",
    disabledCommands: "[]"
  };
  connection.prepare("INSERT INTO guilds (guild_id, prefix, disabled, disabled_commands) VALUES (@id, @prefix, @disabled, @disabledCommands)").run(guildObject);
  return guildObject;
}

export async function getGuild(query) {
  try {
    return connection.prepare("SELECT * FROM guilds WHERE guild_id = ?").get(query);
  } catch {
    return;
  }
}
