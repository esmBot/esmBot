import * as logger from "./logger.js";
import fs from "fs";
import format from "format-duration";
import { Shoukaku, Connectors } from "shoukaku";
import { setTimeout } from "timers/promises";

export const players = new Map();
export const queues = new Map();
export const skipVotes = new Map();

export let manager;
export let nodes = JSON.parse(fs.readFileSync(new URL("../config/servers.json", import.meta.url), { encoding: "utf8" })).lava;
export let connected = false;

export function connect(client) {
  manager = new Shoukaku(new Connectors.OceanicJS(client), nodes, { moveOnDisconnect: true, resume: true, reconnectInterval: 500, reconnectTries: 1 });
  manager.on("error", (node, error) => {
    logger.error(`An error occurred on Lavalink node ${node}: ${error}`);
  });
  manager.once("ready", () => {
    logger.log(`Successfully connected to ${manager.nodes.size} Lavalink node(s).`);
    connected = true;
  });
}

export async function reload(client) {
  if (!manager) connect(client);
  const activeNodes = manager.nodes;
  const json = await fs.promises.readFile(new URL("../config/servers.json", import.meta.url), { encoding: "utf8" });
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

export async function play(client, sound, options, music = false) {
  if (!connected) return { content: "I'm not connected to any audio servers!", flags: 64 };
  if (!manager) return { content: "The sound commands are still starting up!", flags: 64 };
  if (!options.channel.guild) return { content: "This command only works in servers!", flags: 64 };
  if (!options.member.voiceState) return { content: "You need to be in a voice channel first!", flags: 64 };
  if (!options.channel.guild.permissionsOf(client.user.id.toString()).has("CONNECT")) return { content: "I can't join this voice channel!", flags: 64 };
  const voiceChannel = options.channel.guild.channels.get(options.member.voiceState.channelID);
  if (!voiceChannel.permissionsOf(client.user.id.toString()).has("CONNECT")) return { content: "I don't have permission to join this voice channel!", flags: 64 };
  if (!music && manager.players.has(options.channel.guildID)) return { content: "I can't play a sound effect while other audio is playing!", flags: 64 };
  const node = manager.getNode();
  if (!music && !nodes.filter(obj => obj.name === node.name)[0].local) {
    sound = sound.replace(/\.\//, "https://raw.githubusercontent.com/esmBot/esmBot/master/");
  }
  let response;
  try {
    response = await node.rest.resolve(sound);
    if (!response) return { content: "🔊 I couldn't get a response from the audio server.", flags: 64 };
    if (response.loadType === "NO_MATCHES" || response.loadType === "LOAD_FAILED") return { content: "I couldn't find that song!", flags: 64 };
  } catch (e) {
    logger.error(e);
    return { content: "🔊 Hmmm, seems that all of the audio servers are down. Try again in a bit.", flags: 64 };
  }
  const oldQueue = queues.get(voiceChannel.guildID);
  if (!response.tracks || response.tracks.length === 0) return { content: "I couldn't find that song!", flags: 64 };
  if (process.env.YT_DISABLED === "true" && response.tracks[0].info.sourceName === "youtube") return "YouTube playback is disabled on this instance.";
  if (music) {
    const sortedTracks = response.tracks.map((val) => { return val.track; });
    const playlistTracks = response.playlistInfo.selectedTrack ? sortedTracks : [sortedTracks[0]];
    queues.set(voiceChannel.guildID, oldQueue ? [...oldQueue, ...playlistTracks] : playlistTracks);
  }
  const playerMeta = players.get(options.channel.guildID);
  let player;
  if (node.players.has(voiceChannel.guildID)) {
    player = node.players.get(voiceChannel.guildID);
  } else if (playerMeta?.player) {
    const storedState = playerMeta?.player?.connection.state;
    if (storedState && storedState === 1) {
      player = playerMeta?.player;
    }
  }
  const connection = player ?? await node.joinChannel({
    guildId: voiceChannel.guildID,
    channelId: voiceChannel.id,
    shardId: voiceChannel.guild.shard.id,
    deaf: true
  });

  if (oldQueue?.length && music) {
    return `Your ${response.playlistInfo.name ? "playlist" : "tune"} \`${response.playlistInfo.name ? response.playlistInfo.name.trim() : (response.tracks[0].info.title !== "" ? response.tracks[0].info.title.trim() : "(blank)")}\` has been added to the queue!`;
  } else {
    nextSong(client, options, connection, response.tracks[0].track, response.tracks[0].info, music, voiceChannel, playerMeta?.host ?? options.member.id, playerMeta?.loop ?? false, playerMeta?.shuffle ?? false);
    return;
  }
}

export async function nextSong(client, options, connection, track, info, music, voiceChannel, host, loop = false, shuffle = false, lastTrack = null) {
  skipVotes.delete(voiceChannel.guildID);
  const parts = Math.floor((0 / info.length) * 10);
  let playingMessage;
  if (music && lastTrack === track && players.has(voiceChannel.guildID)) {
    playingMessage = players.get(voiceChannel.guildID).playMessage;
  } else {
    try {
      const content = !music ? { content: "🔊 Playing sound..." } : {
        embeds: [{
          color: 16711680,
          author: {
            name: "Now Playing",
            iconURL: client.user.avatarURL()
          },
          fields: [{
            name: "ℹ️ Title",
            value: info.title?.trim() !== "" ? info.title : "(blank)"
          },
          {
            name: "🎤 Artist",
            value: info.author?.trim() !== "" ? info.author : "(blank)"
          },
          {
            name: "💬 Channel",
            value: voiceChannel.name
          },
          {
            name: "🌐 Node",
            value: connection.node?.name ?? "Unknown"
          },
          {
            name: `${"▬".repeat(parts)}🔘${"▬".repeat(10 - parts)}`,
            value: `0:00/${info.isStream ? "∞" : format(info.length)}`
          }]
        }]
      };
      if (options.type === "classic") {
        playingMessage = await client.rest.channels.createMessage(options.channel.id, content);
      } else {
        await options.interaction[options.interaction.acknowledged ? "editOriginal" : "createMessage"](content);
        playingMessage = await options.interaction.getOriginal();
      }
    } catch {
      // no-op
    }
  }
  connection.removeAllListeners("exception");
  connection.removeAllListeners("stuck");
  connection.removeAllListeners("end");
  connection.setVolume(0.70);
  connection.playTrack({ track });
  players.set(voiceChannel.guildID, { player: connection, type: music ? "music" : "sound", host: host, voiceChannel: voiceChannel, originalChannel: options.channel, loop, shuffle, playMessage: playingMessage });
  connection.once("exception", async (exception) => {
    try {
      if (playingMessage.channel.messages.has(playingMessage.id)) await playingMessage.delete();
      const playMessage = players.get(voiceChannel.guildID).playMessage;
      if (playMessage.channel.messages.has(playMessage.id)) await playMessage.delete();
    } catch {
      // no-op
    }
    try {
      connection.node.leaveChannel(voiceChannel.guildID);
    } catch {
      // no-op
    }
    connection.removeAllListeners("stuck");
    connection.removeAllListeners("end");
    players.delete(voiceChannel.guildID);
    queues.delete(voiceChannel.guildID);
    logger.error(exception.error);
    try {
      const content = `🔊 Looks like there was an error regarding sound playback:\n\`\`\`${exception.type}: ${exception.error}\`\`\``;
      if (options.type === "classic") {
        await client.rest.channels.createMessage(options.channel.id, { content });
      } else {
        await options.interaction.createFollowup({ content });
      }
    } catch {
      // no-op
    }
  });
  connection.on("stuck", () => {
    const nodeName = manager.getNode().name;
    connection.move(nodeName);
    connection.resume();
  });
  connection.on("end", async (data) => {
    if (data.reason === "REPLACED") return;
    let queue = queues.get(voiceChannel.guildID);
    const player = players.get(voiceChannel.guildID);
    if (player && process.env.STAYVC === "true") {
      player.type = "idle";
      players.set(voiceChannel.guildID, player);
    }
    let newQueue;
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
    if (newQueue.length !== 0) {
      const newTrack = await connection.node.rest.decode(newQueue[0]);
      nextSong(client, options, connection, newQueue[0], newTrack, music, voiceChannel, host, player.loop, player.shuffle, track);
      try {
        if (options.type === "classic") {
          if (newQueue[0] !== track && playingMessage.channel.messages.has(playingMessage.id)) await playingMessage.delete();
          if (newQueue[0] !== track && player.playMessage.channel.messages.has(player.playMessage.id)) await player.playMessage.delete();
        }
      } catch {
        // no-op
      }
    } else if (process.env.STAYVC !== "true") {
      await setTimeout(400);
      connection.node.leaveChannel(voiceChannel.guildID);
      players.delete(voiceChannel.guildID);
      queues.delete(voiceChannel.guildID);
      skipVotes.delete(voiceChannel.guildID);
      try {
        const content = `🔊 The voice channel session in \`${voiceChannel.name}\` has ended.`;
        if (options.type === "classic") {
          await client.rest.channels.createMessage(options.channel.id, { content });
        } else {
          await options.interaction.createFollowup({ content });
        }
      } catch {
        // no-op
      }
    }
    if (options.type === "classic") {
      try {
        if (playingMessage.channel.messages.has(playingMessage.id)) await playingMessage.delete();
        if (player?.playMessage.channel.messages.has(player.playMessage.id)) await player.playMessage.delete();
      } catch {
        // no-op
      }
    }
  });
}
