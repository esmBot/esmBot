const Command = require("../../classes/command.js");

class PingCommand extends Command {
  async run() {
    const pingMessage = await this.message.channel.createMessage("🏓 Ping?");
    return pingMessage.edit(`🏓 Pong!\n\`\`\`\nLatency: ${pingMessage.timestamp - this.message.timestamp}ms${this.message.channel.guild ? `\nShard Latency: ${Math.round(this.client.shards.get(this.client.guildShardMap[this.message.channel.guild.id]).latency)}ms` : ""}\n\`\`\``);
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

module.exports = PingCommand;