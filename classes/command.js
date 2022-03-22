class Command {
  constructor(client, cluster, worker, ipc, options) {
    this.client = client;
    this.cluster = cluster;
    this.worker = worker;
    this.ipc = ipc;
    this.type = options.type;
    this.args = options.args;
    if (options.type === "classic") {
      this.message = options.message;
      this.content = options.content;
      this.specialArgs = options.specialArgs;
      this.reference = {
        messageReference: {
          channelID: this.message.channel.id,
          messageID: this.message.id,
          guildID: this.message.channel.guild ? this.message.channel.guild.id : undefined,
          failIfNotExists: false
        },
        allowedMentions: {
          repliedUser: false
        }
      };
    } else {
      this.interaction = options.interaction;
    }
  }

  async run() {
    return "It works!";
  }

  async acknowledge() {
    if (this.type === "classic") {
      await this.message.channel.sendTyping();
    } else {
      await this.interaction.acknowledge();
    }
  }

  static description = "No description found";
  static aliases = [];
  static arguments = [];
  static flags = [];
  static requires = [];
  static slashAllowed = true;
}

export default Command;