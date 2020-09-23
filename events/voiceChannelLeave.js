const soundPlayer = require("../utils/soundplayer.js");
const client = require("../utils/client.js");
const AwaitRejoin = require("../utils/awaitrejoin.js");
const { random } = require("../utils/misc.js");

module.exports = async (member, oldChannel) => {
  const connection = soundPlayer.players.get(oldChannel.guild.id);
  if (connection && oldChannel.id === connection.voiceChannel.id) {
    if (oldChannel.voiceMembers.filter((i) => i.id !== client.user.id).length === 0) {
      const waitMessage = await client.createMessage(connection.originalChannel.id, "🔊 Waiting 10 seconds for someone to return...");
      const awaitRejoin = new AwaitRejoin(oldChannel, true);
      awaitRejoin.on("end", (rejoined, member) => {
        if (rejoined) {
          soundPlayer.players.set(connection.voiceChannel.guild.id, { player: connection.player, type: connection.type, host: member.id, voiceChannel: connection.voiceChannel, originalChannel: connection.originalChannel });
          waitMessage.edit(`🔊 ${member.mention} is the new voice channel host.`);
        } else {
          if (waitMessage.channel.messages.get(waitMessage.id)) waitMessage.delete();
          connection.player.stop(connection.originalChannel.guild.id);
          soundPlayer.manager.leave(connection.originalChannel.guild.id);
          connection.player.destroy();
          soundPlayer.players.delete(connection.originalChannel.guild.id);
          soundPlayer.queues.delete(connection.originalChannel.guild.id);
          client.createMessage(connection.originalChannel.id, "🔊 The current voice channel session has ended.");
        }
      });
    } else if (member.id === connection.host) {
      const waitMessage = await client.createMessage(connection.originalChannel.id, "🔊 Waiting 10 seconds for the host to return...");
      const awaitRejoin = new AwaitRejoin(oldChannel, false, member.id);
      awaitRejoin.on("end", (rejoined) => {
        if (rejoined) {
          if (waitMessage.channel.messages.get(waitMessage.id)) waitMessage.delete();
        } else {
          const members = oldChannel.voiceMembers.filter((i) => i.id !== client.user.id);
          if (members.length === 0) {
            if (waitMessage.channel.messages.get(waitMessage.id)) waitMessage.delete();
            connection.player.stop(connection.originalChannel.guild.id);
            soundPlayer.manager.leave(connection.originalChannel.guild.id);
            connection.player.destroy();
            soundPlayer.players.delete(connection.originalChannel.guild.id);
            soundPlayer.queues.delete(connection.originalChannel.guild.id);
            client.createMessage(connection.originalChannel.id, "🔊 The current voice channel session has ended.");
          } else {
            const randomMember = random(members);
            soundPlayer.players.set(connection.voiceChannel.guild.id, { player: connection.player, type: connection.type, host: randomMember.id, voiceChannel: connection.voiceChannel, originalChannel: connection.originalChannel });
            waitMessage.edit(`🔊 ${randomMember.mention} is the new voice channel host.`);
          }
        }
      });
    } else if (member.id === client.user.id) {
      connection.player.stop(connection.originalChannel.guild.id);
      soundPlayer.manager.leave(connection.originalChannel.guild.id);
      connection.player.destroy();
      soundPlayer.players.delete(connection.originalChannel.guild.id);
      soundPlayer.queues.delete(connection.originalChannel.guild.id);
      await client.createMessage(connection.originalChannel.id, "🔊 The current voice channel session has ended.");
    }
  }
};