import type { Client, Member, StageChannel, Uncached, VoiceChannel } from "oceanic.js";
import leaveHandler from "./voiceChannelLeave.js";
import type { DatabasePlugin } from "../database.js";

export default async (
  client: Client,
  db: DatabasePlugin | undefined,
  member: Member,
  _newChannel: VoiceChannel | StageChannel | Uncached,
  oldChannel: VoiceChannel | StageChannel | Uncached | null,
) => {
  await leaveHandler(client, db, member, oldChannel);
};
