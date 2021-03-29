// dbl api client
const poster = require("topgg-autoposter");
const logger = require("./logger.js");
const client = require("./client.js");
const dbl = poster(process.env.DBL, client);
dbl.on("posted", () => {
  logger.log("Posted stats to top.gg");
});
dbl.on("error", e => {
  logger.error(e);
});
module.exports = dbl;
