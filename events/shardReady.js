import { players, errHandle } from "../utils/soundplayer.js";

export default async (client, id) => {
  for (const player of players.values()) {
    if (id !== player.voiceChannel.guild.shard.id) return;
    try {
      await player.player.connection.connect({
        guildId: player.voiceChannel.guildID,
        channelId: player.voiceChannel.id,
        shardId: player.voiceChannel.guild.shard.id,
        deaf: true
      });
    } catch (e) {
      errHandle(e, client, player.player, player.playingMessage, player.voiceChannel, { type: "classic" }, true);
    }
  }
};