// wrapper for the database drivers in ./database/
import "dotenv/config";
import process from "node:process";
import type { Guild, GuildChannel } from "oceanic.js";
import detectRuntime from "#utils/detectRuntime.js";
import logger from "#utils/logger.js";
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
  disableChannel: (channel: GuildChannel) => Promise<void>;
  enableChannel: (channel: GuildChannel) => Promise<void>;
  getTag: (guild: string, tag: string) => Promise<Tag | undefined>;
  getTags: (guild: string) => Promise<Record<string, Tag>>;
  setTag: (tag: Tag, guild: Guild) => Promise<void>;
  removeTag: (name: string, guild: Guild) => Promise<void>;
  editTag: (tag: Tag, guild: Guild) => Promise<void>;
  addTagRole: (guild: string, role: string) => Promise<void>;
  removeTagRole: (guild: string, role: string) => Promise<void>;
  setBroadcast: (msg?: string) => Promise<void>;
  getBroadcast: () => Promise<string | undefined>;
  setPrefix: (prefix: string, guild: Guild) => Promise<void>;
  getGuild: (query: string) => Promise<DBGuild>;
}

export async function init(): Promise<DatabasePlugin | undefined> {
  if (process.env.DB && process.env.DB.length !== 0) {
    const dbtype = process.env.DB.split("://")[0];
    try {
      const construct = (await import(`./database/${dbtype}.${detectRuntime().tsLoad ? "ts" : "js"}`)).default;
      return new construct(process.env.DB);
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
