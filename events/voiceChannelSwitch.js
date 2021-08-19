import leaveHandler from "./voiceChannelLeave.js";

export default async (client, cluster, worker, ipc, member, newChannel, oldChannel) => {
  await leaveHandler(client, cluster, worker, ipc, member, oldChannel);
};