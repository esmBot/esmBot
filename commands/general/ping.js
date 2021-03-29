const client = require("../../utils/client.js");
const Command = require("../../classes/command.js");

class PingCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    const pingMessage = await client.createMessage(this.message.channel.id, "🏓 Ping?");
    return pingMessage.edit(`🏓 Pong!\n\`\`\`\nLatency: ${pingMessage.timestamp - this.message.timestamp}ms${this.message.channel.guild ? `\nShard Latency: ${Math.round(client.shards.get(client.guildShardMap[this.message.channel.guild.id]).latency)}ms` : ""}\n\`\`\``);
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

module.exports = PingCommand;