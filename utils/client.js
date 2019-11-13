// separate the client from app.js so we can call it later
const { Client } = require("eris");
const client = new Client(process.env.TOKEN, {
  defaultImageSize: 1024
});
module.exports = client;
