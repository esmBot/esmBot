import {
  type AllowedMentions,
  type AnyTextableChannel,
  type ApplicationCommandOptions,
  type Client,
  type CommandInteraction,
  Constants,
  type CreateMessageOptions,
  type Guild,
  type InteractionContent,
  type Locale,
  type Member,
  type Message,
  type MessageReference,
  Permission,
  TextableChannel,
  type Uncached,
  type User,
} from "oceanic.js";
import { getString } from "#utils/i18n.js";
import { cleanInteraction, cleanMessage } from "#utils/misc.js";
import type { CommandType } from "#utils/types.js";
import type { DatabasePlugin } from "../database.js";

type CommandOptionsClassic = {
  type: "classic";
  cmdName: string;
  args: string[];
  message: Message<Uncached | AnyTextableChannel>;
  content: string;
  specialArgs: {
    [key: string]: string | boolean | number;
  };
  locale?: Locale;
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

  database?: DatabasePlugin;
  message?: Message;
  interaction?: CommandInteraction;
  channel: AnyTextableChannel | ({ guildID?: string } & Uncached);
  guild: Guild | null;
  member?: Member | null;
  content?: string;
  reference?: { messageReference: MessageReference; allowedMentions: AllowedMentions };
  private options?: { [key: string]: string | number | boolean } | null;

  constructor(client: Client, database: DatabasePlugin | undefined, options: CommandOptions) {
    this.client = client;
    this.database = database;
    this.origOptions = options;
    this.type = options.type;
    this.success = true;
    this.edit = false;
    if (options.type === "classic") {
      this.message = options.message;
      this.args = options.args;
      this.locale = options.locale ?? (process.env.LOCALE as Locale) ?? "en-US";
      this.cmdName = options.cmdName;
      this.channel = options.message.channel ?? {
        id: options.message.channelID,
        guildID: options.message.guildID ?? undefined,
      };
      this.guild = options.message.guild;
      this.author = options.message.author;
      this.member = options.message.member;
      if (this.channel instanceof TextableChannel) {
        this.permissions = this.channel.permissionsOf(client.user.id);
      } else {
        this.permissions = new Permission(Constants.AllPermissions);
      }
      this.memberPermissions = this.member?.permissions ?? new Permission(Constants.AllPermissions);
      this.content = options.content;
      this.options = options.specialArgs;
      this.reference = {
        messageReference: {
          channelID: this.message.channelID,
          messageID: this.message.id,
          guildID: this.message.guildID ?? undefined,
          failIfNotExists: false,
        },
        allowedMentions: {
          repliedUser: false,
        },
      };
    } else {
      this.interaction = options.interaction;
      this.locale = options.interaction.locale as Locale;
      this.cmdName = options.interaction.data.name;
      this.args = [];
      this.channel = options.interaction.channel ?? {
        id: options.interaction.channelID,
        guildID: options.interaction.guildID ?? undefined,
      };
      if (
        !options.interaction.authorizingIntegrationOwners ||
        options.interaction.authorizingIntegrationOwners[0] !== undefined
      ) {
        this.guild = options.interaction.guild;
      } else {
        this.guild = null;
      }
      this.author = options.interaction.user;
      this.member = options.interaction.member;
      this.permissions = options.interaction.appPermissions;
      this.memberPermissions = options.interaction.memberPermissions ?? new Permission(Constants.AllPermissions);
    }
  }

  /**
   * The main command function.
   */
  async run(): Promise<string | InteractionContent | CreateMessageOptions | undefined> {
    return "It works!";
  }

  async acknowledge() {
    if (this.type === "classic" && this.message) {
      await this.client.rest.channels.sendTyping(this.message.channelID);
    }
  }

  getString(key: string, params?: { returnNull?: false; params?: { [key: string]: string } }): string;
  getString(key: string, params: { returnNull: boolean; params?: { [key: string]: string } }): string | undefined;
  getString(key: string, params?: { returnNull?: boolean; params?: { [key: string]: string } }): string | undefined {
    return getString(key, {
      locale: this.locale,
      returnNull: params?.returnNull ?? false,
      ...params,
    });
  }

  getOptionString(key: string): string | undefined {
    if (this.type === "classic") {
      return this.options?.[key] as string;
    }
    if (this.type === "application") {
      return this.interaction?.data.options.getString(key);
    }
    throw Error("Unknown command type");
  }

  getOptionBoolean(key: string): boolean | undefined {
    if (this.type === "classic") {
      return !!this.options?.[key];
    }
    if (this.type === "application") {
      return this.interaction?.data.options.getBoolean(key);
    }
    throw Error("Unknown command type");
  }

  getOptionNumber(key: string): number | undefined {
    if (this.type === "classic") {
      return Number.parseFloat(this.options?.[key] as string);
    }
    if (this.type === "application") {
      return this.interaction?.data.options.getNumber(key);
    }
    throw Error("Unknown command type");
  }

  getOptionInteger(key: string): number | undefined {
    if (this.type === "classic") {
      return Number.parseInt(this.options?.[key] as string);
    }
    if (this.type === "application") {
      return this.interaction?.data.options.getInteger(key);
    }
    throw Error("Unknown command type");
  }

  getOptionUser(key: string): User | undefined {
    if (this.type === "classic") {
      const id = this.options?.[key] as string;
      return this.client.users.get(id);
    }
    if (this.type === "application") {
      return this.interaction?.data.options.getUser(key);
    }
    throw Error("Unknown command type");
  }

  getOptionMember(key: string): Member | undefined {
    if (this.type === "classic") {
      const id = this.options?.[key] as string;
      return this.guild?.members.get(id);
    }
    if (this.type === "application") {
      return this.interaction?.data.options.getMember(key);
    }
    throw Error("Unknown command type");
  }

  clean(text: string) {
    if (this.message) {
      return cleanMessage(this.message, text);
    }
    if (this.interaction) {
      return cleanInteraction(this.interaction, text);
    }
    throw Error("Unknown command type");
  }

  static init() {
    return this;
  }

  static postInit<T extends typeof Command>(this: T): T {
    return this;
  }

  static description = "No description found";
  static aliases: string[] = [];
  static flags: ({ classic?: boolean } & ApplicationCommandOptions)[] = [];
  static ephemeral = false;
  static dbRequired = false;
  static slashAllowed = true;
  static directAllowed = true;
  static userAllowed = true;
  static adminOnly = false;
}

export default Command;
