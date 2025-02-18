import type { Client, Member, StageChannel, Uncached, VoiceChannel } from "oceanic.js";
import leaveHandler from "./voiceChannelLeave.js";

export default async (client: Client, member: Member, _newChannel: VoiceChannel | StageChannel | Uncached, oldChannel: VoiceChannel | StageChannel | Uncached | null) => {
  await leaveHandler(client, member, oldChannel);
};