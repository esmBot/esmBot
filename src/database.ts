// wrapper for the database drivers in ./database/
import logger from "#utils/logger.js";
import { detectRuntime, getEnv } from "#utils/runtime.js";
import { type DBGuild, isError, type Tag } from "#utils/types.js";

export declare class DatabasePlugin {
  constructor(connectString: string);
  setup: () => Promise<void>;
  stop: () => Promise<void>;
  upgrade: () => Promise<number | undefined>;
  addCount: (command: string) => Promise<void>;
  getCounts: (all?: boolean) => Promise<Map<string, number>>;
  disableCommand: (guild: string, command: string) => Promise<void>;
  enableCommand: (guild: string, command: string) => Promise<void>;
  disableChannel: (channel: string, guild: string) => Promise<void>;
  enableChannel: (channel: string, guild: string) => Promise<void>;
  getTag: (guild: string, tag: string) => Promise<Tag | undefined>;
  getTags: (guild: string) => Promise<Record<string, Tag>>;
  setTag: (tag: Tag, guild: string) => Promise<void>;
  removeTag: (name: string, guild: string) => Promise<void>;
  editTag: (tag: Tag, guild: string) => Promise<void>;
  addTagRole: (guild: string, role: string) => Promise<void>;
  removeTagRole: (guild: string, role: string) => Promise<void>;
  setBroadcast: (msg?: string) => Promise<void>;
  getBroadcast: () => Promise<string | undefined>;
  setPrefix: (prefix: string, guild: string) => Promise<void>;
  getGuild: (query: string) => Promise<DBGuild>;
}

export async function init(): Promise<DatabasePlugin | undefined> {
  const db = getEnv("DB");
  if (db && db !== "") {
    const dbtype = db.split("://")[0];
    try {
      const construct = (await import(`./database/${dbtype}.${detectRuntime().tsLoad ? "ts" : "js"}`)).default;
      return new construct(db);
    } catch (error) {
      if (isError(error) && error.code === "ERR_MODULE_NOT_FOUND") {
        logger.error(`DB config option has unknown database type '${dbtype}'`);
      }
      throw error;
    }
  } else {
    logger.warn("No database configured, running in stateless mode...");
    return;
  }
}
