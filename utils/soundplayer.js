const client = require("./client.js");
const fs = require("fs");
const logger = require("./logger.js");

module.exports = async (sound, message) => {
  if (message.member.voiceState.channelID) {
    if (!message.channel.guild.members.get(client.user.id).permission.has("voiceConnect") || !message.channel.permissionsOf(client.user.id).has("voiceConnect")) return client.createMessage(message.channel.id, `${message.author.mention}, I can't join this voice channel!`);
    const voiceChannel = message.channel.guild.channels.get(message.member.voiceState.channelID);
    if (!voiceChannel.permissionsOf(client.user.id).has("voiceConnect")) return client.createMessage(message.channel.id, `${message.author.mention}, I don't have permission to join this voice channel!`);
    const playingMessage = await client.createMessage(message.channel.id, "🔊 Playing sound...");
    const connection = await client.joinVoiceChannel(voiceChannel.id);
    console.log(connection.current);
    if (connection.playing) {
      connection.stopPlaying();
      connection.play(fs.createReadStream(sound));
    } else {
      connection.play(fs.createReadStream(sound));
    }
    connection.on("error", (error) => {
      voiceChannel.leave();
      playingMessage.delete();
      logger.error(error);
    });
    connection.once("end", () => {
      voiceChannel.leave();
      playingMessage.delete();
    });
  } else {
    client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  }
};
