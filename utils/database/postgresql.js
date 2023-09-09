import { prefixCache, disabledCmdCache, disabledCache, commands, messageCommands } from "../collections.js";

import Postgres from "postgres";
const sql = Postgres(process.env.DB, {
  onnotice: () => {}
});

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

export async function setup() {
  const existingCommands = (await sql`SELECT command FROM counts`).map(x => x.command);
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

export async function upgrade(logger) {
  try {
    await sql.begin(async (sql) => {
      await sql.unsafe(settingsSchema);
      let version;
      const settingsrow = (await sql`SELECT version FROM settings WHERE id = 1`);
      if (settingsrow.length === 0) {
        version = 0;
      } else {
        version = settingsrow[0].version;
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

export async function getGuild(query) {
  let guild;
  await sql.begin(async (sql) => {
    guild = (await sql`SELECT * FROM guilds WHERE guild_id = ${query}`)[0];
    if (guild === undefined) {
      guild = { guild_id: query, prefix: process.env.PREFIX, disabled: [], disabled_commands: [] };
      await sql`INSERT INTO guilds ${sql(guild)}`;
    }
  });
  return guild;
}

export async function setPrefix(prefix, guild) {
  await sql`UPDATE guilds SET prefix = ${prefix} WHERE guild_id = ${guild.id}`;
  prefixCache.set(guild.id, prefix);
}

export async function getTag(guild, tag) {
  const tagResult = await sql`SELECT * FROM tags WHERE guild_id = ${guild} AND name = ${tag}`;
  return tagResult[0] ? { content: tagResult[0].content, author: tagResult[0].author } : undefined;
}

export async function getTags(guild) {
  const tagArray = await sql`SELECT * FROM tags WHERE guild_id = ${guild}`;
  const tags = {};
  for (const tag of tagArray) {
    tags[tag.name] = { content: tag.content, author: tag.author };
  }
  return tags;
}

export async function setTag(name, content, guild) {
  await sql`INSERT INTO tags ${sql({ guild_id: guild.id, name, content: content.content, author: content.author }, "guild_id", "name", "content", "author")}`;
}

export async function editTag(name, content, guild) {
  await sql`UPDATE tags SET content = ${content.content}, author = ${content.author} WHERE guild_id = ${guild.id} AND name = ${name}`;
}

export async function removeTag(name, guild) {
  await sql`DELETE FROM tags WHERE guild_id = ${guild.id} AND name = ${name}`;
}

export async function setBroadcast(msg) {
  await sql`UPDATE settings SET broadcast = ${msg} WHERE id = 1`;
}

export async function getBroadcast() {
  const result = await sql`SELECT broadcast FROM settings WHERE id = 1`;
  return result[0].broadcast;
}

export async function disableCommand(guild, command) {
  const guildDB = await this.getGuild(guild);
  await sql`UPDATE guilds SET disabled_commands = ${(guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command]).filter((v) => !!v)} WHERE guild_id = ${guild}`;
  disabledCmdCache.set(guild, guildDB.disabled_commands ? [...guildDB.disabled_commands, command] : [command].filter((v) => !!v));
}

export async function enableCommand(guild, command) {
  const guildDB = await this.getGuild(guild);
  const newDisabled = guildDB.disabled_commands ? guildDB.disabled_commands.filter(item => item !== command) : [];
  await sql`UPDATE guilds SET disabled_commands = ${newDisabled} WHERE guild_id = ${guild}`;
  disabledCmdCache.set(guild, newDisabled);
}

export async function disableChannel(channel) {
  const guildDB = await this.getGuild(channel.guildID);
  await sql`UPDATE guilds SET disabled_commands = ${[...guildDB.disabled, channel.id]} WHERE guild_id = ${channel.guildID}`;
  disabledCache.set(channel.guildID, [...guildDB.disabled, channel.id]);
}

export async function enableChannel(channel) {
  const guildDB = await this.getGuild(channel.guildID);
  const newDisabled = guildDB.disabled.filter(item => item !== channel.id);
  await sql`UPDATE guilds SET disabled_commands = ${newDisabled} WHERE guild_id = ${channel.guildID}`;
  disabledCache.set(channel.guildID, newDisabled);
}

export async function getCounts() {
  const counts = await sql`SELECT * FROM counts`;
  const countObject = {};
  for (const { command, count } of counts) {
    countObject[command] = count;
  }
  return countObject;
}

export async function addCount(command) {
  await sql`INSERT INTO counts ${sql({ command, count: 1 }, "command", "count")} ON CONFLICT (command) DO UPDATE SET count = counts.count + 1 WHERE counts.command = ${command}`;
}

export async function stop() {
  await sql.end();
}
