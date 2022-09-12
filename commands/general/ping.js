import Command from "../../classes/command.js";

class PingCommand extends Command {
  async run() {
    if (this.type === "classic") {
      const pingMessage = await this.client.createMessage(this.channel.id, Object.assign({
        content: "🏓 Ping?"
      }, this.reference));
      await pingMessage.edit(`🏓 Pong!\n\`\`\`\nLatency: ${pingMessage.timestamp - this.message.timestamp}ms${this.channel.guild ? `\nShard Latency: ${Math.round(this.client.shards.get(this.client.guildShardMap[this.channel.guild.id]).latency)}ms` : ""}\n\`\`\``);
    } else {
      await this.interaction.createMessage("🏓 Ping?");
      const pingMessage = await this.interaction.getOriginalMessage();
      await this.interaction.editOriginalMessage(`🏓 Pong!\n\`\`\`\nLatency: ${pingMessage.timestamp - Math.floor((this.interaction.id / 4194304) + 1420070400000)}ms${this.interaction.guildID ? `\nShard Latency: ${Math.round(this.client.shards.get(this.client.guildShardMap[this.interaction.guildID]).latency)}ms` : ""}\n\`\`\``);
    }
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

export default PingCommand;