import leaveHandler from "./voiceChannelLeave.js";

export default async (client, member, newChannel, oldChannel) => {
  await leaveHandler(client, member, oldChannel);
};