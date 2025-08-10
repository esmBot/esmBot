import type { Member, StageChannel, Uncached, VoiceChannel } from "oceanic.js";
import type { EventParams } from "#utils/types.js";
import leaveHandler from "./voiceChannelLeave.ts";

export default async (
  params: EventParams,
  member: Member,
  _newChannel: VoiceChannel | StageChannel | Uncached,
  oldChannel: VoiceChannel | StageChannel | Uncached | null,
) => {
  await leaveHandler(params, member, oldChannel);
};
