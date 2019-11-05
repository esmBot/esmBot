// database stuff
const mongoose = require("mongoose");
const config = require("../config.json");
mongoose.connect(config.mongoURL);
const guildSchema = new mongoose.Schema({
  id: String,
  tags: Map,
  prefix: String
});
const Guild = mongoose.model("Guild", guildSchema);
/*const membersSchema = new mongoose.Schema({

});*/
const xpSchema = new mongoose.Schema({
  id: String,
  members: Map,
  enabled: Boolean
});
const XP = mongoose.model("XP", xpSchema);
exports.guilds = Guild;
exports.xp = XP;