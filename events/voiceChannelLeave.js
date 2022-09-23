import { players, queues, skipVotes } from "../utils/soundplayer.js";
import AwaitRejoin from "../utils/awaitrejoin.js";
import { random } from "../utils/misc.js";

const isWaiting = new Map();

export default async (client, member, oldChannel) => {
  if (!oldChannel) return;
  const connection = players.get(oldChannel.guild.id);
  if (oldChannel.id === connection?.voiceChannel.id) {
    if (oldChannel.voiceMembers.filter((i) => i.id !== client.user.id && !i.bot).length === 0) {
      if (isWaiting.has(oldChannel.id)) return;
      isWaiting.set(oldChannel.id, true);
      connection.player.setPaused(true);
      const waitMessage = await client.createMessage(connection.originalChannel.id, "🔊 Waiting 10 seconds for someone to return...");
      const awaitRejoin = new AwaitRejoin(oldChannel, true, member.id);
      awaitRejoin.on("end", async (rejoined, newMember) => {
        isWaiting.delete(oldChannel.id);
        if (rejoined) {
          connection.player.setPaused(false);
          if (member.id !== newMember.id) {
            players.set(connection.voiceChannel.guild.id, { player: connection.player, type: connection.type, host: newMember.id, voiceChannel: connection.voiceChannel, originalChannel: connection.originalChannel, loop: connection.loop, shuffle: connection.shuffle, playMessage: connection.playMessage });
            waitMessage.edit(`🔊 ${newMember.mention} is the new voice channel host.`);
          } else {
            try {
              await waitMessage.delete();
            } catch {
              // no-op
            }
          }
        } else {
          try {
            if (waitMessage.channel.messages.has(waitMessage.id)) await waitMessage.delete();
          } catch {
            // no-op
          }
          try {
            connection.player.node.leaveChannel(connection.originalChannel.guild.id);
          } catch {
            // no-op
          }
          players.delete(connection.originalChannel.guild.id);
          queues.delete(connection.originalChannel.guild.id);
          skipVotes.delete(connection.originalChannel.guild.id);
          client.createMessage(connection.originalChannel.id, `🔊 The voice channel session in \`${connection.originalChannel.name}\` has ended.`);
        }
      });
    } else if (member.id === connection.host) {
      if (isWaiting.has(oldChannel.id)) return;
      isWaiting.set(oldChannel.id, true);
      const waitMessage = await client.createMessage(connection.originalChannel.id, "🔊 Waiting 10 seconds for the host to return...");
      const awaitRejoin = new AwaitRejoin(oldChannel, false, member.id);
      awaitRejoin.on("end", async (rejoined) => {
        isWaiting.delete(oldChannel.id);
        if (rejoined) {
          try {
            if (waitMessage.channel.messages.has(waitMessage.id)) await waitMessage.delete();
          } catch {
            // no-op
          }
        } else {
          const members = oldChannel.voiceMembers.filter((i) => i.id !== client.user.id && !i.bot);
          if (members.length === 0) {
            try {
              if (waitMessage.channel.messages.has(waitMessage.id)) await waitMessage.delete();
            } catch {
              // no-op
            }
            try {
              connection.player.node.leaveChannel(connection.originalChannel.guild.id);
            } catch {
              // no-op
            }
            players.delete(connection.originalChannel.guild.id);
            queues.delete(connection.originalChannel.guild.id);
            skipVotes.delete(connection.originalChannel.guild.id);
            client.createMessage(connection.originalChannel.id, `🔊 The voice channel session in \`${connection.originalChannel.name}\` has ended.`);
          } else {
            const randomMember = random(members);
            players.set(connection.voiceChannel.guild.id, { player: connection.player, type: connection.type, host: randomMember.id, voiceChannel: connection.voiceChannel, originalChannel: connection.originalChannel, loop: connection.loop, shuffle: connection.shuffle, playMessage: connection.playMessage });
            waitMessage.edit(`🔊 ${randomMember.mention} is the new voice channel host.`);
          }
        }
      });
    } else if (member.id === client.user.id) {
      isWaiting.delete(oldChannel.id);
      try {
        connection.player.node.leaveChannel(connection.originalChannel.guild.id);
      } catch {
        // no-op
      }
      players.delete(connection.originalChannel.guild.id);
      queues.delete(connection.originalChannel.guild.id);
      skipVotes.delete(connection.originalChannel.guild.id);
      await client.createMessage(connection.originalChannel.id, `🔊 The voice channel session in \`${connection.originalChannel.name}\` has ended.`);
    }
  }
};
