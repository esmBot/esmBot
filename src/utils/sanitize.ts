import { inspect } from "node:util";
import type { AnyChannel, AnyPrivateChannel, CommandInteraction, Message } from "oceanic.js";
import { servers } from "./media.ts";

const optionalReplace = (token: string) => {
  return token === undefined || token === "" ? "" : token === "true" || token === "false" ? token : "<redacted>";
};

const sensitiveVars = ["TOKEN", "DB", "KLIPY", "REST_PROXY", "OUTPUT", "TEMPDIR"];

// clean(text) to clean message of any private info or mentions
export function clean(input: unknown, remove: string[] = [], skipEnv = false) {
  let text = typeof input === "string" ? input : inspect(input, { depth: 1 });

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
  return string.length === 0 || string.replace(/[\s\u2800\p{Cc}\p{Cf}\p{Cs}\p{Co}]/gu, "").length === 0;
}

export function safeBigInt(input: string | number | bigint | boolean) {
  try {
    return BigInt(input);
  } catch {
    return -1;
  }
}
