import * as logger from "./logger.js";
import fetch from "node-fetch";
import fs from "fs";
import format from "format-duration";
import { Shoukaku, Connectors } from "shoukaku";

export const players = new Map();
export const queues = new Map();
export const skipVotes = new Map();

export let manager;
export let nodes;
export let status = false;
export let connected = false;

export async function checkStatus() {
  const json = await fs.promises.readFile(new URL("../servers.json", import.meta.url), { encoding: "utf8" });
  nodes = JSON.parse(json).lava;
  const newNodes = [];
  for (const node of nodes) {
    try {
      const response = await fetch(`http://${node.url}/version`, { headers: { Authorization: node.auth } }).then(res => res.text());
      if (response) newNodes.push(node);
    } catch {
      logger.error(`Failed to get status of Lavalink node ${node.host}.`);
    }
  }
  nodes = newNodes;
  status = newNodes.length === 0 ? true : false;
  return status;
}

export async function connect(client) {
  manager = new Shoukaku(new Connectors.Eris(client), nodes, { moveOnDisconnect: true, resume: true, reconnectInterval: 500, reconnectTries: 1 });
  client.emit("ready"); // workaround
  manager.on("error", (node, error) => {
    logger.error(`An error occurred on Lavalink node ${node}: ${error}`);
  });
  manager.once("ready", () => {
    logger.log(`Successfully connected to ${manager.nodes.size} Lavalink node(s).`);
    connected = true;
  });
}

export function reload() {
  const activeNodes = manager.nodes;
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
  return manager.nodes.size;
}

