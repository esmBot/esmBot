import util from "util";
import fs from "fs";
import pm2 from "pm2";
import { config } from "dotenv";
import db from "./database.js";

// playing messages
const { messages } = JSON.parse(fs.readFileSync(new URL("../config/messages.json", import.meta.url)));
const { types } = JSON.parse(fs.readFileSync(new URL("../config/commands.json", import.meta.url)));

let broadcast = false;

// random(array) to select a random entry in array
export function random(array) {
  if (!array || array.length < 1) return null;
  return array[Math.floor(Math.random() * array.length)];
}

const optionalReplace = (token) => {
  return token === undefined || token === "" ? "" : (token === "true" || token === "false" ? token : "<redacted>");
};

// clean(text) to clean message of any private info or mentions
export function clean(text) {
  if (typeof text !== "string")
    text = util.inspect(text, { depth: 1 });

  text = text
    .replaceAll("`", `\`${String.fromCharCode(8203)}`)
    .replaceAll("@", `@${String.fromCharCode(8203)}`);

  let { parsed } = config();
  if (!parsed) parsed = process.env;
  const imageServers = JSON.parse(fs.readFileSync(new URL("../config/servers.json", import.meta.url), { encoding: "utf8" })).image;

  if (imageServers?.length !== 0) {
    for (const { server, auth } of imageServers) {
      text = text.replaceAll(server, optionalReplace(server));
      text = text.replaceAll(auth, optionalReplace(auth));
    }
  }

  for (const env of Object.keys(parsed)) {
    text = text.replaceAll(parsed[env], optionalReplace(parsed[env]));
  }

  return text;
}

// textEncode(string) to encode characters for image processing
export function textEncode(string) {
  return string.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;").replaceAll("\\n", "\n").replaceAll("\\:", ":").replaceAll("\\,", ",");
}

// set activity (a.k.a. the gamer code)
export async function activityChanger(bot) {
  if (!broadcast) {
    await bot.editStatus("dnd", [{
      type: 0,
      name: random(messages) + (types.classic ? ` | @${bot.user.username} help` : "")
    }]);
  }
  setTimeout(() => activityChanger(bot), 900000);
}

export async function checkBroadcast(bot) {
  if (!db) {
    return;
  }
  const message = await db.getBroadcast();
  if (message) {
    startBroadcast(bot, message);
  }
}

export function startBroadcast(bot, message) {
  bot.editStatus("dnd", [{
    type: 0,
    name: message + (types.classic ? ` | @${bot.user.username} help` : "")
  }]);
  broadcast = true;
}

export function endBroadcast(bot) {
  bot.editStatus("dnd", [{
    type: 0,
    name: random(messages) + (types.classic ? ` | @${bot.user.username} help` : "")
  }]);
  broadcast = false;
}

export function getServers(bot) {
  return new Promise((resolve, reject) => {
    if (process.env.PM2_USAGE) {
      pm2.launchBus((err, pm2Bus) => {
        const listener = (packet) => {
          if (packet.data?.type === "countResponse") {
            resolve(packet.data.serverCount);
            pm2Bus.off("process:msg");
          }
        };
        pm2Bus.on("process:msg", listener);
      });
      pm2.list((err, list) => {
        if (err) {
          reject(err);
          return;
        }
        const managerProc = list.filter((v) => v.name === "esmBot-manager")[0];
        pm2.sendDataToProcessId(managerProc.pm_id, {
          id: managerProc.pm_id,
          type: "process:msg",
          data: {
            type: "getCount"
          },
          topic: true
        }, (err) => {
          if (err) reject(err);
        });
      });
    } else {
      resolve(bot.guilds.size);
    }
  });
}

// copied from eris
export function cleanMessage(message, content) {
  let cleanContent = content?.replace(/<a?(:\w+:)[0-9]+>/g, "$1") || "";

  const author = message.author ?? message.member ?? message.user;
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
        const role = message.guild.roles.get(roleID);
        const roleName = role ? role.name : "deleted-role";
        cleanContent = cleanContent.replace(new RegExp(`<@&${roleID}>`, "g"), `@${roleName}`);
      }
    }

    for (const id of message.mentions.channels) {
      const channel = message.client.getChannel(id);
      if (channel?.name && channel.mention) {
        cleanContent = cleanContent.replace(channel.mention, `#${channel.name}`);
      }
    }
  }

  return textEncode(cleanContent);
}