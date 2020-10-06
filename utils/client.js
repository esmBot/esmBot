// separate the client from app.js so we can call it later
const { Client } = require("eris");
const client = new Client(process.env.TOKEN, {
  disableEvents: {
    CHANNEL_DELETE: true,
    CHANNEL_UPDATE: true,
    GUILD_BAN_REMOVE: true,
    GUILD_MEMBER_ADD: true,
    GUILD_MEMBER_REMOVE: true,
    GUILD_MEMBER_UPDATE: true,
    GUILD_ROLE_CREATE: true,
    GUILD_ROLE_DELETE: true,
    GUILD_ROLE_UPDATE: true,
    TYPING_START: true
  },
  maxShards: "auto"
});
module.exports = client;
