const client = require("./client.js");
const logger = require("./logger.js");
const fetch = require("node-fetch");
const { Manager } = require("@lavacord/eris");

const nodes = [
  { id: "1", host: "localhost", port: 2333, password: process.env.LAVAPASS }
];

let manager;

exports.status = false;
exports.connected = false;

exports.checkStatus = async () => {
  const statuses = [];
  for (const node of nodes) {
    try {
      const response = await fetch(`http://${node.host}:${node.port}/version`, { headers: { Authorization: node.password } }).then(res => res.text());
      if (response) statuses.push(false);
    } catch {
      statuses.push(true);
    }
  }
  const result = statuses.filter(Boolean);
  this.status = result.length > 0 ? true : false;
  return this.status;
};

exports.connect = async () => {
  manager = new Manager(client, nodes, {
    user: client.user.id
  });
  const { length } = await manager.connect();
  logger.log(`Successfully connected to ${length} Lavalink node(s).`);
  exports.connected = true;
  manager.on("error", (error, node) => {
    logger.error(`An error occurred on Lavalink node ${node}: ${error}`);
  });
};

exports.play = async (sound, message) => {
  if (message.member.voiceState.channelID) {
    if (!message.channel.guild.members.get(client.user.id).permission.has("voiceConnect") || !message.channel.permissionsOf(client.user.id).has("voiceConnect")) return client.createMessage(message.channel.id, `${message.author.mention}, I can't join this voice channel!`);
    const voiceChannel = message.channel.guild.channels.get(message.member.voiceState.channelID);
    if (!voiceChannel.permissionsOf(client.user.id).has("voiceConnect")) return client.createMessage(message.channel.id, `${message.author.mention}, I don't have permission to join this voice channel!`);
    const node = manager.idealNodes[0];
    const { tracks } = await fetch(`http://${node.host}:${node.port}/loadtracks?identifier=${sound}`, { headers: { Authorization: node.password } }).then(res => res.json());
    const connection = await manager.join({
      guild: voiceChannel.guild.id,
      channel: voiceChannel.id,
      node: node.id
    });
    const playingMessage = await client.createMessage(message.channel.id, "🔊 Playing sound...");
    await connection.play(tracks[0].track);
    connection.on("error", (error) => {
      manager.leave(voiceChannel.guild.id);
      connection.destroy();
      playingMessage.delete();
      logger.error(error);
    });
    connection.once("end", (data) => {
      if (data.reason === "REPLACED") return;
      manager.leave(voiceChannel.guild.id);
      connection.destroy();
      playingMessage.delete();
    });
  } else {
    client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  }
};
