import logger from "./logger.js";
import fs from "node:fs";
import format from "format-duration";
import { Shoukaku, Connectors, type Player, type NodeOption, type Track, type TrackExceptionEvent, type LavalinkResponse, type Playlist } from "shoukaku";
import { setTimeout } from "node:timers/promises";
import { type Client, type CommandInteraction, type Guild, type GuildChannel, type Member, type Message, VoiceChannel } from "oceanic.js";
import { getString } from "./i18n.js";

export type SoundPlayer = {
  player: Player;
  host: string;
  voiceChannel: VoiceChannel;
  originalChannel: GuildChannel;
  loop: boolean;
  shuffle: boolean;
  playMessage?: Message;
  locale: string;
};

export const players = new Map<string, SoundPlayer>();
export const queues = new Map<string, string[]>();
export const skipVotes = new Map();

type Options = {
  type: "classic" | "application";
  channel: GuildChannel;
  guild: Guild;
  member: Member;
  interaction?: CommandInteraction;
  locale: string;
};

export let manager: Shoukaku;
export let nodes = JSON.parse(fs.readFileSync(new URL("../../config/servers.json", import.meta.url), { encoding: "utf8" })).lava as NodeOption[];
export let connected = false;

export function connect(client: Client) {
  manager = new Shoukaku(new Connectors.OceanicJS(client), nodes, { moveOnDisconnect: true, resume: true });
  manager.on("error", (node, error) => {
    logger.error(`An error occurred on Lavalink node ${node}: ${error}`);
  });
  manager.on("debug", (node, info) => {
    logger.debug(`Debug event from Lavalink node ${node}: ${info}`);
  });
  manager.once("ready", () => {
    logger.log(`Successfully connected to ${manager.nodes.size} Lavalink node(s).`);
    connected = true;
  });
}

export async function reload(client: Client) {
  if (!manager) connect(client);
  const activeNodes = manager.nodes;
  const json = await fs.promises.readFile(new URL("../../config/servers.json", import.meta.url), { encoding: "utf8" });
  nodes = JSON.parse(json).lava;
  const names = nodes.map((a) => a.name);
  for (const name in activeNodes) {
    if (!names.includes(name)) {
      manager.removeNode(name);
    }
  }
  for (const node of nodes) {
    if (!activeNodes.has(node.name)) {
      manager.addNode(node);
    }
  }
  if (!manager.nodes.size) connected = false;
  return manager.nodes.size;
}

export async function leaveChannel(id: string) {
  await manager.leaveVoiceChannel(id);
}

