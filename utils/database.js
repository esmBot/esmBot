// database stuff
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO, { poolSize: 10, bufferMaxEntries: 0, useNewUrlParser: true, useUnifiedTopology: true });
const guildSchema = new mongoose.Schema({
  id: String,
  tags: Map,
  prefix: String,
  warns: Map,
  disabledChannels: [String],
  tagsDisabled: Boolean
});
const Guild = mongoose.model("Guild", guildSchema);

const globalSchema = new mongoose.Schema({
  cmdCounts: Map
});
const Global = mongoose.model("Global", globalSchema);

exports.guilds = Guild;
exports.global = Global;
exports.connection = mongoose.connection;