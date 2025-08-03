import type { AnyChannel, Client, Guild, Member, Role, User } from "oceanic.js";
import { safeBigInt } from "./misc.ts";

const mentionRegex = /^<?[@#]?[&!]?(\d+)>?$/;

interface MentionToObjectParams {
  guild?: Guild | null;
  server?: boolean;
  rest?: boolean;
}

type MentionTypes = "user" | "role" | "channel";

export async function mentionToObject(
  client: Client,
  mention: string,
  type: "user",
  options: MentionToObjectParams,
): Promise<User | Member>;
export async function mentionToObject(
  client: Client,
  mention: string,
  type: "role",
  options: MentionToObjectParams,
): Promise<Role>;
export async function mentionToObject(
  client: Client,
  mention: string,
  type: "channel",
  options: MentionToObjectParams,
): Promise<AnyChannel>;
export async function mentionToObject(
  client: Client,
  mention: string,
  type: MentionTypes,
  options: MentionToObjectParams,
) {
  let obj;
  if (validID(mention)) {
    if (type === "user") {
      obj = await getUser(client, options.guild, mention, options.server, options.rest);
    } else if (type === "role") {
      obj = await getRole(client, options.guild!, mention);
    } else if (type === "channel") {
      obj = await getChannel(client, mention);
    }
  } else if (mentionRegex.test(mention)) {
    const id = mention.match(mentionRegex)?.[1];
    if (id && validID(id)) {
      if (type === "user") {
        obj = await getUser(client, options.guild, id, options.server, options.rest);
      } else if (type === "role") {
        obj = await getRole(client, options.guild!, id);
      } else if (type === "channel") {
        obj = await getChannel(client, id);
      }
    }
  }
  return obj;
}

function validID(id: string) {
  return safeBigInt(id) > 21154535154122752n;
}

async function getChannel(client: Client, id: string) {
  let channel = client.getChannel(id);
  if (!channel) channel = await client.rest.channels.get(id);
  return channel;
}

async function getRole(client: Client, guild: Guild, id: string) {
  let role = guild?.roles.get(id);
  if (!role && guild) role = await client.rest.guilds.getRole(guild.id, id);
  return role;
}

export async function getUser(
  client: Client,
  guild: Guild | null | undefined,
  id: string,
  member = false,
  rest = false,
): Promise<Member | User> {
  let user;
  if (member && guild) {
    if (!rest) user = guild.members.get(id);
    if (!user) user = await client.rest.guilds.getMember(guild.id, id);
  } else {
    if (!rest) user = client.users.get(id);
    if (!user) user = await client.rest.users.get(id);
  }
  return user;
}
