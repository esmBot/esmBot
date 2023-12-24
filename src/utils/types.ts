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

export function isError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}