const client = require("../utils/client.js");

exports.run = async (message) => {
  const pingMessage = await client.createMessage(message.channel.id, "🏓 Ping?");
  return pingMessage.edit(`🏓 Pong! Latency is ${pingMessage.timestamp - message.timestamp}ms. API Latency is ${Math.round(client.shards.get(client.guildShardMap[message.channel.guild.id]).latency)}ms.`);
};

exports.aliases = ["pong"];
exports.category = 1;
exports.help = "Pings the server I'm hosted on";