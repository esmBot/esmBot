// database stuff
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO);
const guildSchema = new mongoose.Schema({
  id: String,
  tags: Map,
  prefix: String
});
const Guild = mongoose.model("Guild", guildSchema);

const xpSchema = new mongoose.Schema({
  id: String,
  members: Map,
  enabled: Boolean
});
const XP = mongoose.model("XP", xpSchema);

exports.guilds = Guild;
exports.xp = XP;