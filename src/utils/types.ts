import type { ApplicationCommandOptions, Client, CombinedApplicationCommandOption, Constants } from "oceanic.js";
import type Command from "#cmd-classes/command.js";
import type { DatabasePlugin } from "../database.ts";

export interface DBGuild {
  guild_id: string;
  prefix: string;
  disabled: string[];
  disabled_commands: string[];
  tag_roles: string[];
}

export interface Tag {
  name: string;
  content: string;
  author: string;
}

export interface Count {
  command: string;
  count: number;
}

export interface CommandsConfig {
  types: {
    classic: boolean;
    application: boolean;
  };
  blacklist: string[];
}

export type ExtCommand = {
  baseCommand: boolean;
  category: string;
  params: Param[];
  type: Constants.ApplicationCommandTypes;
} & typeof Command;

export type CommandType = "classic" | "application";
export type CommandFlagType =
  | "subcommand"
  | "string"
  | "integer"
  | "boolean"
  | "user"
  | "channel"
  | "role"
  | "mentionable"
  | "number"
  | "attachment";

export type ExtendedCommandOptions = {
  classic?: boolean;
} & ApplicationCommandOptions;

export type ExtendedConstructedCommandOptions = {
  type: Constants.ApplicationCommandOptionTypes | CommandFlagType;
  classic?: boolean;
} & Omit<CombinedApplicationCommandOption, "type">;

export type Param =
  | {
      name: string;
      desc: string;
      params: Param[];
    }
  | string;

export interface MediaParams {
  cmd: string;
  type: "image";
  params: {
    [key: string]: string | number | boolean;
  };
  input?: {
    data?: ArrayBuffer;
    type?: string;
  };
  id: string;
  path?: string;
  url?: string;
  name?: string;
  onlyAnim?: boolean;
  ephemeral?: boolean;
  spoiler?: boolean;
  token?: string;
}

export interface MediaTypeData {
  url?: string;
  type?: string;
  mediaType?: MediaParams["type"];
}

export interface MediaFormats {
  image?: {
    [cmd: string]: string[];
  };
}

export interface MediaFuncs {
  image?: string[];
}

export interface SearXNGResults {
  query: string;
  results: {
    author?: string;
    img_src?: string;
    title: string;
    url: string;
  }[];
}

export interface EventParams {
  client: Client;
  database: DatabasePlugin | undefined;
}

export function isError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