export async function play(client: Client, soundUrl: string, options: Options) {
  if (!connected) return { content: getString("sound.notConnected", { locale: options.locale }), flags: 64 };
  if (!manager) return { content: getString("sound.noManager", { locale: options.locale }), flags: 64 };
  if (!options.guild) return { content: getString("guildOnly", { locale: options.locale }), flags: 64 };
  if (!options.member.voiceState?.channelID) return { content: getString("sound.noVoiceState", { locale: options.locale }), flags: 64 };
  if (!options.guild.permissionsOf(client.user.id).has("CONNECT")) return { content: getString("sound.cantJoin", { locale: options.locale }), flags: 64 };
  const voiceChannel = options.guild.channels.get(options.member.voiceState.channelID) ?? await client.rest.channels.get(options.member.voiceState.channelID).catch((e) => {
    logger.warn(`Failed to get a voice channel: ${e}`);
  });
  if (!voiceChannel) return { content: getString("sound.cantJoin", { locale: options.locale }), flags: 64 };
  if (!(voiceChannel instanceof VoiceChannel)) return { content: getString("sound.notVoiceChannel", { locale: options.locale }), flags: 64 };
  if (!voiceChannel.permissionsOf(client.user.id).has("CONNECT")) return { content: getString("sound.cantJoin", { locale: options.locale }), flags: 64 };
  const node = manager.options.nodeResolver(manager.nodes);
  let response: LavalinkResponse;
  try {
    response = await node?.rest.resolve(soundUrl);
    if (!response) return { content: `🔊 ${getString("sound.noResponse", { locale: options.locale })}`, flags: 64 };
    if (response.loadType === "empty" || response.loadType === "error") return { content: getString("sound.noSong", { locale: options.locale }), flags: 64 };
  } catch (e) {
    logger.error(e);
    return { content: `🔊 ${getString("sound.serversDown", { locale: options.locale })}`, flags: 64 };
  }
  const oldQueue = queues.get(voiceChannel.guildID);
  if (!response?.data || (Array.isArray(response.data) && response.data.length === 0)) return { content: getString("sound.noSong", { locale: options.locale }), flags: 64 };
  let tracks: string[] = [];
  let info: Track["info"];
  let playlistInfo: Playlist["info"];
  switch (response.loadType) {
    case "track":
      info = response.data.info;
      tracks.push(response.data.encoded);
      break;
    case "search":
      info = response.data[0].info;
      tracks.push(response.data[0].encoded);
      break;
    case "playlist":
      info = response.data.tracks[0].info;
      playlistInfo = response.data.info;
      tracks = response.data.tracks.map((v) => v.encoded);
      break;
  }
  if (process.env.YT_DISABLED === "true" && info?.sourceName === "youtube") return { content: getString("sound.noYouTube", { locale: options.locale }), flags: 64 };
  const playerMeta = players.get(options.guild.id);
  let player: Player;
  if (manager.players.has(voiceChannel.guildID)) {
    player = manager.players.get(voiceChannel.guildID);
  } else if (playerMeta?.player) {
    const storedState = manager.connections.get(options.guild.id)?.state;
    if (storedState && storedState === 1) {
      player = playerMeta?.player;
    }
  }
  const connection = player ?? await manager.joinVoiceChannel({
    guildId: voiceChannel.guildID,
    channelId: voiceChannel.id,
    shardId: voiceChannel.guild.shard.id,
    deaf: true
  });

  queues.set(voiceChannel.guildID, oldQueue ? [...oldQueue, ...tracks] : tracks);
  if (oldQueue?.length) {
    return getString("sound.addedToQueue", {
      locale: options.locale,
      params: {
        name: playlistInfo ? playlistInfo.name.trim() : (info?.title !== "" ? info?.title.trim() : getString("sound.blank", { locale: options.locale })),
        type: response.loadType
      }
    });
  }

  nextSong(client, options, connection, tracks[0], info, voiceChannel, playerMeta?.host ?? options.member.id, playerMeta?.loop ?? false, playerMeta?.shuffle ?? false);
}

