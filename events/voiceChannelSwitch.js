const leaveHandler = require("./voiceChannelLeave.js");

module.exports = async (member, newChannel, oldChannel) => {
  await leaveHandler(member, oldChannel);
};