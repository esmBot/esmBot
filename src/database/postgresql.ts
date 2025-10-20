import process from "node:process";
import type { Guild, GuildChannel } from "oceanic.js";
import Postgres from "postgres";
import {
  commands,
  disabledCache,
  disabledCmdCache,
  messageCommands,
  prefixCache,
  userCommands,
} from "#utils/collections.js";
import logger from "#utils/logger.js";
import type { Count, DBGuild, Tag } from "#utils/types.js";
import type { DatabasePlugin } from "../database.ts";

interface Settings {
  id: number;
  version: number;
  broadcast?: string;
}

const settingsSchema = `
CREATE TABLE IF NOT EXISTS settings (
  id smallint PRIMARY KEY,
  version integer NOT NULL, CHECK(id = 1)
);
`;

const schema = `
ALTER TABLE settings ADD COLUMN broadcast text;
CREATE TABLE guilds (
  guild_id VARCHAR(30) NOT NULL PRIMARY KEY,
  prefix VARCHAR(15) NOT NULL,
  disabled text ARRAY NOT NULL,
  disabled_commands text ARRAY NOT NULL,
  tag_roles VARCHAR(30) ARRAY DEFAULT array[]::varchar[] NOT NULL
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
`;

const updates = [
  "", // reserved
  "CREATE TABLE IF NOT EXISTS settings ( id smallint PRIMARY KEY, version integer NOT NULL, CHECK(id = 1) );\nALTER TABLE guilds ADD COLUMN accessed timestamp;",
  "ALTER TABLE guilds DROP COLUMN accessed",
  "ALTER TABLE settings ADD COLUMN IF NOT EXISTS broadcast text",
  "ALTER TABLE guilds ADD COLUMN IF NOT EXISTS tag_roles VARCHAR(30) ARRAY DEFAULT array[]::varchar[] NOT NULL",
  `WITH cmds AS (
     SELECT sum("count") AS amount FROM counts WHERE command IN ('qrcreate', 'qrread', 'qr')
  ) INSERT INTO counts ("command", "count") VALUES ('qr', (SELECT amount FROM cmds))
  ON CONFLICT ("command") DO UPDATE SET "count" = (SELECT amount FROM cmds);
  WITH cmds AS (
    SELECT sum("count") AS amount FROM counts WHERE command IN (
      '9gag', 'avs4you', 'bandicam', 'deviantart', 'funky',
		  'hypercam', 'ifunny', 'kinemaster', 'memecenter',
		  'powerdirector', 'shutterstock', 'watermark'
    )
  ) INSERT INTO counts ("command", "count") VALUES ('watermark', (SELECT amount FROM cmds))
  ON CONFLICT ("command") DO UPDATE SET "count" = (SELECT amount FROM cmds);`,
];

export default class PostgreSQLPlugin implements DatabasePlugin {
  sql: Postgres.Sql;

  constructor(connectString: string) {
    this.sql = Postgres(connectString, {
      onnotice: () => {},
    });
  }

  async setup() {
    const existingCommands = (await this.sql<{ command: string }[]>`SELECT command FROM counts`).map((x) => x.command);
    const commandNames = [...commands.keys(), ...messageCommands.keys(), ...userCommands.keys()];
    for (const command of commandNames) {
      if (!existingCommands.includes(command)) {
        await this.sql`INSERT INTO counts ${this.sql({ command, count: 0 }, "command", "count")}`;
      }
    }
  }

  async upgrade() {
    try {
      await this.sql.begin(async (sql) => {
        await sql.unsafe(settingsSchema);
        let version: number;
        const [settingsrow]: [Settings?] = await sql`SELECT version FROM settings WHERE id = 1`;
        if (!settingsrow) {
          version = 0;
        } else {
          version = settingsrow.version;
        }
        const latestVersion = updates.length - 1;
        if (version === 0) {
          logger.info("Initializing PostgreSQL database...");
          await sql.unsafe(schema);
        } else if (version < latestVersion) {
          logger.info(`Migrating PostgreSQL database, which is currently at version ${version}...`);
          while (version < latestVersion) {
            version++;
            logger.info(`Running version ${version} update script...`);
            await sql.unsafe(updates[version]);
          }
        } else {
          return;
        }
        await sql`INSERT INTO settings ${sql({ id: 1, version: latestVersion })} ON CONFLICT (id) DO UPDATE SET version = ${latestVersion}`;
      });
    } catch (err) {
      logger.error(`PostgreSQL migration failed: ${(err as Error).stack || err}`);
      logger.error("Unable to start the bot, quitting now.");
      return 1;
    }
  }

