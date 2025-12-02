import process from "node:process";
import util from "node:util";

import { type DotenvParseOutput, config } from "dotenv";
import type { AnyChannel, AnyPrivateChannel, Client, CommandInteraction, Message } from "oceanic.js";

import commandsConfig from "#config/commands.json" with { type: "json" };
import messagesConfig from "#config/messages.json" with { type: "json" };

import type { DatabasePlugin } from "../database.ts";
import { disconnect, servers } from "./media.ts";

const pm2 = process.env.PM2_USAGE ? (await import("pm2")).default : null;

let broadcast = false;

// random(array) to select a random entry in array
export function random<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

const optionalReplace = (token: string) => {
  return token === undefined || token === "" ? "" : token === "true" || token === "false" ? token : "<redacted>";
};

// clean(text) to clean message of any private info or mentions
export function clean(input: string | Error, remove: string[] = [], skipEnv = false) {
  let text = input;
  if (typeof text !== "string") text = util.inspect(text, { depth: 1 });

  for (const entry of remove) {
    text = text.replaceAll(entry, optionalReplace(entry));
  }

  text = text.replaceAll("`", `\`${String.fromCharCode(8203)}`).replaceAll("@", `@${String.fromCharCode(8203)}`);

  if (!skipEnv) {
    let { parsed } = config({ quiet: true });
    if (!parsed) parsed = process.env as DotenvParseOutput;

    if (servers?.length !== 0) {
      for (const { server, auth } of servers) {
        text = text.replaceAll(server, optionalReplace(server));
        if (auth) text = text.replaceAll(auth, optionalReplace(auth));
      }
    }

    for (const env of Object.keys(parsed)) {
      text = text.replaceAll(parsed[env], optionalReplace(parsed[env]));
    }
  }

  return text;
}

// textEncode(string) to encode characters for image processing
export function textEncode(string: string) {
  return string
    .replaceAll("&", "&amp;")
    .replaceAll(">", "&gt;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("\\n", "\n")
    .replaceAll("\\:", ":")
    .replaceAll("\\,", ",");
}

// set activity (a.k.a. the gamer code)
export async function activityChanger(bot: Client) {
  if (!broadcast) {
    await bot.editStatus("dnd", [
      {
        type: 0,
        name: random(messagesConfig.messages) + (commandsConfig.types.classic ? ` | @${bot.user.username} help` : ""),
      },
    ]);
  }
  setTimeout(() => activityChanger(bot), 900000);
}

export async function checkBroadcast(bot: Client, db: DatabasePlugin | undefined) {
  if (!db) {
    return;
  }
  const message = await db.getBroadcast();
  if (message) {
    startBroadcast(bot, message);
  }
}

export function startBroadcast(bot: Client, message: string) {
  bot.editStatus("dnd", [
    {
      type: 0,
      name: message + (commandsConfig.types.classic ? ` | @${bot.user.username} help` : ""),
    },
  ]);
  broadcast = true;
}

export function endBroadcast(bot: Client) {
  bot.editStatus("dnd", [
    {
      type: 0,
      name: random(messagesConfig.messages) + (commandsConfig.types.classic ? ` | @${bot.user.username} help` : ""),
    },
  ]);
  broadcast = false;
}

export async function exit(client: Client, database: DatabasePlugin | undefined) {
  client.disconnect(false);
  if (database) await database.stop();
  disconnect();
  process.exit();
}

export function getServers(bot: Client): Promise<number> {
  return new Promise((resolve, reject) => {
    if (pm2) {
      pm2.launchBus((_err, pm2Bus) => {
        const listener = (packet: { data: { type: string; serverCount: number } }) => {
          if (packet.data?.type === "countResponse") {
            resolve(packet.data.serverCount);
            pm2Bus.off("process:msg");
          }
        };
        pm2Bus.on("process:msg", listener);

        pm2.list((err, list) => {
          if (err) {
            reject(err);
            return;
          }
          const managerProc = list.find((v) => v.name === "esmBot-manager");
          if (!managerProc) {
            pm2Bus.off("process:msg");
            return resolve(bot.guilds.size);
          }
          pm2.sendDataToProcessId(
            managerProc.pm_id as number,
            {
              id: managerProc.pm_id,
              type: "process:msg",
              data: {
                type: "getCount",
              },
              topic: true,
            },
            (err) => {
              if (err) reject(err);
            },
          );
        });
      });
    } else {
      resolve(bot.guilds.size);
    }
  });
}

// copied from eris
export function cleanMessage(message: Message, content: string) {
  let cleanContent = content?.replace(/<a?(:\w+:)[0-9]+>/g, "$1") || "";

  const author = message.author;
  let authorName = author.username;
  if (message.member?.nick) {
    authorName = message.member.nick;
  }
  cleanContent = cleanContent.replace(new RegExp(`<@!?${author.id}>`, "g"), `@${authorName}`);

  if (message.mentions) {
    for (const mention of message.mentions.members) {
      if (mention.nick) {
        cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, "g"), `@${mention.nick}`);
      }
      cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, "g"), `@${mention.username}`);
    }

    if (message.guildID && message.mentions.roles) {
      for (const roleID of message.mentions.roles) {
        const role = message.guild?.roles.get(roleID);
        const roleName = role ? role.name : "deleted-role";
        cleanContent = cleanContent.replace(new RegExp(`<@&${roleID}>`, "g"), `@${roleName}`);
      }
    }

    for (const id of message.mentions.channels) {
      const channel = message.client.getChannel<Exclude<AnyChannel, AnyPrivateChannel>>(id);
      if (channel?.name && channel.mention) {
        cleanContent = cleanContent.replace(channel.mention, `#${channel.name}`);
      }
    }
  }

  return textEncode(cleanContent);
}

export function cleanInteraction(interaction: CommandInteraction, content: string) {
  let cleanContent = content?.replace(/<a?(:\w+:)[0-9]+>/g, "$1") || "";

  const author = interaction.user;
  let authorName = author.username;
  if (interaction.member?.nick) {
    authorName = interaction.member.nick;
  }
  cleanContent = cleanContent.replace(new RegExp(`<@!?${author.id}>`, "g"), `@${authorName}`);

  for (const mention of interaction.data.resolved.members.values()) {
    if (mention.nick) {
      cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, "g"), `@${mention.nick}`);
    }
    cleanContent = cleanContent.replace(new RegExp(`<@!?${mention.id}>`, "g"), `@${mention.username}`);
  }

  if (interaction.guildID && interaction.data.resolved.roles.size > 0) {
    for (const role of interaction.data.resolved.roles.values()) {
      const roleName = role ? role.name : "deleted-role";
      cleanContent = cleanContent.replace(new RegExp(`<@&${role.id}>`, "g"), `@${roleName}`);
    }
  }

  for (const channel of interaction.data.resolved.channels.values()) {
    if (channel.name && channel.mention) {
      cleanContent = cleanContent.replace(channel.mention, `#${channel.name}`);
    }
  }

  return textEncode(cleanContent);
}

export function isEmpty(string: string) {
  return string.length === 0 || string.replace(/[\s\u2800\p{C}]/gu, "").length === 0;
}

export function safeBigInt(input: string | number | bigint | boolean) {
  try {
    return BigInt(input);
  } catch {
    return -1;
  }
}
