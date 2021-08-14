// dummy (no-op) database handler
const misc = require("../misc.js");
const logger = require("../logger.js");

logger.warn("Using dummy database adapter. If this isn't what you wanted, check your DB variable.");

exports.setup = async () => {};
exports.stop = async () => {};
exports.fixGuild = async () => {};
exports.addCount = async () => {};
exports.getCounts = async () => {
  return {};
};
exports.disableCommand = async () => {};
exports.enableCommand = async () => {};
exports.disableChannel = async () => {};
exports.enableChannel = async () => {};
exports.getTags = async () => {};
exports.getTag = async () => {};
exports.setTag = async () => {};
exports.removeTag = async () => {};
exports.editTag = async () => {};
exports.setPrefix = async () => {};
exports.addGuild = async (guild) => {
  return {
    id: guild.id,
    tags: misc.tagDefaults,
    prefix: process.env.PREFIX,
    disabled: [],
    disabled_commands: []
  };
};
exports.getGuild = exports.addGuild;
