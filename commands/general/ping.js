import { Base } from "oceanic.js";
import Command from "#cmd-classes/command.js";

class PingCommand extends Command {
  // help
  async run() {
    if (this.type === "classic") {
      if (!this.message) throw Error("No message found");
      const pingMessage = await this.client.rest.channels.createMessage(
        this.message.channelID,
        Object.assign(
          {
            content: `🏓 ${this.getString("commands.responses.ping.ping")}`,
          },
          this.reference,
        ),
      );
      let shard;
      if (this.message.guildID) {
        const guildShard = this.client.guildShardMap.get(this.message.guildID);
        if (guildShard !== undefined) shard = this.client.shards.get(guildShard);
      }
      await pingMessage.edit({
        content: `🏓 ${this.getString("commands.responses.ping.pong")}
\`\`\`
${this.getString("commands.responses.ping.latency", {
  params: {
    latency: Math.abs(pingMessage.timestamp.getTime() - this.message.timestamp.getTime()).toString(),
  },
})}
${
  shard
    ? `${this.getString("commands.responses.ping.shardLatency", {
        params: {
          latency: Math.round(shard.latency).toString(),
        },
      })}\n`
    : ""
}\`\`\``,
      });
    } else {
      if (!this.interaction) throw Error("No interaction found");
      const pingMessage = await this.interaction.getOriginal();
      let shard;
      if (this.interaction.guildID) {
        const guildShard = this.client.guildShardMap.get(this.interaction.guildID);
        if (guildShard !== undefined) shard = this.client.shards.get(guildShard);
      }
      return `🏓 ${this.getString("commands.responses.ping.pong")}
\`\`\`
${this.getString("commands.responses.ping.latency", {
  params: {
    latency: Math.abs(pingMessage.timestamp.getTime() - Base.getCreatedAt(this.interaction.id).getTime()).toString(),
  },
})}
${
  shard
    ? `${this.getString("commands.responses.ping.shardLatency", {
        params: {
          latency: Math.round(shard.latency).toString(),
        },
      })}\n`
    : ""
}\`\`\``;
    }
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

export default PingCommand;
