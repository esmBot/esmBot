import { Base } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class PingCommand extends Command {
  // help
  async run() {
    if (this.type === "classic") {
      if (!this.message) throw Error("No message found");
      const pingMessage = await this.client.rest.channels.createMessage(this.message.channelID, Object.assign({
        content: `🏓 ${this.getString("commands.responses.ping.ping")}`
      }, this.reference));
      const shard = this.message.guildID ? this.client.shards.get(this.client.guildShardMap[this.message.guildID]) : undefined;
      await pingMessage.edit({
        content: `🏓 ${this.getString("commands.responses.ping.pong")}
\`\`\`
${this.getString("commands.responses.ping.latency", {
  params: {
    latency: Math.abs(pingMessage.timestamp.getTime() - this.message.timestamp.getTime()).toString()
  }
})}
${shard ? `${this.getString("commands.responses.ping.shardLatency", {
  params: {
    latency: Math.round(shard.latency).toString()
  }
})}\n` : ""}\`\`\``
      });
    } else {
      if (!this.interaction) throw Error("No interaction found");
      const pingMessage = await this.interaction.getOriginal();
      const shard = this.interaction.guildID ? this.client.shards.get(this.client.guildShardMap[this.interaction.guildID]) : undefined;
      return `🏓 ${this.getString("commands.responses.ping.pong")}
\`\`\`
${this.getString("commands.responses.ping.latency", {
  params: {
    latency: Math.abs(pingMessage.timestamp.getTime() - Base.getCreatedAt(this.interaction.id).getTime()).toString()
  }
})}
${shard ? `${this.getString("commands.responses.ping.shardLatency", {
  params: {
    latency: Math.round(shard.latency).toString()
  }
})}\n` : ""}\`\`\``;
    }
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

export default PingCommand;