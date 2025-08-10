import type { ApplicationCommandOptions, Client, Constants } from "oceanic.js";
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

type ValueOrNested<T> = T | { [x: string]: ValueOrNested<T> };

export type CommandEntry = Record<string, ValueOrNested<typeof Command>>;

export type CommandType = "classic" | "application";

export type ExtendedCommandOptions = {
  classic?: boolean;
} & ApplicationCommandOptions;

export type Param =
  | {
      name: string;
      desc: string;
      params: Param[];
    }
  | string;

export interface CommandInfo {
  category: string;
  description: string;
  aliases: string[];
  params: Param[];
  flags: ExtendedCommandOptions[];
  slashAllowed: boolean;
  directAllowed: boolean;
  userAllowed: boolean;
  baseCommand: boolean;
  adminOnly: boolean;
  type: Constants.ApplicationCommandTypes;
}

export interface ImageParams {
  cmd: string;
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

export interface ImageTypeData {
  url?: string;
  type?: string;
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
