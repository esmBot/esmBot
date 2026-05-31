import { execFile as baseExecFile } from "node:child_process";
import process from "node:process";
import util from "node:util";
import {
  ActivityTypes,
  type AnyChannel,
  type AnyPrivateChannel,
  type BotActivity,
  type Client,
  type CommandInteraction,
  type Guild,
  type Message,
  type SendStatuses,
} from "oceanic.js";
import commandsConfig from "#config/commands.json" with { type: "json" };
import messagesConfig from "#config/messages.json" with { type: "json" };
import packageJson from "../../package.json" with { type: "json" };
import type { DatabasePlugin } from "../database.ts";
import { disconnect, servers } from "./media.ts";

let broadcast = false;

export async function getVers() {
  process.env.ESMBOT_VER = packageJson.version;
  const execFile = util.promisify(baseExecFile);

  process.env.GIT_REV = await execFile("git", ["rev-parse", "HEAD"]).then(
    (output) => output.stdout.substring(0, 7),
    () => "unknown commit",
  );
}

export function initLog() {
  console.log(`
     ,*\`$                    z\`"v
    F zBw\`%                 A ,W "W
  ,\` ,EBBBWp"%. ,-=~~==-,+*  4BBE  T
  M  BBBBBBBB* ,w=####Wpw  4BBBBB#  1
 F  BBBBBBBMwBBBBBBBBBBBBB#wXBBBBBH  E
 F  BBBBBBkBBBBBBBBBBBBBBBBBBBBE4BL  k
 #  BFBBBBBBBBBBBBF"      "RBBBW    F
  V ' 4BBBBBBBBBBM            TBBL  F
   F  BBBBBBBBBBF              JBB  L
   F  FBBBBBBBEB                BBL 4
   E  [BB4BBBBEBL               BBL 4
   I   #BBBBBBBEB              4BBH  *w
   A   4BBBBBBBBBEW,         ,BBBB  W  [
.A  ,k  4BBBBBBBBBBBEBW####BBBBBBM BF  F
k  <BBBw BBBBEBBBBBBBBBBBBBBBBBQ4BM  #
 5,  REBBB4BBBBB#BBBBBBBBBBBBP5BFF  ,F
   *w  \`*4BBW\`"FF#F##FFFF"\` , *   +"
      *+,   " F'"'*^~~~^"^\`  V+*^
          \`"""

esmBot ${process.env.ESMBOT_VER} (${process.env.GIT_REV})
`);
}

// random(array) to select a random entry in array
export function random<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

const optionalReplace = (token: string) => {
  return token === undefined || token === "" ? "" : token === "true" || token === "false" ? token : "<redacted>";
};

const sensitiveVars = ["TOKEN", "DB", "KLIPY", "REST_PROXY", "SENTRY_DSN", "OUTPUT", "TEMPDIR"];

// clean(text) to clean message of any private info or mentions
export function clean(input: string | Error, remove: string[] = [], skipEnv = false) {
  let text = input;
  if (typeof text !== "string") text = util.inspect(text, { depth: 1 });

  for (const entry of remove) {
    text = text.replaceAll(entry, optionalReplace(entry));
  }

  text = text.replaceAll("`", `\`${String.fromCharCode(8203)}`).replaceAll("@", `@${String.fromCharCode(8203)}`);

  if (!skipEnv) {
    if (servers.length !== 0) {
      for (const { server, auth } of servers) {
        text = text.replaceAll(server, optionalReplace(server));
        if (auth) text = text.replaceAll(auth, optionalReplace(auth));
      }
    }

    for (const env of sensitiveVars) {
      if (process.env[env] && process.env[env].length > 0) {
        text = text.replaceAll(process.env[env], optionalReplace(process.env[env]));
      }
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

const activityTypes = ["online", "dnd", "idle", "invisible"];

// set activity (a.k.a. the gamer code)
export async function activityChanger(bot: Client) {
  if (!broadcast) {
    let message: (BotActivity & { status: string }) | string = random(messagesConfig.messages);
    if (typeof message === "string") {
      message = {
        name: message,
        status: "dnd",
        type: ActivityTypes.GAME,
      };
    }
    if (!activityTypes.includes(message.status)) message.status = "dnd";
    if (message.type < 0 || message.type > 5) message.type = 0;
    const text = message.name + (commandsConfig.types.classic ? ` | @${bot.user.username} help` : "");
    await bot.editStatus(message.status as SendStatuses, [
      {
        ...message,
        name: text,
        // @ts-expect-error It mistakenly thinks there's no overlap here
        state: message.type === ActivityTypes.CUSTOM ? text : undefined,
      },
    ]);
  }
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
  broadcast = false;
  activityChanger(bot);
}

export async function exit(client: Client, database: DatabasePlugin | undefined) {
  client.disconnect(false);
  if (database) await database.stop();
  disconnect();
  process.exit();
}

export function getServers(bot: Client): Promise<number> {
  return new Promise((resolve, reject) => {
    if (process.env.CLUSTER_TYPE === "node") {
      const listener = (packet: { data: { type: string; serverCount: number } }) => {
        if (packet.data?.type === "countResponse") {
          clearTimeout(timeout);
          resolve(packet.data.serverCount);
          process.off("message", listener);
        }
      };
      process.on("message", listener);

      const timeout = setTimeout(() => {
        process.off("message", listener);
        reject(Error("Timed out while getting server count"));
      }, 3000);

      process.send?.({
        data: {
          type: "getCount",
        },
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

export function maxFileSize(guild: Guild | null) {
  let fileSize = 10485760;
  switch (guild?.premiumTier) {
    case 2:
      fileSize = 52428800;
      break;
    case 3:
      fileSize = 104857600;
      break;
  }
  return fileSize;
}

export function formatDuration(ms: number) {
  const days = Math.floor(ms / 86400000);
  const initDuration = new Date(ms).toISOString().slice(11, 19);
  return (days ? days + ":" : "") + initDuration;
}
