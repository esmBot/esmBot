const leaveHandler = require("./voiceChannelLeave.js");

module.exports = async (client, member, newChannel, oldChannel) => {
  await leaveHandler(member, oldChannel);
};