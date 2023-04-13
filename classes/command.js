import { Constants } from "oceanic.js";

class Command {
  success = true;
  constructor(client, options) {
    this.client = client;
    this.origOptions = options;
    this.type = options.type;
    this.args = options.args;
    if (options.type === "classic") {
      this.message = options.message;
      this.channel = options.message.channel;
      this.guild = options.message.guild;
      this.author = options.message.author;
      this.member = options.message.member;
      this.permissions = this.channel ? this.channel.permissionsOf(client.user.id.toString()) : Constants.AllTextPermissions;
      this.content = options.content;
      this.options = options.specialArgs;
      this.reference = {
        messageReference: {
          channelID: this.message.channelID,
          messageID: this.message.id,
          guildID: this.message.guildID ?? undefined,
          failIfNotExists: false
        },
        allowedMentions: {
          repliedUser: false
        }
      };
    } else if (options.type === "application") {
      this.interaction = options.interaction;
      this.args = [];
      this.channel = options.interaction.channel ?? { id: options.interaction.channelID };
      this.guild = options.interaction.guild;
      this.author = this.member = options.interaction.guildID ? options.interaction.member : options.interaction.user;
      this.permissions = options.interaction.appPermissions;
      if (options.interaction.data.options) {
        this.options = options.interaction.data.options.raw.reduce((obj, item) => {
          obj[item.name] = item.value;
          return obj;
        }, {});
        this.optionsArray = options.interaction.data.options.raw;
      } else {
        this.options = {};
      }
    }
  }

  async run() {
    return "It works!";
  }

  async acknowledge(flags) {
    if (this.type === "classic") {
      const channel = this.channel ?? await this.client.rest.channels.get(this.message.channelID);
      await channel.sendTyping();
    } else if (!this.interaction.acknowledged) {
      await this.interaction.defer(flags);
    }
  }

  static init() {
    return this;
  }

  static description = "No description found";
  static aliases = [];
  static arguments = [];
  static flags = [];
  static slashAllowed = true;
  static directAllowed = true;
  static adminOnly = false;
}

export default Command;