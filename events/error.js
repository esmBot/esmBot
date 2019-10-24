const logger = require("../utils/logger.js");

// run when eris encounters an error
module.exports = async (error, id) => {
  logger.error(`An error event was sent by Eris in shard ${id}: \n${error.message}`);
};
