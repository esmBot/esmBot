// separate the client from app.js so we can call it later
const { Client } = require("eris");
const client = new Client(process.env.TOKEN, {
  defaultImageSize: 1024,
  disableEvents: {
    CHANNEL_CREATE: true,
    CHANNEL_DELETE: true,
    CHANNEL_UPDATE: true,
    GUILD_BAN_REMOVE: true,
    GUILD_MEMBER_ADD: true,
    GUILD_MEMBER_REMOVE: true,
    GUILD_MEMBER_UPDATE: true,
    GUILD_ROLE_CREATE: true,
    GUILD_ROLE_DELETE: true,
    GUILD_ROLE_UPDATE: true,
    TYPING_START: true,
    USER_UPDATE: true
  },
  maxShards: "auto",
  opusOnly: true
});
module.exports = client;
