// dbl api client
const DBL = require("dblapi.js");
const logger = require("./logger.js");
const client = require("./client.js");
const dbl = new DBL(process.env.DBL, client);
dbl.on("error", e => {
  logger.error(e);
});
module.exports = dbl;
