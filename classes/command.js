class Command {
  success = true;
  constructor(client, cluster, worker, ipc, options) {
    this.client = client;
    this.cluster = cluster;
    this.worker = worker;
    this.ipc = ipc;
    this.origOptions = options;
    this.type = options.type;
    this.args = options.args;
    if (options.type === "classic") {
      this.message = options.message;
      this.channel = options.message.channel;
      this.author = options.message.author;
      this.member = options.message.member;
      this.content = options.content;
      this.options = options.specialArgs;
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
      this.args = [];
      this.channel = options.interaction.channel;
      this.author = this.member = options.interaction.guildID ? options.interaction.member : options.interaction.user;
      if (options.interaction.data.options) {
        this.options = options.interaction.data.options.reduce((obj, item) => {
          obj[item.name] = item.value;
          return obj;
        }, {});
        this.optionsArray = options.interaction.data.options;
      } else {
        this.options = {};
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

  static init() {
    return this;
  }

  static description = "No description found";
  static aliases = [];
  static arguments = [];
  static flags = [];
  static requires = [];
  static slashAllowed = true;
  static directAllowed = true;
}

export default Command;