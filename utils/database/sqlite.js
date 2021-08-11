const collections = require("../collections.js");
const misc = require("../misc.js");
const logger = require("../logger.js");

const sqlite3 = require("better-sqlite3");
const connection = sqlite3(process.env.DB.replace("sqlite://", ""));

exports.setup = async () => {
  let counts;
  try {
    counts = connection.prepare("SELECT * FROM counts").all();
  } catch {
    connection.prepare("CREATE TABLE counts ( command VARCHAR NOT NULL, count integer NOT NULL )").run();
    counts = [];
  }

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
};

exports.stop = async () => {
  connection.close();
};

exports.fixGuild = async (guild) => {
  let guildDB;
  try {
    guildDB = connection.prepare("SELECT * FROM guilds WHERE guild_id = ?").get(guild.id);
  } catch {
    connection.prepare("CREATE TABLE guilds ( guild_id VARCHAR(30) NOT NULL, tags text NOT NULL, prefix VARCHAR(15) NOT NULL, disabled text NOT NULL, tags_disabled integer NOT NULL DEFAULT 0 CHECK(tags_disabled IN (0,1)) )").run();
  }
  if (!guildDB) {
    logger.log(`Registering guild database entry for guild ${guild.id}...`);
    return await this.addGuild(guild);
  }
};

exports.addCount = async (command) => {
  connection.prepare("UPDATE counts SET count = count + 1 WHERE command = ?").run(command);
};

exports.getCounts = async () => {
  const counts = connection.prepare("SELECT * FROM counts").all();
  const countObject = {};
  for (const { command, count } of counts) {
    countObject[command] = count;
  }
  return countObject;
};

exports.disableChannel = async (channel) => {
  const guildDB = await this.getGuild(channel.guild.id);
  connection.prepare("UPDATE guilds SET disabled = ? WHERE guild_id = ?").run(JSON.stringify([...JSON.parse(guildDB.disabled), channel.id]), channel.guild.id);
  collections.disabledCache.set(channel.guild.id, [...JSON.parse(guildDB.disabled), channel.id]);
};

exports.enableChannel = async (channel) => {
  const guildDB = await this.getGuild(channel.guild.id);
  const newDisabled = JSON.parse(guildDB.disabled).filter(item => item !== channel.id);
  connection.prepare("UPDATE guilds SET disabled = ? WHERE guild_id = ?").run(JSON.stringify(newDisabled), channel.guild.id);
  collections.disabledCache.set(channel.guild.id, newDisabled);
};

exports.toggleTags = async (guild) => {
  const guildDB = await this.getGuild(guild.id);
  guildDB.tags_disabled = guildDB.tags_disabled ? 0 : 1;
  connection.prepare("UPDATE guilds SET tags_disabled = ? WHERE guild_id = ?").run(guildDB.tags_disabled, guild.id);
};

exports.getTags = async (name, content, guild) => {
  const guildDB = await this.getGuild(guild.id);
  return JSON.parse(guildDB.tags);
};

exports.setTag = async (name, content, guild) => {
  const guildDB = await this.getGuild(guild.id);
  const tags = JSON.parse(guildDB.tags);
  tags[name] = content;
  connection.prepare("UPDATE guilds SET tags = ? WHERE guild_id = ?").run(JSON.stringify(tags), guild.id);
};

exports.removeTag = async (name, guild) => {
  const guildDB = await this.getGuild(guild.id);
  const tags = JSON.parse(guildDB.tags);
  delete tags[name];
  connection.prepare("UPDATE guilds SET tags = ? WHERE guild_id = ?").run(JSON.stringify(tags), guild.id);
};

exports.editTag = this.setTag;

exports.setPrefix = async (prefix, guild) => {
  connection.prepare("UPDATE guilds SET prefix = ? WHERE guild_id = ?").run(prefix, guild.id);
  collections.prefixCache.set(guild.id, prefix);
};

exports.addGuild = async (guild) => {
  const query = await this.getGuild(guild);
  if (query) return query;
  const guildObject = {
    id: guild.id,
    tags: JSON.stringify(misc.tagDefaults),
    prefix: process.env.PREFIX,
    disabled: "[]",
    tagsDisabled: 0
  };
  connection.prepare("INSERT INTO guilds (guild_id, tags, prefix, disabled, tags_disabled) VALUES (@id, @tags, @prefix, @disabled, @tagsDisabled)").run(guildObject);
  return guildObject;
};

exports.getGuild = async (query) => {
  try {
    return connection.prepare("SELECT * FROM guilds WHERE guild_id = ?").get(query);
  } catch {
    return;
  }
};
