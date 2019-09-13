const logger = require("../utils/logger.js");

// run when eris encounters a warning
module.exports = async (warn, id) => {
  logger.warn(`A warn event was sent by Eris in shard ${id}: \n${warn.toString()}`);
};
