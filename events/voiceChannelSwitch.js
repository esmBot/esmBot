const leaveHandler = require("./voiceChannelLeave.js");

module.exports = async (client, cluster, worker, ipc, member, newChannel, oldChannel) => {
  await leaveHandler(client, cluster, worker, ipc, member, oldChannel);
};