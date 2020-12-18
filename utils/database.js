// database stuff
const logger = require("./logger.js");
const collections = require("../utils/collections.js");
const misc = require("./misc.js");

if (process.env.DB_DRIVER=== "mongo") {
  const mongoose = require("mongoose");
  mongoose.connect(process.env.DB, {
    poolSize: 10,
    bufferMaxEntries: 0,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const guildSchema = new mongoose.Schema({
    id: String,
    tags: Map,
    prefix: String,
    disabled: [String],
    tagsDisabled: Boolean
  });
  const Guild = mongoose.model("Guild", guildSchema);

  const globalSchema = new mongoose.Schema({
    cmdCounts: Map,
  });
  const Global = mongoose.model("Global", globalSchema);

  exports.guilds = Guild;
  exports.global = Global;
  exports.connection = mongoose.connection;
} else if (process.env.DB_DRIVER=== "postgres") {
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: process.env.DB
  });
  exports.connection = pool;
}

exports.getGuild = async (query) => {
  if (process.env.DB_DRIVER=== "mongo") {
    return await this.guilds.findOne({ id: query });
  } else if (process.env.DB_DRIVER=== "postgres") {
    return (await this.connection.query("SELECT * FROM guilds WHERE guild_id = $1", [query])).rows[0];
  }
};

exports.setPrefix = async (prefix, guild) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const guildDB = await this.getGuild(guild.id);
    guildDB.prefix = prefix;
    await guildDB.save();
    collections.prefixCache.set(guild.id, prefix);
  } else if (process.env.DB_DRIVER=== "postgres") {
    await this.connection.query("UPDATE guilds SET prefix = $1 WHERE guild_id = $2", [prefix, guild.id]);
    collections.prefixCache.set(guild.id, prefix);
  }
};

exports.setTag = async (name, content, guild) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const guildDB = await this.getGuild(guild.id);
    guildDB.tags[name] = content;
    await guildDB.save();
  } else if (process.env.DB_DRIVER=== "postgres") {
    const guildDB = await this.getGuild(guild.id);
    guildDB.tags[name] = content;
    await this.connection.query("UPDATE guilds SET tags = $1 WHERE guild_id = $2", [guildDB.tags, guild.id]);
  }
};

exports.removeTag = async (name, guild) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const guildDB = await this.getGuild(guild.id);
    delete guildDB.tags[name];
    await guildDB.save();
  } else if (process.env.DB_DRIVER=== "postgres") {
    const guildDB = await this.getGuild(guild.id);
    delete guildDB.tags[name];
    await this.connection.query("UPDATE guilds SET tags = $1 WHERE guild_id = $2", [guildDB.tags, guild.id]);
  }
};

exports.toggleTags = async (guild) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const guildDB = await this.getGuild(guild.id);
    guildDB.tagsDisabled = !guildDB.tagsDisabled;
    await guildDB.save();
    return guildDB.tagsDisabled;
  } else if (process.env.DB_DRIVER=== "postgres") {
    const guildDB = await this.getGuild(guild.id);
    guildDB.tags_disabled = !guildDB.tags_disabled;
    await this.connection.query("UPDATE guilds SET tags_disabled = $1 WHERE guild_id = $2", [guildDB.tags_disabled, guild.id]);
    return guildDB.tags_disabled;
  }
};

exports.disableChannel = async (channel) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const guildDB = await this.getGuild(channel.guild.id);
    guildDB.disabled.push(channel.id);
    await guildDB.save();
    collections.disabledCache.set(channel.guild.id, guildDB.disabled);
  } else if (process.env.DB_DRIVER=== "postgres") {
    const guildDB = await this.getGuild(channel.guild.id);
    await this.connection.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [[...guildDB.disabled, channel.id], channel.guild.id]);
    collections.disabledCache.set(channel.guild.id, guildDB.disabled);
  }
};

