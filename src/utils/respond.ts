import { Buffer } from "node:buffer";
import { CommandInteraction, Message, type CreateMessageOptions, type InteractionContent } from "oceanic.js";
import type Command from "#cmd-classes/command.js";
import detectRuntime from "./detectRuntime.ts";
import { getString } from "./i18n.ts";
import logger from "./logger.ts";
import { clean } from "./misc.ts";

let Sentry: typeof import("@sentry/node-core") | undefined;
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "") {
  const { type } = detectRuntime();
  Sentry = await import(`@sentry/${type === "node" ? "node-core/light" : type}`);
}

export async function respond<T extends Message | CommandInteraction>({
  result,
  cmdName,
  commandClass,
  context,
}: {
  result: string | CreateMessageOptions | InteractionContent | undefined;
  cmdName: string;
  commandClass: Command;
  context: T;
}) {
  const isInteraction = context instanceof CommandInteraction;

  let payload: CreateMessageOptions | InteractionContent | undefined;
  if (typeof result === "string") {
    payload = {
      content: result,
      flags: commandClass.success || !isInteraction ? 0 : 64,
      messageReference: !isInteraction
        ? {
            channelID: context.channelID,
            messageID: context.id,
            guildID: context.guildID ?? undefined,
            failIfNotExists: false,
          }
        : undefined,
      allowedMentions: !isInteraction
        ? {
            repliedUser: true,
          }
        : undefined,
    };
  } else if (typeof result === "object") {
    payload = Object.assign(
      {
        flags: result.flags ?? (commandClass.success ? 0 : 64),
      },
      result,
      !isInteraction
        ? {
            messageReference: {
              channelID: context.channelID,
              messageID: context.id,
              guildID: context.guildID ?? undefined,
              failIfNotExists: false,
            },
            allowedMentions: {
              repliedUser: new Date().getTime() - context.createdAt.getTime() >= 180000,
            },
          }
        : {},
    );
  } else {
    logger.debug(`Unknown return type for command ${cmdName}: ${result} (${typeof result})`);
  }

  let res;
  if (payload) {
    if (isInteraction) {
      res = await context.createFollowup(payload);
    } else {
      res = await context.client.rest.channels.createMessage(context.channelID, payload);
    }
  }

  await commandClass.finalize(res && "message" in res ? res.message : res);
}

export async function respondError<T extends Message | CommandInteraction>({
  error,
  cmdName,
  context,
  args,
}: {
  error: Error;
  cmdName: string;
  context: T;
  args: Array<unknown>;
}) {
  Sentry?.captureException(error, {
    tags: {
      process: process.env.pm_id ? Number.parseInt(process.env.pm_id) - 1 : 0,
      cmdName,
      args: JSON.stringify(args),
    },
  });

  const isInteraction = context instanceof CommandInteraction;
  logger.error(
    `Error occurred in ${isInteraction ? "application" : "classic"} command ${cmdName} with arguments ${isInteraction ? JSON.stringify(args) : `"${args.join(" ")}"`}: ${(error as Error).stack || error}`,
  );

  const localeInfo = isInteraction ? { locale: context.locale } : undefined;
  const errorPayload = {
    content: `${getString("error", localeInfo)} <https://github.com/esmBot/esmBot/issues>`,
    files: [
      {
        contents: Buffer.from(clean(error, isInteraction ? [context.token] : [])),
        name: "error.txt",
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: getString("support", localeInfo),
            style: 5,
            url: "https://discord.gg/esmbot-support-592399417676529688",
          },
        ],
      },
    ],
    messageReference: !isInteraction
      ? {
          channelID: context.channelID,
          messageID: context.id,
          guildID: context.guildID ?? undefined,
          failIfNotExists: false,
        }
      : undefined,
    allowedMentions: !isInteraction
      ? {
          repliedUser: false,
        }
      : undefined,
  };

  try {
    if (isInteraction) {
      await context.createFollowup(errorPayload);
    } else {
      await context.client.rest.channels.createMessage(context.channelID, errorPayload);
    }
  } catch (err) {
    logger.error(
      `While attempting to send the previous error message, another error occurred: ${(err as Error)?.stack || err}`,
    );
  }
}
