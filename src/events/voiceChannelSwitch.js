import leaveHandler from "./voiceChannelLeave.js";

export default async (client, member, _newChannel, oldChannel) => {
  await leaveHandler(client, member, oldChannel);
};