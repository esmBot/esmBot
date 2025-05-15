import type { Database as BunDatabase, Statement as BunStatement } from "bun:sqlite";
import type {
  Database as BSQLite3Database,
  Options as BSQLite3Options,
  Statement as BSQLite3Statement,
} from "better-sqlite3";
import type { Guild, GuildChannel } from "oceanic.js";
import type { DatabasePlugin } from "../database.js";
import { commands, disabledCache, disabledCmdCache, messageCommands, prefixCache } from "#utils/collections.js";
import logger from "#utils/logger.js";
import type { Count, DBGuild, Tag } from "#utils/types.js";

// bun:sqlite is mostly compatible with better-sqlite3, but has a few minor type differences that don't really matter in our case
// here we attempt to bring the two closer together
type CombinedConnection = {
  prepare: (query: string) => BSQLite3Statement | BunStatement;
  transaction: (func: () => void) => CallableFunction;
} & (BSQLite3Database | BunDatabase);

type BSQLite3Init = (filename?: string, options?: BSQLite3Options) => BSQLite3Database;
type CombinedConstructor = typeof BunDatabase | BSQLite3Init;
let dbInit: CombinedConstructor;

if (process.versions.bun) {
  const { Database } = await import("bun:sqlite");
  dbInit = Database;
} else {
  const { default: sqlite3 } = await import("better-sqlite3");
  dbInit = sqlite3;
}

const schema = `
CREATE TABLE guilds (
  guild_id VARCHAR(30) NOT NULL PRIMARY KEY,
  prefix VARCHAR(15) NOT NULL,
  disabled text NOT NULL,
  disabled_commands text NOT NULL
);
CREATE TABLE counts (
  command VARCHAR NOT NULL PRIMARY KEY,
  count integer NOT NULL
);
CREATE TABLE tags (
  guild_id VARCHAR(30) NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  author VARCHAR(30) NOT NULL,
  UNIQUE(guild_id, name)
);
CREATE TABLE settings (
  id smallint PRIMARY KEY,
  broadcast VARCHAR,
  CHECK(id = 1)
);
INSERT INTO settings (id) VALUES (1);
`;

const updates = [
  "", // reserved
  "ALTER TABLE guilds ADD COLUMN accessed int",
  "ALTER TABLE guilds DROP COLUMN accessed",
  `CREATE TABLE settings (
    id smallint PRIMARY KEY,
    broadcast VARCHAR,
    CHECK(id = 1)
  );
  INSERT INTO settings (id) VALUES (1);`,
];

export default class SQLitePlugin implements DatabasePlugin {
  connection: CombinedConnection;

  constructor(connectString: string) {
    if (process.versions.bun) {
      this.connection = new (dbInit as typeof BunDatabase)(connectString.replace("sqlite://", ""), {
        create: true,
        readwrite: true,
        strict: true,
      });
    } else {
      this.connection = (dbInit as BSQLite3Init)(connectString.replace("sqlite://", ""));
    }
  }

  async setup() {
    const existingCommands = (this.connection.prepare("SELECT command FROM counts").all() as { command: string }[]).map(
      (x) => x.command,
    );
    const commandNames = [...commands.keys(), ...messageCommands.keys()];
    for (const command of commandNames) {
      if (!existingCommands.includes(command)) {
        this.connection.prepare("INSERT INTO counts (command, count) VALUES (?, ?)").run(command, 0);
      }
    }
  }

  async stop() {
    this.connection.close();
  }

  async upgrade() {
    if (process.versions.bun) {
      (this.connection as BunDatabase).exec("PRAGMA journal_mode = WAL;");
    } else {
      (this.connection as BSQLite3Database).pragma("journal_mode = WAL");
    }
    try {
      this.connection.transaction(() => {
        let version: number;
        if (process.versions.bun) {
          const result = (this.connection as BunDatabase)
            .prepare<{ user_version: number }, []>("PRAGMA user_version")
            .get();
          version = result?.user_version ?? 0;
        } else {
          version = (this.connection as BSQLite3Database).pragma("user_version", { simple: true }) as number;
        }
        const latestVersion = updates.length - 1;
        if (version === 0) {
          logger.info("Initializing SQLite database...");
          this.connection.exec(schema);
        } else if (version < latestVersion) {
          logger.info(`Migrating SQLite database at ${process.env.DB}, which is currently at version ${version}...`);
          while (version < latestVersion) {
            version++;
            logger.info(`Running version ${version} update script...`);
            this.connection.exec(updates[version]);
          }
        } else if (version > latestVersion) {
          throw new Error(
            `SQLite database is at version ${version}, but this version of the bot only supports up to version ${latestVersion}.`,
          );
        }
        // prepared statements don't seem to work here
        if (process.versions.bun) {
          this.connection.exec(`PRAGMA user_version = ${latestVersion}`);
        } else {
          (this.connection as BSQLite3Database).pragma(`user_version = ${latestVersion}`);
        }
      })();
    } catch (e) {
      logger.error(`SQLite migration failed: ${e}`);
      logger.error("Unable to start the bot, quitting now.");
      return 1;
    }
  }

