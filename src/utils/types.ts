import type { ApplicationCommandOptions, Constants } from "oceanic.js";

export interface DBGuild {
  guild_id: string;
  prefix: string;
  disabled: string[];
  disabled_commands: string[];
}

export type Tag = {
  name: string;
  content: string;
  author: string;
};

export interface Count {
  command: string;
  count: number;
};

export interface CommandsConfig {
  types: {
    classic: boolean,
    application: boolean
  },
  blacklist: string[]
}

export type CommandType = "classic" | "application";

export type ExtendedCommandOptions = {
  classic?: boolean;
} & ApplicationCommandOptions;

export type Param = {
  name: string;
  desc: string;
  params: Param[];
} | string;

export type CommandInfo = {
  category: string;
  description: string;
  aliases: string[];
  params: Param[];
  flags: ExtendedCommandOptions[];
  slashAllowed: boolean;
  directAllowed: boolean;
  userAllowed: boolean;
  adminOnly: boolean;
  type: Constants.ApplicationCommandTypes;
};

export type ImageParams = {
  cmd: string;
  params: {
    /*data?: ArrayBuffer;
    type?: string;*/
    [key: string]: string | number | boolean;
  };
  input: {
    data?: ArrayBuffer;
    type?: string;
  };
  id: string;
  path: string;
  url: string;
  name: string;
  onlyAnim: boolean;
  ephemeral?: boolean;
  spoiler?: boolean;
  token?: string;
};

export type ImageTypeData = {
  url?: string;
  type?: string;
};

export function isError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}