import { manager, players, queues, skipVotes } from "../utils/soundplayer.js";
import AwaitRejoin from "../utils/awaitrejoin.js";
import { random } from "../utils/misc.js";
import logger from "../utils/logger.js";
import { GuildChannel, VoiceChannel, StageChannel } from "oceanic.js";

const isWaiting = new Map();

/**
 * @param {import("oceanic.js").Client} client
 * @param {import("oceanic.js").Member} member
 * @param {import("oceanic.js").VoiceChannel | import("oceanic.js").StageChannel | null} oldChannel
 */
export default async (client, member, oldChannel) => {
  // block if client is not ready yet
  if (!client.ready) return;
  
  if (!oldChannel) return;
  const connection = players.get(member.guildID);
  if (connection && oldChannel.id === connection.voiceChannel.id) {
    const fullChannel = oldChannel.voiceMembers ? oldChannel : await client.rest.channels.get(oldChannel.id);
    if (!(fullChannel instanceof VoiceChannel) && !(fullChannel instanceof StageChannel)) return;
    if (fullChannel.voiceMembers.filter((i) => i.id !== client.user.id && !i.bot).length === 0) {
      if (isWaiting.has(oldChannel.id)) return;
      isWaiting.set(oldChannel.id, true);
      connection.player.setPaused(true);
      const waitMessage = await client.rest.channels.createMessage(connection.originalChannel.id, {
        content: "🔊 Waiting 10 seconds for someone to return..."
      });
      const awaitRejoin = new AwaitRejoin(fullChannel, true, member.id);
      awaitRejoin.once("end", async (rejoined, newMember, cancel) => {
        isWaiting.delete(oldChannel.id);
        if (rejoined) {
          if (cancel) return;
          connection.player.setPaused(false);
          if (member.id !== newMember.id) {
            players.set(connection.voiceChannel.guildID, { player: connection.player, host: newMember.id, voiceChannel: connection.voiceChannel, originalChannel: connection.originalChannel, loop: connection.loop, shuffle: connection.shuffle, playMessage: connection.playMessage });
            waitMessage.edit({
              content: `🔊 ${newMember.mention} is the new voice channel host.`
            });
          } else {
            try {
              await waitMessage.delete();
            } catch {
              logger.warn(`Failed to delete wait message ${waitMessage.id}`);
            }
          }
        } else {
          try {
            if (waitMessage.channel?.messages.has(waitMessage.id)) await waitMessage.delete();
          } catch {
            logger.warn(`Failed to delete wait message ${waitMessage.id}`);
          }
          if (cancel) return;
          await handleExit(client, connection);
        }
      });
    } else if (member.id === connection.host) {
      if (isWaiting.has(oldChannel.id)) return;
      isWaiting.set(oldChannel.id, true);
      const waitMessage = await client.rest.channels.createMessage(connection.originalChannel.id, {
        content: "🔊 Waiting 10 seconds for the host to return..."
      });
      const awaitRejoin = new AwaitRejoin(fullChannel, false, member.id);
      awaitRejoin.once("end", async (rejoined) => {
        isWaiting.delete(oldChannel.id);
        if (rejoined) {
          try {
            if (waitMessage.channel?.messages.has(waitMessage.id)) await waitMessage.delete();
          } catch {
            logger.warn(`Failed to delete wait message ${waitMessage.id}`);
          }
        } else {
          const members = fullChannel.voiceMembers.filter((i) => i.id !== client.user.id && !i.bot);
          if (members.length === 0) {
            try {
              if (waitMessage.channel?.messages.has(waitMessage.id)) await waitMessage.delete();
            } catch {
              logger.warn(`Failed to delete wait message ${waitMessage.id}`);
            }
            await handleExit(client, connection);
          } else {
            const randomMember = random(members);
            players.set(connection.voiceChannel.guildID, { player: connection.player, host: randomMember.id, voiceChannel: connection.voiceChannel, originalChannel: connection.originalChannel, loop: connection.loop, shuffle: connection.shuffle, playMessage: connection.playMessage });
            waitMessage.edit({
              content: `🔊 ${randomMember.mention} is the new voice channel host.`
            });
          }
        }
      });
    } else if (member.id === client.user.id) {
      isWaiting.delete(oldChannel.id);
      await handleExit(client, connection);
    }
  }
};

/**
 * @param {import("oceanic.js").Client} client
 * @param {{ player?: import("shoukaku").Player; host?: string; voiceChannel: import("oceanic.js").VoiceChannel; originalChannel: import("oceanic.js").GuildChannel; loop?: boolean; shuffle?: boolean; playMessage?: import("oceanic.js").Message; }} connection
 */
async function handleExit(client, connection) {
  players.delete(connection.originalChannel.guildID);
  queues.delete(connection.originalChannel.guildID);
  skipVotes.delete(connection.originalChannel.guildID);
  try {
    await manager.leaveVoiceChannel(connection.originalChannel.guildID);
  } catch {
    logger.warn(`Failed to leave voice channel ${connection.originalChannel.guildID}`);
  }
  try {
    await client.rest.channels.createMessage(connection.originalChannel.id, {
      content: `🔊 The voice channel session in \`${connection.voiceChannel.name}\` has ended.`
    });
  } catch {
    logger.warn(`Failed to post leave message in channel ${connection.originalChannel.id}`);
  }
}