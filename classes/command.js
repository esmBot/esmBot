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
      this.channel = options.message.channel;
      this.author = options.message.author;
      this.content = options.content;
      this.specialArgs = options.specialArgs;
      this.reference = {
        messageReference: {
          channelID: this.channel.id,
          messageID: this.message.id,
          guildID: this.channel.guild ? this.channel.guild.id : undefined,
          failIfNotExists: false
        },
        allowedMentions: {
          repliedUser: false
        }
      };
    } else if (options.type === "application") {
      this.interaction = options.interaction;
      this.channel = options.interaction.channel;
      this.author = options.interaction.guildID ? options.interaction.member : options.interaction.user;
      if (options.interaction.data.options) {
        this.specialArgs = this.options = options.interaction.data.options.reduce((obj, item) => {
          obj[item.name] = item.value;
          return obj;
        }, {});
      } else {
        this.specialArgs = this.options = {};
      }
    }
  }

  async run() {
    return "It works!";
  }

  async acknowledge() {
    if (this.type === "classic") {
      await this.client.sendChannelTyping(this.channel.id);
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