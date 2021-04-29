const leaveHandler = require("./voiceChannelLeave.js");

module.exports = async (client, cluster, ipc, member, newChannel, oldChannel) => {
  await leaveHandler(client, cluster, ipc, member, oldChannel);
};