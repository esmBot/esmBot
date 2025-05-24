import { type Client, type Member, StageChannel, type Uncached, VoiceChannel } from "oceanic.js";
import AwaitRejoin from "#utils/awaitrejoin.js";
import { getString } from "#utils/i18n.js";
import logger from "#utils/logger.js";
import { random } from "#utils/misc.js";
import { type SoundPlayer, leaveChannel, players, queues, skipVotes } from "#utils/soundplayer.js";
import type { EventParams } from "#utils/types.js";

const isWaiting = new Map();

export default async (
  { client }: EventParams,
  member: Member,
  oldChannel: VoiceChannel | StageChannel | Uncached | null,
) => {
  // block if client is not ready yet
  if (!client.ready) return;

  if (!oldChannel || !("voiceMembers" in oldChannel)) return;
  const connection = players.get(member.guildID);
  if (connection && oldChannel.id === connection.voiceChannel) {
    if (!(oldChannel instanceof VoiceChannel) && !(oldChannel instanceof StageChannel)) return;
    if (oldChannel.voiceMembers.filter((i) => i.id !== client.user.id && !i.bot).length === 0) {
      if (isWaiting.has(oldChannel.id)) return;
      isWaiting.set(oldChannel.id, true);
      connection.player.setPaused(true);
      const waitMessage = await client.rest.channels.createMessage(connection.originalChannel, {
        content: `🔊 ${getString("sound.waitingForSomeone", { locale: connection.locale })}`,
      });
      const awaitRejoin = new AwaitRejoin(client, oldChannel, true, member.id);
      awaitRejoin.once("end", async (newMember) => {
        isWaiting.delete(oldChannel.id);
        if (newMember) {
          connection.player.setPaused(false);
          if (member.id !== newMember.id) {
            connection.host = newMember.id;
            players.set(connection.guild, connection);
            waitMessage.edit({
              content: `🔊 ${getString("sound.newHost", { locale: connection.locale, params: { member: `<@${newMember.id}>` } })}`,
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
          await handleExit(client, connection);
        }
      });
    } else if (member.id === connection.host) {
      if (isWaiting.has(oldChannel.id)) return;
      isWaiting.set(oldChannel.id, true);
      const waitMessage = await client.rest.channels.createMessage(connection.originalChannel, {
        content: `🔊 ${getString("sound.waitingForHost", { locale: connection.locale })}`,
      });
      const awaitRejoin = new AwaitRejoin(client, oldChannel, false, member.id);
      awaitRejoin.once("end", async (newMember) => {
        isWaiting.delete(oldChannel.id);
        if (newMember) {
          try {
            if (waitMessage.channel?.messages.has(waitMessage.id)) await waitMessage.delete();
          } catch {
            logger.warn(`Failed to delete wait message ${waitMessage.id}`);
          }
        } else {
          const members = oldChannel.voiceMembers.filter((i) => i.id !== client.user.id && !i.bot);
          if (!members || members.length === 0) {
            try {
              if (waitMessage.channel?.messages.has(waitMessage.id)) await waitMessage.delete();
            } catch {
              logger.warn(`Failed to delete wait message ${waitMessage.id}`);
            }
            await handleExit(client, connection);
          } else {
            const randomMember = random(Array.from(members));
            connection.host = randomMember.id;
            players.set(connection.guild, connection);
            waitMessage.edit({
              content: `🔊 ${getString("sound.newHost", { locale: connection.locale, params: { member: `<@${randomMember}>` } })}`,
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

async function handleExit(client: Client, connection: SoundPlayer) {
  players.delete(connection.guild);
  queues.delete(connection.guild);
  skipVotes.delete(connection.guild);
  try {
    await leaveChannel(connection.guild);
  } catch {
    logger.warn(`Failed to leave voice channel ${connection.guild}`);
  }
  try {
    const channel =
      client.getChannel<VoiceChannel | StageChannel>(connection.voiceChannel) ??
      (await client.rest.channels.get<VoiceChannel | StageChannel>(connection.voiceChannel));
    await client.rest.channels.createMessage(connection.originalChannel, {
      content: `🔊 ${getString("sound.endedInChannel", {
        locale: connection.locale,
        params: {
          channel: channel.name,
        },
      })}`,
    });
  } catch {
    logger.warn(`Failed to post leave message in channel ${connection.originalChannel}`);
  }
}
