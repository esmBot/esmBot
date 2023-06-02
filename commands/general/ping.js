import Command from "../../classes/command.js";

class PingCommand extends Command {
  async run() {
    if (this.type === "classic") {
      const pingMessage = await this.client.rest.channels.createMessage(this.message.channelID, Object.assign({
        content: "🏓 Ping?"
      }, this.reference));
      await pingMessage.edit({
        content: `🏓 Pong!\n\`\`\`\nLatency: ${pingMessage.timestamp - this.message.timestamp}ms${this.message.guildID ? `\nShard Latency: ${Math.round(this.client.shards.get(this.client.guildShardMap[this.message.guildID]).latency)}ms` : ""}\n\`\`\``
      });
    } else {
      await this.interaction.createMessage({
        content: "🏓 Ping?"
      });
      const pingMessage = await this.interaction.getOriginal();
      this.edit = true;
      return `🏓 Pong!\n\`\`\`\nLatency: ${pingMessage.timestamp - Math.floor((this.interaction.id / 4194304) + 1420070400000)}ms${this.interaction.guildID ? `\nShard Latency: ${Math.round(this.client.shards.get(this.client.guildShardMap[this.interaction.guildID]).latency)}ms` : ""}\n\`\`\``;
    }
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

export default PingCommand;