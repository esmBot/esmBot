const player = require("../utils/soundplayer.js");

// run when a raw packet is sent, used for sending data to lavalink
module.exports = async (client, packet) => {
  if (!player.manager) return;
  switch (packet.t) {
    case "VOICE_SERVER_UPDATE":
      await player.manager.voiceServerUpdate(packet.d);
      break;
    case "VOICE_STATE_UPDATE":
      await player.manager.voiceStateUpdate(packet.d);
      break;
    case "GUILD_CREATE":
      for (const state of packet.d.voice_states) await player.manager.voiceStateUpdate({ ...state, guild_id: packet.d.id });
      break;
  }
};