export async function play(client, sound, options, music = false) {
  if (!manager) return "The sound commands are still starting up!";
  if (!options.channel.guild) return "This command only works in servers!";
  if (!options.member.voiceState.channelID) return "You need to be in a voice channel first!";
  if (!options.channel.guild.permissionsOf(client.user.id).has("voiceConnect")) return "I can't join this voice channel!";
  const voiceChannel = options.channel.guild.channels.get(options.member.voiceState.channelID);
  if (!voiceChannel.permissionsOf(client.user.id).has("voiceConnect")) return "I don't have permission to join this voice channel!";
  const playerMeta = players.get(options.channel.guild.id);
  if (!music && manager.players.has(options.channel.guild.id) && (playerMeta?.type === "music")) return "I can't play a sound effect while playing music!";
  let node = manager.getNode();
  if (!node) {
    const status = await checkStatus();
    if (!status) {
      await connect(client);
      node = manager.getNode();
    }
  }
  if (!music && !nodes.filter(obj => obj.name === node.name)[0].local) {
    sound = sound.replace(/\.\//, "https://raw.githubusercontent.com/esmBot/esmBot/master/");
  }
  let response;
  try {
    response = await node.rest.resolve(sound);
    if (!response) return "🔊 I couldn't get a response from the audio server.";
    if (response.loadType === "NO_MATCHES" || response.loadType === "LOAD_FAILED") return "I couldn't find that song!";
  } catch (e) {
    logger.error(e);
    return "🔊 Hmmm, seems that all of the audio servers are down. Try again in a bit.";
  }
  const oldQueue = queues.get(voiceChannel.guild.id);
  if (!response.tracks || response.tracks.length === 0) return "I couldn't find that song!";
  if (music) {
    const sortedTracks = response.tracks.map((val) => { return val.track; });
    const playlistTracks = response.playlistInfo.selectedTrack ? sortedTracks : [sortedTracks[0]];
    queues.set(voiceChannel.guild.id, oldQueue ? [...oldQueue, ...playlistTracks] : playlistTracks);
  }
  let player;
  if (node.players.has(voiceChannel.guild.id)) {
    player = node.players.get(voiceChannel.guild.id);
  } else if (playerMeta?.player) {
    const storedState = playerMeta?.player?.connection.state;
    if (storedState && storedState === 1) {
      player = playerMeta?.player;
    }
  }
  const connection = player ?? await node.joinChannel({
    guildId: voiceChannel.guild.id,
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
  skipVotes.delete(voiceChannel.guild.id);
  const parts = Math.floor((0 / info.length) * 10);
  let playingMessage;
  if (!music && players.has(voiceChannel.guild.id)) {
    const playMessage = players.get(voiceChannel.guild.id).playMessage;
    try {
      players.delete(voiceChannel.guild.id);
      await playMessage.delete();
    } catch {
      // no-op
    }
  }
  if (music && lastTrack === track && players.has(voiceChannel.guild.id)) {
    playingMessage = players.get(voiceChannel.guild.id).playMessage;
  } else {
    try {
      const content = !music ? "🔊 Playing sound..." : {
        embeds: [{
          color: 16711680,
          author: {
            name: "Now Playing",
            icon_url: client.user.avatarURL
          },
          fields: [{
            name: "ℹ️ Title:",
            value: info.title?.trim() !== "" ? info.title : "(blank)"
          },
          {
            name: "🎤 Artist:",
            value: info.author?.trim() !== "" ? info.author : "(blank)"
          },
          {
            name: "💬 Channel:",
            value: voiceChannel.name
          },
          {
            name: "🌐 Node:",
            value: connection.node?.name ?? "Unknown"
          },
          {
            name: `${"▬".repeat(parts)}🔘${"▬".repeat(10 - parts)}`,
            value: `0:00/${info.isStream ? "∞" : format(info.length)}`
          }]
        }]
      };
      if (options.type === "classic") {
        playingMessage = await client.createMessage(options.channel.id, content);
      } else {
        await options.interaction[options.interaction.acknowledged ? "editOriginalMessage" : "createMessage"](content);
        playingMessage = await options.interaction.getOriginalMessage();
      }
    } catch {
      // no-op
    }
  }
  connection.removeAllListeners("exception");
  connection.removeAllListeners("stuck");
  connection.removeAllListeners("end");
  connection.playTrack({ track });
  players.set(voiceChannel.guild.id, { player: connection, type: music ? "music" : "sound", host: host, voiceChannel: voiceChannel, originalChannel: options.channel, loop, shuffle, playMessage: playingMessage });
  connection.once("exception", async (exception) => {
    try {
      if (playingMessage.channel.messages.has(playingMessage.id)) await playingMessage.delete();
      const playMessage = players.get(voiceChannel.guild.id).playMessage;
      if (playMessage.channel.messages.has(playMessage.id)) await playMessage.delete();
    } catch {
      // no-op
    }
    try {
      connection.node.leaveChannel(voiceChannel.guild.id);
    } catch {
      // no-op
    }
    connection.removeAllListeners("stuck");
    connection.removeAllListeners("end");
    players.delete(voiceChannel.guild.id);
    queues.delete(voiceChannel.guild.id);
    logger.error(exception.error);
    const content = `🔊 Looks like there was an error regarding sound playback:\n\`\`\`${exception.type}: ${exception.error}\`\`\``;
    if (options.type === "classic") {
      await client.createMessage(options.channel.id, content);
    } else {
      await options.interaction.createMessage(content);
    }
  });
  connection.on("stuck", () => {
    const nodeName = manager.getNode().name;
    connection.move(nodeName);
    connection.resume();
  });
  connection.on("end", async (data) => {
    if (data.reason === "REPLACED") return;
    let queue = queues.get(voiceChannel.guild.id);
    const player = players.get(voiceChannel.guild.id);
    if (player && process.env.STAYVC === "true") {
      player.type = "idle";
      players.set(voiceChannel.guild.id, player);
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
    queues.set(voiceChannel.guild.id, newQueue);
    if (newQueue.length !== 0) {
      const newTrack = await connection.node.rest.decode(newQueue[0]);
      nextSong(client, options, connection, newQueue[0], newTrack, music, voiceChannel, host, player.loop, player.shuffle, track);
      try {
        if (newQueue[0] !== track && playingMessage.channel.messages.has(playingMessage.id)) await playingMessage.delete();
        if (newQueue[0] !== track && player.playMessage.channel.messages.has(player.playMessage.id)) await player.playMessage.delete();
      } catch {
        // no-op
      }
    } else if (process.env.STAYVC !== "true") {
      connection.node.leaveChannel(voiceChannel.guild.id);
      players.delete(voiceChannel.guild.id);
      queues.delete(voiceChannel.guild.id);
      skipVotes.delete(voiceChannel.guild.id);
      const content = "🔊 The current voice channel session has ended.";
      if (options.type === "classic") {
        await client.createMessage(options.channel.id, content);
      } else {
        await options.interaction.createMessage(content);
      }
      try {
        if (playingMessage.channel.messages.has(playingMessage.id)) await playingMessage.delete();
        if (player?.playMessage.channel.messages.has(player.playMessage.id)) await player.playMessage.delete();
      } catch {
        // no-op
      }
    } else {
      try {
        if (playingMessage.channel.messages.has(playingMessage.id)) await playingMessage.delete();
        if (player?.playMessage.channel.messages.has(player.playMessage.id)) await player.playMessage.delete();
      } catch {
        // no-op
      }
    }
  });
}
