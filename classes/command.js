class Command {
  constructor(client, cluster, ipc, message, args, content, specialArgs) {
    this.client = client;
    this.cluster = cluster;
    this.ipc = ipc;
    this.message = message;
    this.args = args;
    this.content = content;
    this.specialArgs = specialArgs;
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
  }

  async run() {
    return "It works!";
  }

  static description = "No description found";
  static aliases = [];
  static arguments = [];
  static requires = [];
}

module.exports = Command;