import type { Guild, GuildChannel } from "oceanic.js";
import { commands, disabledCache, disabledCmdCache, messageCommands, prefixCache } from "#utils/collections.js";
import type { Logger } from "#utils/logger.js";
import type { Count, DBGuild, Tag } from "#utils/types.js";

import Postgres from "postgres";
import type { DatabasePlugin } from "#database";
const sql = Postgres(process.env.DB as string, {
  onnotice: () => {}
});

interface Settings {
  id: number;
  version: number;
  broadcast?: string;
};

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
  disabled_commands text ARRAY NOT NULL
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
  "ALTER TABLE settings ADD COLUMN IF NOT EXISTS broadcast text"
];

async function setup() {
  const existingCommands = (await sql<{ command: string; }[]>`SELECT command FROM counts`).map(x => x.command);
  const commandNames = [...commands.keys(), ...messageCommands.keys()];
  for (const command of existingCommands) {
    if (!commandNames.includes(command)) {
      await sql`DELETE FROM counts WHERE command = ${command}`;
    }
  }
  for (const command of commandNames) {
    if (!existingCommands.includes(command)) {
      await sql`INSERT INTO counts ${sql({ command, count: 0 }, "command", "count")}`;
    }
  }
}

async function upgrade(logger: Logger) {
  try {
    await sql.begin(async (sql) => {
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
      } else if (version > latestVersion) {
        throw new Error(`PostgreSQL database is at version ${version}, but this version of the bot only supports up to version ${latestVersion}.`);
      } else {
        return;
      }
      await sql`INSERT INTO settings ${sql({ id: 1, version: latestVersion })} ON CONFLICT (id) DO UPDATE SET version = ${latestVersion}`;
    });
  } catch (e) {
    logger.error(`PostgreSQL migration failed: ${e}`);
    logger.error("Unable to start the bot, quitting now.");
    return 1;
  }
}

export function getGuild(query: string): Promise<DBGuild> {
  return new Promise((resolve) => {
    sql.begin(async (sql) => {
      let [guild]: [DBGuild?] = await sql`SELECT * FROM guilds WHERE guild_id = ${query}`;
      if (!guild) {
        guild = { guild_id: query, prefix: process.env.PREFIX ?? "&", disabled: [], disabled_commands: [] };
        await sql`INSERT INTO guilds ${sql(guild)}`;
      }
      resolve(guild);
    });
  });
}

async function setPrefix(prefix: string, guild: Guild) {
  await sql`UPDATE guilds SET prefix = ${prefix} WHERE guild_id = ${guild.id}`;
  prefixCache.set(guild.id, prefix);
}

async function getTag(guild: string, tag: string) {
  const [tagResult]: [Tag?] = await sql`SELECT * FROM tags WHERE guild_id = ${guild} AND name = ${tag}`;
  return tagResult ? { content: tagResult.content, author: tagResult.author } : undefined;
}

async function getTags(guild: string) {
  const tagArray = await sql<Tag[]>`SELECT * FROM tags WHERE guild_id = ${guild}`;
  const tags = new Map(tagArray.map(tag => [tag.name, { content: tag.content, author: tag.author }]));
  return tags;
}

async function setTag(name: string, content: { content: string, author: string }, guild: Guild) {
  await sql`INSERT INTO tags ${sql({ guild_id: guild.id, name, content: content.content, author: content.author }, "guild_id", "name", "content", "author")}`;
}

async function editTag(name: string, content: { content: string, author: string }, guild: Guild) {
  await sql`UPDATE tags SET content = ${content.content}, author = ${content.author} WHERE guild_id = ${guild.id} AND name = ${name}`;
}

async function removeTag(name: string, guild: Guild) {
  await sql`DELETE FROM tags WHERE guild_id = ${guild.id} AND name = ${name}`;
}

async function setBroadcast(msg: string | null) {
  await sql`UPDATE settings SET broadcast = ${msg} WHERE id = 1`;
}

async function getBroadcast() {
  const result = await sql<Settings[]>`SELECT broadcast FROM settings WHERE id = 1`;
  return result[0].broadcast;
}

async function disableCommand(guild: string, command: string) {
  const guildDB = await getGuild(guild);
  await sql`UPDATE guilds SET disabled_commands = ${(guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command]).filter((v) => !!v)} WHERE guild_id = ${guild}`;
  disabledCmdCache.set(guild, guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command].filter((v) => !!v));
}

async function enableCommand(guild: string, command: string) {
  const guildDB = await getGuild(guild);
  const newDisabled = guildDB.disabled_commands ? guildDB.disabled_commands.filter(item => item !== command) : [];
  await sql`UPDATE guilds SET disabled_commands = ${newDisabled} WHERE guild_id = ${guild}`;
  disabledCmdCache.set(guild, newDisabled);
}

async function disableChannel(channel: GuildChannel) {
  const guildDB = await getGuild(channel.guildID);
  await sql`UPDATE guilds SET disabled_commands = ${[...guildDB.disabled, channel.id]} WHERE guild_id = ${channel.guildID}`;
  disabledCache.set(channel.guildID, [...guildDB.disabled, channel.id]);
}

async function enableChannel(channel: GuildChannel) {
  const guildDB = await getGuild(channel.guildID);
  const newDisabled = guildDB.disabled.filter(item => item !== channel.id);
  await sql`UPDATE guilds SET disabled_commands = ${newDisabled} WHERE guild_id = ${channel.guildID}`;
  disabledCache.set(channel.guildID, newDisabled);
}

async function getCounts() {
  const counts = await sql<Count[]>`SELECT * FROM counts`;
  const countMap = new Map(counts.map(val => [val.command, val.count]));
  return countMap;
}

async function addCount(command: string) {
  await sql`INSERT INTO counts ${sql({ command, count: 1 }, "command", "count")} ON CONFLICT (command) DO UPDATE SET count = counts.count + 1 WHERE counts.command = ${command}`;
}

async function stop() {
  await sql.end();
}

export default {
  setup,
  stop,
  upgrade,
  addCount,
  getCounts,
  disableCommand,
  enableCommand,
  disableChannel,
  enableChannel,
  getTag,
  getTags,
  setTag,
  removeTag,
  editTag,
  setBroadcast,
  getBroadcast,
  setPrefix,
  getGuild
} as DatabasePlugin;
