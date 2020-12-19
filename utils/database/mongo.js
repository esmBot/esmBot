const collections = require("../collections.js");
const logger = require("../logger.js");
const misc = require("../misc.js");

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

const connection = mongoose.connection;

exports.getGuild = async (query) => {
  return await Guild.findOne({ id: query });
};

exports.setPrefix = async (prefix, guild) => {
  const guildDB = await this.getGuild(guild.id);
  guildDB.prefix = prefix;
  await guildDB.save();
  collections.prefixCache.set(guild.id, prefix);
};

exports.setTag = async (name, content, guild) => {
  const guildDB = await this.getGuild(guild.id);
  guildDB.tags[name] = content;
  await guildDB.save();
};

exports.removeTag = async (name, guild) => {
  const guildDB = await this.getGuild(guild.id);
  delete guildDB.tags[name];
  await guildDB.save();
};

exports.toggleTags = async (guild) => {
  const guildDB = await this.getGuild(guild.id);
  guildDB.tagsDisabled = !guildDB.tagsDisabled;
  await guildDB.save();
  return guildDB.tagsDisabled;
};

exports.disableChannel = async (channel) => {
  const guildDB = await this.getGuild(channel.guild.id);
  guildDB.disabled.push(channel.id);
  await guildDB.save();
  collections.disabledCache.set(channel.guild.id, guildDB.disabled);
};

exports.enableChannel = async (channel) => {
  const guildDB = await this.getGuild(channel.guild.id);
  guildDB.disabled = guildDB.disabled.filter(item => item !== channel.id);
  await guildDB.save();
  collections.disabledCache.set(channel.guild.id, guildDB.disabled);
};

exports.getCounts = async () => {
  return [...(await Global.findOne({})).cmdCounts.entries()];
};

exports.addCount = async (command) => {
  const global = await Global.findOne({});
  const count = global.cmdCounts.get(command);
  global.cmdCounts.set(command, parseInt(count) + 1);
  await global.save();
};

exports.addGuild = async (guild) => {
  const guildDB = new Guild({
    id: guild.id,
    tags: misc.tagDefaults,
    prefix: process.env.PREFIX,
    disabled: [],
    tagsDisabled: false
  });
  await guildDB.save();
  return guildDB;
};

exports.fixGuild = async (guild) => {
  const guildDB = await Guild.findOne({ id: guild.id });
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
};

exports.setup = async () => {
  const global = await Global.findOne({});
  if (!global) {
    const countObject = {};
    for (const command of collections.commands.keys()) {
      countObject[command] = 0;
    }
    const newGlobal = new Global({
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
};

exports.stop = async () => {
  await connection.disconnect();
};