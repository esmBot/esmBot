const client = require("../utils/client.js");

exports.run = async (message) => {
  const pingMessage = await client.createMessage(message.channel.id, "🏓 Ping?");
  return pingMessage.edit(`🏓 Pong!\n\`\`\`\nLatency: ${pingMessage.timestamp - message.timestamp}ms\nAPI Latency: ${Math.round(client.shards.get(client.guildShardMap[message.channel.guild.id]).latency)}ms\n\`\`\``);
};

exports.aliases = ["pong"];
exports.category = 1;
exports.help = "Pings the server I'm hosted on";