  getGuild(query: string): Promise<DBGuild> {
    return new Promise((resolve) => {
      this.sql.begin(async (sql) => {
        let [guild]: [DBGuild?] = await sql`SELECT * FROM guilds WHERE guild_id = ${query}`;
        if (!guild) {
          guild = {
            guild_id: query,
            prefix: process.env.PREFIX ?? "&",
            disabled: [],
            disabled_commands: [],
            tag_roles: [],
          };
          await sql`INSERT INTO guilds ${sql(guild)}`;
        }
        resolve(guild);
      });
    });
  }

  async setPrefix(prefix: string, guild: Guild) {
    await this.sql`UPDATE guilds SET prefix = ${prefix} WHERE guild_id = ${guild.id}`;
    prefixCache.set(guild.id, prefix);
  }

  async getTag(guild: string, tag: string) {
    const [tagResult]: [Tag?] = await this.sql`SELECT * FROM tags WHERE guild_id = ${guild} AND name = ${tag}`;
    return tagResult;
  }

  async getTags(guild: string) {
    const tagArray = await this.sql<Tag[]>`SELECT * FROM tags WHERE guild_id = ${guild}`;
    const tags: Record<string, Tag> = {};
    for (const tag of tagArray) {
      tags[tag.name] = tag;
    }
    return tags;
  }

  async setTag(tag: Tag, guild: Guild) {
    await this
      .sql`INSERT INTO tags ${this.sql({ guild_id: guild.id, name: tag.name, content: tag.content, author: tag.author }, "guild_id", "name", "content", "author")}`;
  }

  async editTag(tag: Tag, guild: Guild) {
    await this
      .sql`UPDATE tags SET content = ${tag.content}, author = ${tag.author} WHERE guild_id = ${guild.id} AND name = ${tag.name}`;
  }

  async removeTag(name: string, guild: Guild) {
    await this.sql`DELETE FROM tags WHERE guild_id = ${guild.id} AND name = ${name}`;
  }

  async addTagRole(guild: string, role: string) {
    const guildDB = await this.getGuild(guild);
    await this.sql`UPDATE guilds SET tag_roles = ${[...guildDB.tag_roles, role]} WHERE guild_id = ${guild}`;
  }

  async removeTagRole(guild: string, role: string) {
    const guildDB = await this.getGuild(guild);
    await this
      .sql`UPDATE guilds SET tag_roles = ${guildDB.tag_roles.filter((v) => v !== role)} WHERE guild_id = ${guild}`;
  }

  async setBroadcast(msg?: string) {
    await this.sql`UPDATE settings SET broadcast = ${msg ?? null} WHERE id = 1`;
  }

  async getBroadcast() {
    const result = await this.sql<Settings[]>`SELECT broadcast FROM settings WHERE id = 1`;
    return result[0].broadcast;
  }

  async disableCommand(guild: string, command: string) {
    const guildDB = await this.getGuild(guild);
    await this
      .sql`UPDATE guilds SET disabled_commands = ${(guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command]).filter((v) => !!v)} WHERE guild_id = ${guild}`;
    disabledCmdCache.set(
      guild,
      guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command].filter((v) => !!v),
    );
  }

  async enableCommand(guild: string, command: string) {
    const guildDB = await this.getGuild(guild);
    const newDisabled = guildDB.disabled_commands ? guildDB.disabled_commands.filter((item) => item !== command) : [];
    await this.sql`UPDATE guilds SET disabled_commands = ${newDisabled} WHERE guild_id = ${guild}`;
    disabledCmdCache.set(guild, newDisabled);
  }

  async disableChannel(channel: GuildChannel) {
    const guildDB = await this.getGuild(channel.guildID);
    await this
      .sql`UPDATE guilds SET disabled_commands = ${[...guildDB.disabled, channel.id]} WHERE guild_id = ${channel.guildID}`;
    disabledCache.set(channel.guildID, [...guildDB.disabled, channel.id]);
  }

  async enableChannel(channel: GuildChannel) {
    const guildDB = await this.getGuild(channel.guildID);
    const newDisabled = guildDB.disabled.filter((item) => item !== channel.id);
    await this.sql`UPDATE guilds SET disabled_commands = ${newDisabled} WHERE guild_id = ${channel.guildID}`;
    disabledCache.set(channel.guildID, newDisabled);
  }

  async getCounts(all?: boolean) {
    const counts = await this.sql<Count[]>`SELECT * FROM counts`;
    const commandNames = [...commands.keys(), ...messageCommands.keys(), ...userCommands.keys()];
    const countMap = new Map(
      (all ? counts : counts.filter((val) => commandNames.includes(val.command))).map((val) => [
        val.command,
        val.count,
      ]),
    );
    return countMap;
  }

  async addCount(command: string) {
    await this
      .sql`INSERT INTO counts ${this.sql({ command, count: 1 }, "command", "count")} ON CONFLICT (command) DO UPDATE SET count = counts.count + 1 WHERE counts.command = ${command}`;
  }

  async stop() {
    await this.sql.end();
  }
}
