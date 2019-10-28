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
module.exports = Guild;