const logger = require("./logger.js");
const fetch = require("node-fetch");
const fs = require("fs");
const day = require("dayjs");
const duration = require("dayjs/plugin/duration");
day.extend(duration);
const { Manager } = require("lavacord");

let nodes;

exports.players = new Map();
exports.queues = new Map();
exports.skipVotes = new Map();

exports.manager;
exports.status = false;
exports.connected = false;

exports.checkStatus = async () => {
  const json = await fs.promises.readFile("./servers.json", { encoding: "utf8" });
  nodes = JSON.parse(json).lava;
  const newNodes = [];
  for (const node of nodes) {
    try {
      const response = await fetch(`http://${node.host}:${node.port}/version`, { headers: { Authorization: node.password } }).then(res => res.text());
      if (response) newNodes.push(node);
    } catch {
      logger.error(`Failed to get status of Lavalink node ${node.host}.`);
    }
  }
  nodes = newNodes;
  this.status = newNodes.length === 0 ? true : false;
  return this.status;
};

exports.connect = async (client) => {
  this.manager = new Manager(nodes, {
    user: client.user.id,
    shards: client.shards.size || 1,
    send: (packet) => {
      const guild = client.guilds.get(packet.d.guild_id);
      if (!guild) return;
      return guild.shard.sendWS(packet.op, packet.d);
    }
  });
  const { length } = await this.manager.connect();
  logger.log(`Successfully connected to ${length} Lavalink node(s).`);
  exports.connected = true;
  this.manager.on("error", (error, node) => {
    logger.error(`An error occurred on Lavalink node ${node}: ${error}`);
  });
  return length;
};

exports.play = async (client, sound, message, music = false) => {
  if (!this.manager) return `${message.author.mention}, the sound commands are still starting up!`;
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.voiceState.channelID) return `${message.author.mention}, you need to be in a voice channel first!`;
  if (!message.channel.permissionsOf(client.user.id).has("voiceConnect")) return `${message.author.mention}, I can't join this voice channel!`;
  const voiceChannel = message.channel.guild.channels.get(message.member.voiceState.channelID);
  if (!voiceChannel.permissionsOf(client.user.id).has("voiceConnect")) return `${message.author.mention}, I don't have permission to join this voice channel!`;
  const player = this.players.get(message.channel.guild.id);
  if (!music && this.manager.voiceStates.has(message.channel.guild.id) && (player && player.type === "music")) return `${message.author.mention}, I can't play a sound effect while playing music!`;
  const node = this.manager.idealNodes[0];
  if (!music && !nodes.filter(obj => obj.host === node.host)[0].local) {
    sound = sound.replace(/\.\//, "https://raw.githubusercontent.com/esmBot/esmBot/master/");
  }
  const { tracks } = await fetch(`http://${node.host}:${node.port}/loadtracks?identifier=${sound}`, { headers: { Authorization: node.password } }).then(res => res.json());
  const oldQueue = this.queues.get(voiceChannel.guild.id);
  if (!tracks || tracks.length === 0) return `${message.author.mention}, I couldn't find that song!`;
  if (music) {
    this.queues.set(voiceChannel.guild.id, oldQueue ? [...oldQueue, tracks[0].track] : [tracks[0].track]);
  }
  let connection;
  if (player) {
    connection = player.player;
  } else {
    connection = await this.manager.join({
      guild: voiceChannel.guild.id,
      channel: voiceChannel.id,
      node: node.id
    });
  }

  if (oldQueue && music) {
    return `${message.author.mention}, your tune \`${tracks[0].info.title}\` has been added to the queue!`;
  } else {
    this.nextSong(client, message, connection, tracks[0].track, tracks[0].info, music, voiceChannel, player ? player.loop : false);
    return;
  }
};

exports.nextSong = async (client, message, connection, track, info, music, voiceChannel, loop = false, inQueue = false, lastTrack = null, oldPlaying = null) => {
  const parts = Math.floor((0 / info.length) * 10);
  let playingMessage;
  if (lastTrack === track) {
    playingMessage = oldPlaying;
  } else {
    playingMessage = await client.createMessage(message.channel.id, !music ? "🔊 Playing sound..." : {
      "embed": {
        "color": 16711680,
        "author": {
          "name": "Now Playing",
          "icon_url": client.user.avatarURL
        },
        "fields": [{
          "name": "ℹ️ Title:",
          "value": info.title
        },
        {
          "name": "🎤 Artist:",
          "value": info.author
        },
        {
          "name": "💬 Channel:",
          "value": voiceChannel.name
        },
        {
          "name": `${"▬".repeat(parts)}🔘${"▬".repeat(10 - parts)}`,
          "value": `${day.duration(0).format("m:ss", { trim: false })}/${info.isStream ? "∞" : day.duration(info.length).format("m:ss", { trim: false })}`
        }]
      }
    });
  }
  await connection.play(track);
  this.players.set(voiceChannel.guild.id, { player: connection, type: music ? "music" : "sound", host: message.author.id, voiceChannel: voiceChannel, originalChannel: message.channel, loop: loop });
  if (inQueue && connection.listeners("error").length === 0) {
    connection.on("error", (error) => {
      if (playingMessage.channel.messages.get(playingMessage.id)) playingMessage.delete();
      this.manager.leave(voiceChannel.guild.id);
      connection.destroy();
      this.players.delete(voiceChannel.guild.id);
      this.queues.delete(voiceChannel.guild.id);
      logger.error(error);
    });
  }
  if (connection.listeners("end").length === 0) {
    connection.on("end", async (data) => {
      if (data.reason === "REPLACED") return;
      const queue = this.queues.get(voiceChannel.guild.id);
      const isLooping = this.players.get(voiceChannel.guild.id).loop;
      let newQueue;
      if (isLooping) {
        queue.push(queue.shift());
        newQueue = queue;
      } else {
        newQueue = queue ? queue.slice(1) : [];
      }
      this.queues.set(voiceChannel.guild.id, newQueue);
      if (newQueue.length === 0) {
        this.manager.leave(voiceChannel.guild.id);
        connection.destroy();
        this.players.delete(voiceChannel.guild.id);
        this.queues.delete(voiceChannel.guild.id);
        if (music) await client.createMessage(message.channel.id, "🔊 The current voice channel session has ended.");
        if (playingMessage.channel.messages.get(playingMessage.id)) await playingMessage.delete();
      } else {
        const newTrack = await fetch(`http://${connection.node.host}:${connection.node.port}/decodetrack?track=${encodeURIComponent(newQueue[0])}`, { headers: { Authorization: connection.node.password } }).then(res => res.json());
        this.nextSong(client, message, connection, newQueue[0], newTrack, music, voiceChannel, isLooping, true, track, playingMessage);
        if (newQueue[0] !== track && playingMessage.channel.messages.get(playingMessage.id)) await playingMessage.delete();
      }
    });
  }
};