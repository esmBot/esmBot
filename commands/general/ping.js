import { Base } from "oceanic.js";
import Command from "../../classes/command.js";

class PingCommand extends Command {
  // help
  async run() {
    if (this.type === "classic") {
      const pingMessage = await this.client.rest.channels.createMessage(this.message.channelID, Object.assign({
        content: `🏓 ${this.getString("commands.responses.ping.ping")}`
      }, this.reference));
      await pingMessage.edit({
        content: `🏓 ${this.getString("commands.responses.ping.pong")}
\`\`\`
${this.getString("commands.responses.ping.latency", { params: { latency: pingMessage.timestamp - this.message.timestamp } })}
${this.message.guildID ? `${this.getString("commands.responses.ping.shardLatency", {
  params: {
    latency: Math.round(this.client.shards.get(this.client.guildShardMap[this.message.guildID]).latency)
  }
})}\n` : ""}\`\`\``
      });
    } else {
      const pingMessage = await this.interaction?.getOriginal();
      return `🏓 ${this.getString("commands.responses.ping.pong")}
\`\`\`
${this.getString("commands.responses.ping.latency", {
  params: {
    latency: Math.abs(pingMessage.timestamp - Base.getCreatedAt(this.interaction.id)).toString()
  }
})}
${this.guild ? `${this.getString("commands.responses.ping.shardLatency", {
  params: {
    latency: Math.round(this.client.shards.get(this.client.guildShardMap[this.interaction.guildID]).latency)
  }
})}\n` : ""}\`\`\``;
    }
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

export default PingCommand;