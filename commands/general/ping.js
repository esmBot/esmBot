import Command from "#cmd-classes/command.js";

class PingCommand extends Command {
  async run() {
    const source = this.message ?? this.interaction;
    if (!source) throw Error("No message or interaction found");
    let pingMessage;
    if (source instanceof Message) {
      const reply = await this.reply({ content: `🏓 ${this.getString("commands.responses.ping.ping")}` });
      pingMessage = await reply.getMessage();
    } else {
      await this.acknowledge();
      pingMessage = await source.getOriginal();
    }
    const latency = pingMessage.createdAt.getTime() - source.createdAt.getTime();

    const lines = [
      `🏓 ${this.getString("commands.responses.ping.pong")}`,
      "```",
      this.getString("commands.responses.ping.latency", { params: { latency: latency.toString() } }),
    ];
    const shard = this.guild?.shard;
    if (shard) {
      const shardLatency = Math.round(shard.latency).toString();
      lines.push(this.getString("commands.responses.ping.shardLatency", { params: { latency: shardLatency } }));
    }
    lines.push("```");
    const content = lines.join("\n");

    if (this.message) {
      await pingMessage.edit({ content });
      return;
    }
    return content;
  }

  static description = "Pings Discord's servers";
  static aliases = ["pong"];
}

export default PingCommand;
