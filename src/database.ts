// wrapper for the database drivers in ./database/
import "dotenv/config";
import { Logger } from "#utils/logger.js";
import { Guild, GuildChannel } from "oceanic.js";
import { DBGuild, isError } from "#utils/types.js";

interface DatabasePlugin {
  setup: () => Promise<void>;
  stop: () => Promise<void>;
  upgrade: (logger: Logger) => Promise<number>;
  addCount: (command: string) => Promise<void>;
  getCounts: () => Promise<Map<string, number>>;
  disableCommand: (guild: string, command: string) => Promise<void>;
  enableCommand: (guild: string, command: string) => Promise<void>;
  disableChannel: (channel: GuildChannel) => Promise<void>;
  enableChannel: (channel: GuildChannel) => Promise<void>;
  getTag: (guild: string, tag: string) => Promise<{ content: string, author: string } | undefined>;
  getTags: (guild: string) => Promise<Map<string, { content: string, author: string }>>;
  setTag: (name: string, content: { content: string, author: string }, guild: Guild) => Promise<void>;
  removeTag: (name: string, guild: Guild) => Promise<void>;
  editTag: (name: string, content: { content: string, author: string }, guild: Guild) => Promise<void>;
  setBroadcast: (msg: string) => Promise<void>;
  getBroadcast: () => Promise<string | null>;
  setPrefix: (prefix: string, guild: Guild) => Promise<void>;
  getGuild: (query: string) => Promise<DBGuild>;
}

let db = null;

if (process.env.DB) {
  const dbtype = process.env.DB.split("://")[0];
  try {
    db = await import(`./database/${dbtype}.js`);
  } catch (error) {
    if (isError(error) && error.code === "ERR_MODULE_NOT_FOUND") {
      console.error(`DB config option has unknown database type '${dbtype}'`);
    }
    throw error;
  }
}

export default db as DatabasePlugin | null;