  async addCount(command: string) {
    this.connection.prepare("UPDATE counts SET count = count + 1 WHERE command = ?").run(command);
  }

  async getCounts(all?: boolean) {
    const counts = this.connection.prepare("SELECT * FROM counts").all() as Count[];
    const commandNames = [...commands.keys(), ...messageCommands.keys()];
    const countMap = new Map(
      (all ? counts : counts.filter((val) => commandNames.includes(val.command))).map((val) => [
        val.command,
        val.count,
      ]),
    );
    return countMap;
  }

  async disableCommand(guild: string, command: string) {
    const guildDB = await this.getGuild(guild);
    this.connection
      .prepare("UPDATE guilds SET disabled_commands = ? WHERE guild_id = ?")
      .run(
        JSON.stringify(
          (guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command]).filter((v) => !!v),
        ),
        guild,
      );
    disabledCmdCache.set(
      guild,
      guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command].filter((v) => !!v),
    );
  }

  async enableCommand(guild: string, command: string) {
    const guildDB = await this.getGuild(guild);
    const newDisabled = guildDB.disabled_commands ? guildDB.disabled_commands.filter((item) => item !== command) : [];
    this.connection
      .prepare("UPDATE guilds SET disabled_commands = ? WHERE guild_id = ?")
      .run(JSON.stringify(newDisabled), guild);
    disabledCmdCache.set(guild, newDisabled);
  }

  async disableChannel(channel: GuildChannel) {
    const guildDB = await this.getGuild(channel.guildID);
    this.connection
      .prepare("UPDATE guilds SET disabled = ? WHERE guild_id = ?")
      .run(JSON.stringify([...guildDB.disabled, channel.id]), channel.guildID);
    disabledCache.set(channel.guildID, [...guildDB.disabled, channel.id]);
  }

  async enableChannel(channel: GuildChannel) {
    const guildDB = await this.getGuild(channel.guildID);
    const newDisabled = guildDB.disabled.filter((item: string) => item !== channel.id);
    this.connection
      .prepare("UPDATE guilds SET disabled = ? WHERE guild_id = ?")
      .run(JSON.stringify(newDisabled), channel.guildID);
    disabledCache.set(channel.guildID, newDisabled);
  }

  async getTag(guild: string, tag: string) {
    const tagResult = this.connection.prepare("SELECT * FROM tags WHERE guild_id = ? AND name = ?").get(guild, tag) as
      | Tag
      | undefined;
    return tagResult;
  }

  async getTags(guild: string) {
    const tagArray = this.connection.prepare("SELECT * FROM tags WHERE guild_id = ?").all(guild) as Tag[];
    const tags: Record<string, Tag> = {};
    for (const tag of tagArray) {
      tags[tag.name] = tag;
    }
    return tags;
  }

  async setTag(tag: Tag, guild: Guild) {
    const tagData = {
      guild_id: guild.id,
      name: tag.name,
      content: tag.content,
      author: tag.author,
    };
    this.connection
      .prepare("INSERT INTO tags (guild_id, name, content, author) VALUES (@guild_id, @name, @content, @author)")
      .run(tagData);
  }

  async removeTag(name: string, guild: Guild) {
    this.connection.prepare("DELETE FROM tags WHERE guild_id = ? AND name = ?").run(guild.id, name);
  }

  async editTag(tag: Tag, guild: Guild) {
    this.connection
      .prepare("UPDATE tags SET content = ?, author = ? WHERE guild_id = ? AND name = ?")
      .run(tag.content, tag.author, guild.id, tag.name);
  }

  async setBroadcast(msg?: string) {
    this.connection.prepare("UPDATE settings SET broadcast = ? WHERE id = 1").run(msg);
  }

  async getBroadcast() {
    const result = this.connection.prepare("SELECT broadcast FROM settings WHERE id = 1").get() as {
      broadcast: string | undefined;
    };
    return result.broadcast;
  }

  async setPrefix(prefix: string, guild: Guild) {
    this.connection.prepare("UPDATE guilds SET prefix = ? WHERE guild_id = ?").run(prefix, guild.id);
    prefixCache.set(guild.id, prefix);
  }

  async getGuild(query: string): Promise<DBGuild> {
    let guild: DBGuild | undefined;
    this.connection.transaction(() => {
      guild = this.connection.prepare("SELECT * FROM guilds WHERE guild_id = ?").get(query) as DBGuild;
      if (!guild) {
        const guild_id = query;
        const prefix = process.env.PREFIX ?? "&";
        this.connection
          .prepare(
            "INSERT INTO guilds (guild_id, prefix, disabled, disabled_commands) VALUES (@guild_id, @prefix, @disabled, @disabled_commands)",
          )
          .run({
            guild_id,
            prefix,
            disabled: "[]",
            disabled_commands: "[]",
          });
        guild = {
          guild_id,
          prefix,
          disabled: [],
          disabled_commands: [],
        };
      }
    })();
    return (
      guild ?? {
        guild_id: query,
        prefix: process.env.PREFIX ?? "&",
        disabled: [],
        disabled_commands: [],
      }
    );
  }
}
