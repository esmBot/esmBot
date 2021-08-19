import { manager } from "../utils/soundplayer.js";

// run when a raw packet is sent, used for sending data to lavalink
export default async (client, cluster, worker, ipc, packet) => {
  if (!manager) return;
  switch (packet.t) {
    case "VOICE_SERVER_UPDATE":
      await manager.voiceServerUpdate(packet.d);
      break;
    case "VOICE_STATE_UPDATE":
      await manager.voiceStateUpdate(packet.d);
      break;
    case "GUILD_CREATE":
      for (const state of packet.d.voice_states) await manager.voiceStateUpdate({ ...state, guild_id: packet.d.id });
      break;
  }
};
