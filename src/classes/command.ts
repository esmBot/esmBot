import {
  Constants,
  Permission,
  type AllowedMentions,
  type AnyInteractionChannel,
  type ApplicationCommandOptions,
  type Client,
  type CommandInteraction,
  type CreateMessageOptions,
  type Guild,
  type InteractionContent,
  type Locale,
  type Member,
  type Message,
  type MessageReference,
  type Uncached,
  type User
} from "oceanic.js";
import { getString } from "../utils/i18n.js";

type CommandType = "classic" | "application";

type CommandOptionsClassic = {
  type: "classic";
  cmdName: string;
  args: string[];
  message: Message;
  content: string;
  specialArgs: object;
};

type CommandOptionsApplication = {
  type: "application";
  interaction: CommandInteraction;
};

export type CommandOptions = CommandOptionsClassic | CommandOptionsApplication;

class Command {
  client: Client;
  origOptions: CommandOptions;
  type: CommandType;
  success: boolean;
  edit: boolean;
  args: string[];
  locale: Locale;
  cmdName: string;
  author: User;
  permissions: Permission;
  memberPermissions: Permission;
  options: object;

  message?: Message;
  interaction?: CommandInteraction;
  channel?: AnyInteractionChannel | Uncached;
  guild?: Guild;
  member?: Member;
  content?: string;
  reference?: { messageReference: MessageReference, allowedMentions: AllowedMentions };
  constructor(client: Client, options: CommandOptions) {
    this.client = client;
    this.origOptions = options;
    this.type = options.type;
    this.success = true;
    this.edit = false;
    if (options.type === "classic") {
      this.message = options.message;
      this.args = options.args;
      this.locale = (process.env.LOCALE as Locale) ?? "en-US";
      this.cmdName = options.cmdName;
      this.channel = options.message.channel;
      this.guild = options.message.guild;
      this.author = options.message.author;
      this.member = options.message.member;
      this.permissions = this.channel.permissionsOf?.(client.user.id) ?? new Permission(Constants.AllPermissions);
      this.memberPermissions = this.member?.permissions ?? new Permission(Constants.AllPermissions);
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
    } else {
      this.interaction = options.interaction;
      this.locale = options.interaction.locale as Locale;
      this.cmdName = options.interaction.data.name;
      this.args = [];
      this.channel = options.interaction.channel ?? { id: options.interaction.channelID, guildID: options.interaction.guildID };
      if (!options.interaction.authorizingIntegrationOwners || options.interaction.authorizingIntegrationOwners[0] !== undefined) {
        this.guild = options.interaction.guild;
      } else {
        this.guild = null;
      }
      this.author = options.interaction.user;
      this.member = options.interaction.member;
      this.permissions = options.interaction.appPermissions;
      this.memberPermissions = options.interaction.memberPermissions ?? new Permission(Constants.AllPermissions);
      this.options = options.interaction.data.options.raw.reduce((obj, item) => {
        obj[item.name] = item.value;
        return obj;
      }, {});
    }
  }

  /**
   * The main command function.
   */
  async run(): Promise<string | InteractionContent | CreateMessageOptions | undefined> {
    return "It works!";
  }

  async acknowledge() {
    if (this.type === "classic") {
      await this.client.rest.channels.sendTyping(this.message.channelID);
    }
  }

  getString(key: string, returnNull = false) {
    return getString(key, this.locale, returnNull);
  }

  static init() {
    return this;
  }

  static postInit<T extends typeof Command>(this: T): T {
    return this;
  }

  static description = "No description found";
  static aliases: string[] = [];
  static flags: ({ classic: boolean } & ApplicationCommandOptions)[] = [];
  static ephemeral = false;
  static slashAllowed = true;
  static directAllowed = true;
  static userAllowed = true;
  static adminOnly = false;
}

export default Command;
