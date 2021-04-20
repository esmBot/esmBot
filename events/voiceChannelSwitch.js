const leaveHandler = require("./voiceChannelLeave");

module.exports = async (client, member, newChannel, oldChannel) => {
  await leaveHandler(client, member, oldChannel);
};