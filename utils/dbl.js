// dbl api client
const DBL = require("dblapi.js");
const logger = require("./logger.js");
const config = require("../config.json");
const client = require("./client.js");
const dbl = new DBL(config.dblToken, client);
dbl.on("error", e => {
  logger.error(e);
});
module.exports = dbl;
