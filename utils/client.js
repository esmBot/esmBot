// separate the client from app.js so we can call it later
const { Client } = require("eris");
const config = require("../config.json");
const client = new Client(config.token, {
  defaultImageSize: 1024
});
module.exports = client;