export async function nextSong(client: Client, options: Options, connection: Player, track: string, info: Track["info"] | undefined, voiceChannel: VoiceChannel, host: string, loop = false, shuffle = false, lastTrack: string | null = null) {
  skipVotes.delete(voiceChannel.guildID);
  let playingMessage: Message;
  if (lastTrack === track && players.has(voiceChannel.guildID)) {
    playingMessage = players.get(voiceChannel.guildID)?.playMessage;
  } else {
    try {
      const content = {
        embeds: [{
          color: 0xff0000,
          author: {
            name: getString("sound.nowPlaying", { locale: options.locale }),
            iconURL: client.user.avatarURL()
          },
          fields: [{
            name: `ℹ️ ${getString("sound.title", { locale: options.locale })}`,
            value: info && info.title.trim() !== "" ? info.title : getString("sound.blank", { locale: options.locale })
          },
          {
            name: `🎤 ${getString("sound.artist", { locale: options.locale })}`,
            value: info && info.author.trim() !== "" ? info.author : getString("sound.blank", { locale: options.locale })
          },
          {
            name: `💬 ${getString("sound.channel", { locale: options.locale })}`,
            value: voiceChannel.name
          },
          {
            name: `🌐 ${getString("sound.node", { locale: options.locale })}`,
            value: connection.node?.name ?? getString("sound.unknown", { locale: options.locale })
          },
          {
            name: `🔘${"▬".repeat(10)}`,
            value: `0:00/${info?.isStream ? "∞" : format(info?.length ?? 0)}`
          }]
        }]
      };
      if (options.type === "classic") {
        playingMessage = await client.rest.channels.createMessage(options.channel.id, content);
      } else {
        if ((Date.now() - options.interaction.createdAt.getTime()) >= 900000) { // discord interactions are only valid for 15 minutes
          playingMessage = await client.rest.channels.createMessage(options.channel.id, content);
        } else if (lastTrack && lastTrack !== track) {
          playingMessage = await (await options.interaction.createFollowup(content)).getMessage();
        } else {
          playingMessage = await options.interaction.editOriginal(content);
          if (!playingMessage) playingMessage = await options.interaction.getOriginal();
        }
      }
    } catch (e) {
      logger.error(e);
    }
  }
  connection.removeAllListeners("exception");
  connection.removeAllListeners("stuck");
  connection.removeAllListeners("end");
  await connection.playTrack({
    track: {
      encoded: track
    }
  });
  players.set(voiceChannel.guildID, { player: connection, host, voiceChannel, originalChannel: options.channel, loop, shuffle, playMessage: playingMessage, locale: options.locale });
  connection.once("exception", (exception) => errHandle(exception, client, connection, playingMessage, voiceChannel, options));
  connection.on("stuck", async () => {
    await connection.move();
    await connection.resume();
  });
  connection.on("end", async (data) => {
    if (data.reason === "replaced") return;
    let queue = queues.get(voiceChannel.guildID);
    const player = players.get(voiceChannel.guildID);
    let newQueue: string[] = [];
    if (manager.connections.has(voiceChannel.guildID)) {
      if (player?.shuffle) {
        if (player.loop) {
          queue.push(queue.shift());
        } else {
          queue = queue.slice(1);
        }
        queue.unshift(queue.splice(Math.floor(Math.random() * queue.length), 1)[0]);
        newQueue = queue;
      } else if (player?.loop) {
        queue.push(queue.shift());
        newQueue = queue;
      } else {
        newQueue = queue ? queue.slice(1) : [];
      }
      queues.set(voiceChannel.guildID, newQueue);
    }
    if (newQueue.length !== 0) {
      const newTrack = await connection.node.rest.decode(newQueue[0]);
      nextSong(client, options, connection, newQueue[0], newTrack?.info, voiceChannel, host, player?.loop, player?.shuffle, track);
    } else if (process.env.STAYVC !== "true" && data.reason !== "stopped") {
      await setTimeout(400);
      players.delete(voiceChannel.guildID);
      queues.delete(voiceChannel.guildID);
      skipVotes.delete(voiceChannel.guildID);
      await manager.leaveVoiceChannel(voiceChannel.guildID);
      try {
        const content = `🔊 ${getString("sound.endedInChannel", {
          locale: options.locale,
          params: {
            channel: voiceChannel.name
          }
        })}`;
        if (options.type === "classic") {
          await client.rest.channels.createMessage(options.channel.id, { content });
        } else {
          if ((Date.now() - options.interaction.createdAt.getTime()) >= 900000) {
            await client.rest.channels.createMessage(options.channel.id, { content });
          } else {
            await options.interaction.createFollowup({ content });
          }
        }
      } catch {
        // no-op
      }
    }
    if (options.type === "classic") {
      try {
        if (newQueue[0] !== track && playingMessage.channel.messages.has(playingMessage.id)) await playingMessage.delete();
        if (newQueue[0] !== track && player?.playMessage?.channel?.messages.has(player.playMessage.id)) await player.playMessage.delete();
      } catch {
        // no-op
      }
    }
  });
}

export async function errHandle(exception: TrackExceptionEvent, client: Client, connection: Player, playingMessage: Message, voiceChannel: VoiceChannel, options: Options) {
  try {
    if (playingMessage.channel?.messages.has(playingMessage.id)) await playingMessage.delete();
    const playMessage = players.get(voiceChannel.guildID)?.playMessage;
    if (playMessage?.channel?.messages.has(playMessage.id)) await playMessage.delete();
  } catch {
    // no-op
  }
  players.delete(voiceChannel.guildID);
  queues.delete(voiceChannel.guildID);
  skipVotes.delete(voiceChannel.guildID);
  logger.error(exception);
  await manager.leaveVoiceChannel(voiceChannel.guildID).catch((e) => logger.warn(`Failed to leave voice channel: ${e}`));
  connection.removeAllListeners("exception");
  connection.removeAllListeners("stuck");
  connection.removeAllListeners("end");
  try {
    const content = `🔊 ${getString("sound.error", { locale: options.locale })}\n\`\`\`${exception.exception.cause}: ${exception.exception.message}\`\`\``;
    if (options.type === "classic") {
      if (playingMessage.channel) await client.rest.channels.createMessage(playingMessage.channel.id, { content });
    } else {
      if ((Date.now() - options.interaction.createdAt.getTime()) >= 900000) {
        await client.rest.channels.createMessage(options.channel.id, { content });
      } else {
        await options.interaction.createFollowup({ content });
      }
    }
  } catch {
    // no-op
  }
}
