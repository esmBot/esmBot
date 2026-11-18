import { ActivityTypes, type BotActivity, type Client, type SendStatuses } from "oceanic.js";
import commandsConfig from "#config/commands.json" with { type: "json" };
import messagesConfig from "#config/messages.json" with { type: "json" };
import type { DatabasePlugin } from "../database.ts";
import { random } from "./misc.ts";

let broadcast = false;

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
