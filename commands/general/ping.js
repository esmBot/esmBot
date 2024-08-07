import { Base } from "oceanic.js";
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
      const pingMessage = await this.interaction?.getOriginal();
      return `🏓 Pong!\n\`\`\`\nLatency: ${Math.abs(pingMessage.timestamp - Base.getCreatedAt(this.interaction.id)).toString()}ms${this.guild ? `\nShard Latency: ${Math.round(this.client.shards.get(this.client.guildShardMap[this.interaction.guildID]).latency)}ms` : ""}\n\`\`\``;
    }
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

export default PingCommand;