exports.enableChannel = async (channel) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const guildDB = await this.getGuild(channel.guild.id);
    guildDB.disabled = guildDB.disabled.filter(item => item !== channel.id);
    await guildDB.save();
    collections.disabledCache.set(channel.guild.id, guildDB.disabled);
  } else if (process.env.DB_DRIVER=== "postgres") {
    const guildDB = await this.getGuild(channel.guild.id);
    const newDisabled = guildDB.disabled.filter(item => item !== channel.id);
    await this.connection.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [newDisabled, channel.guild.id]);
    collections.disabledCache.set(channel.guild.id, guildDB.disabled);
  }
};

exports.getCounts = async () => {
  if (process.env.DB_DRIVER=== "mongo") {
    return [...(await this.global.findOne({})).cmdCounts.entries()];
  } else if (process.env.DB_DRIVER=== "postgres") {
    const counts = await this.connection.query("SELECT * FROM counts");
    const countArray = [];
    for (const { command, count } of counts.rows) {
      countArray.push([command, count]);
    }
    return countArray;
  }
};

exports.addCount = async (command) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const global = await this.global.findOne({});
    const count = global.cmdCounts.get(command);
    global.cmdCounts.set(command, parseInt(count) + 1);
    await global.save();
  } else if (process.env.DB_DRIVER=== "postgres") {
    const count = await this.connection.query("SELECT * FROM counts WHERE command = $1", [command]);
    await this.connection.query("UPDATE counts SET count = $1 WHERE command = $2", [count.rows[0].count + 1, command]);
  }
};

exports.addGuild = async (guild) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const guildDB = new this.guilds({
      id: guild.id,
      tags: misc.tagDefaults,
      prefix: process.env.PREFIX,
      disabled: [],
      tagsDisabled: false
    });
    await guildDB.save();
    return guildDB;
  } else if (process.env.DB_DRIVER=== "postgres") {
    await this.connection.query("INSERT INTO guilds (guild_id, tags, prefix, warns, disabled, tags_disabled) VALUES ($1, $2, $3, $4, $5, $6)", [guild.id, misc.tagDefaults, process.env.PREFIX, {}, [], false]);
    return await this.getGuild(guild.id);
  }
};

exports.fixGuild = async (guild) => {
  if (process.env.DB_DRIVER=== "mongo") {
    const guildDB = await this.guilds.findOne({ id: guild.id });
    if (!guildDB) {
      logger.log(`Registering guild database entry for guild ${guild.id}...`);
      return await this.addGuild(guild);
    } else {
      if (!guildDB.disabled && guildDB.disabledChannels) {
        guildDB.set("disabled", guildDB.disabledChannels);
        guildDB.set("disabledChannels", undefined);
        await guildDB.save();
        return guildDB;
      }
    }
  } else if (process.env.DB_DRIVER=== "postgres") {
    const guildDB = await this.connection.query("SELECT * FROM guilds WHERE guild_id = $1", [guild.id]);
    if (guildDB.rows.length === 0) {
      logger.log(`Registering guild database entry for guild ${guild.id}...`);
      return await this.addGuild(guild);
    }
  }
};

exports.handleCounts = async () => {
  if (process.env.DB_DRIVER=== "mongo") {
    const global = await this.global.findOne({});
    if (!global) {
      const countObject = {};
      for (const command of collections.commands.keys()) {
        countObject[command] = 0;
      }
      const newGlobal = new this.global({
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
  } else if (process.env.DB_DRIVER=== "postgres") {
    let counts;
    try {
      counts = await this.connection.query("SELECT * FROM counts");
    } catch {
      counts = { rows: [] };
    }

    if (!counts.rows[0]) {
      for (const command of collections.commands.keys()) {
        await this.connection.query("INSERT INTO counts (command, count) VALUES ($1, $2)", [command, 0]);
      }
    } else {
      const exists = [];
      for (const command of collections.commands.keys()) {
        const count = await this.connection.query("SELECT * FROM counts WHERE command = $1", [command]);
        if (!count.rows[0]) {
          await this.connection.query("INSERT INTO counts (command, count) VALUES ($1, $2)", [command, 0]);
        }
        exists.push(command);
      }
      
      for (const { command } of counts.rows) {
        if (!exists.includes(command)) {
          await this.connection.query("DELETE FROM counts WHERE command = $1", [command]);
        }
      }
    }
  }
};