const client = require("./client.js");
const fs = require("fs");
const logger = require("./logger.js");

module.exports = async (sound, message) => {
  if (message.member.voiceState.channelID) {
    if (!message.channel.guild.members.get(client.user.id).permission.has("voiceConnect") || !message.channel.permissionsOf(client.user.id).has("voiceConnect")) return client.createMessage(message.channel.id, `${message.author.mention}, I can't join this voice channel!`);
    const voiceChannel = message.channel.guild.channels.get(message.member.voiceState.channelID);
    client.createMessage(message.channel.id, "🔊 Playing sound...");
    const connection = await client.joinVoiceChannel(voiceChannel.id);
    if (connection.playing) {
      connection.stopPlaying();
    }
    connection.play(fs.createReadStream(sound));
    connection.on("error", (error) => {
      voiceChannel.leave();
      logger.error(error);
    });
    connection.once("end", () => {
      voiceChannel.leave();
    });
  } else {
    client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  }
};
