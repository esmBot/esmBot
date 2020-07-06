const client = require("./client.js");
const logger = require("./logger.js");
const paginator = require("./pagination/pagination.js");
const fetch = require("node-fetch");
const moment = require("moment");
require("moment-duration-format");
const { Manager } = require("@lavacord/eris");

const nodes = require("../lavanodes.json");

exports.players = new Map();

const queues = new Map();
const skipVotes = new Map();

exports.manager;

exports.status = false;

exports.checkStatus = async () => {
  const statuses = [];
  for (const node of nodes) {
    try {
      const response = await fetch(`http://${node.host}:${node.port}/version`, { headers: { Authorization: node.password } }).then(res => res.text());
      if (response) statuses.push(false);
    } catch {
      statuses.push(true);
    }
  }
  const result = statuses.filter(Boolean);
  this.status = result.length > 0 ? true : false;
  return this.status;
};

exports.connect = async () => {
  this.manager = new Manager(client, nodes, {
    user: client.user.id
  });
  const { length } = await this.manager.connect();
  logger.log(`Successfully connected to ${length} Lavalink node(s).`);
  this.manager.on("error", (error, node) => {
    logger.error(`An error occurred on Lavalink node ${node}: ${error}`);
  });
};

exports.play = async (sound, message, music = false) => {
  if (!message.member.voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  if (!message.channel.guild.members.get(client.user.id).permission.has("voiceConnect") || !message.channel.permissionsOf(client.user.id).has("voiceConnect")) return client.createMessage(message.channel.id, `${message.author.mention}, I can't join this voice channel!`);
  const voiceChannel = message.channel.guild.channels.get(message.member.voiceState.channelID);
  if (!voiceChannel.permissionsOf(client.user.id).has("voiceConnect")) return client.createMessage(message.channel.id, `${message.author.mention}, I don't have permission to join this voice channel!`);
  if (!music && this.manager.voiceStates.has(message.channel.guild.id) && this.players.get(message.channel.guild.id).type === "music") return client.createMessage(message.channel.id, `${message.author.mention}, I can't play a sound effect while playing music!`);
  const node = this.manager.idealNodes[0];
  const { tracks } = await fetch(`http://${node.host}:${node.port}/loadtracks?identifier=${sound}`, { headers: { Authorization: node.password } }).then(res => res.json());
  const connection = await this.manager.join({
    guild: voiceChannel.guild.id,
    channel: voiceChannel.id,
    node: node.id
  });
  const oldQueue = queues.get(voiceChannel.guild.id);
  console.log(tracks);
  queues.set(voiceChannel.guild.id, oldQueue ? [...oldQueue, tracks[0].track] : [tracks[0].track]);

  if (oldQueue) {
    client.createMessage(message.channel.id, `${message.author.mention}, your tune has been added to the queue!`);
  } else {
    this.nextSong(message, connection, tracks[0].track, tracks[0].info, music, voiceChannel);
  }
};

exports.nextSong = async (message, connection, track, info, music, voiceChannel) => {
  const parts = Math.floor((0 / info.length) * 10);
  const playingMessage = await client.createMessage(message.channel.id, !music ? "🔊 Playing sound..." : {
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
        "value": `${moment.duration(0).format("m:ss", { trim: false })}/${info.isStream ? "∞" : moment.duration(info.length).format("m:ss", { trim: false })}`
      }]
    }
  });
  await connection.play(track);
  this.players.set(voiceChannel.guild.id, { player: connection, type: music ? "music" : "sound", host: message.author.id, voiceChannel: voiceChannel, originalChannel: message.channel });
  connection.on("error", (error) => {
    playingMessage.delete();
    this.manager.leave(voiceChannel.guild.id);
    this.players.delete(voiceChannel.guild.id);
    queues.delete(voiceChannel.guild.id);
    throw error;
  });
  connection.once("end", async (data) => {
    if (data.reason === "REPLACED") return;
    const queue = queues.get(voiceChannel.guild.id);
    const newQueue = queue.slice(1);
    queues.set(voiceChannel.guild.id, newQueue);
    await playingMessage.delete();
    if (newQueue.length === 0) {
      this.manager.leave(voiceChannel.guild.id);
      this.players.delete(voiceChannel.guild.id);
      queues.delete(voiceChannel.guild.id);
      await client.createMessage(message.channel.id, "🔊 The current voice channel session has ended.");
    } else {
      const track = await fetch(`http://${connection.node.host}:${connection.node.port}/decodetrack?track=${encodeURIComponent(newQueue[0])}`, { headers: { Authorization: connection.node.password } }).then(res => res.json());
      this.nextSong(message, connection, newQueue[0], track, music, voiceChannel);
    }
  });
};

exports.stop = async (message) => {
  if (!message.member.voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, I'm not in a voice channel!`);
  if (this.players.get(message.channel.guild.id).host !== message.author.id) return client.createMessage(message.channel.id, `${message.author.mention}, only the current voice session host can stop the music!`);
  this.players.delete(message.channel.guild.id);
  this.manager.leave(message.channel.guild.id);
  await client.createMessage(message.channel.id, "🔊 The current voice channel session has ended.");
};

exports.skip = async (message) => {
  if (!message.member.voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, I'm not in a voice channel!`);
  const player = this.players.get(message.channel.guild.id);
  if (player.host !== message.author.id) {
    const voteCount = skipVotes.has(message.guild.id) ? skipVotes.get(message.guild.id) : 0;
    if (voteCount + 1 === 3) {
      player.player.stop(message.channel.guild.id);
      skipVotes.set(message.guild.id, 0);
    } else {
      await client.createMessage(message.channel.id, `🔊 Voted to skip song (${voteCount + 1}/3 people have voted).`);
      skipVotes.set(message.guild.id, voteCount + 1);
    }
  } else {
    player.player.stop(message.channel.guild.id);
  }
};

exports.pause = async (message) => {
  if (!message.member.voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, I'm not in a voice channel!`);
  if (this.players.get(message.channel.guild.id).host !== message.author.id) return client.createMessage(message.channel.id, `${message.author.mention}, only the current voice session host can pause/resume the music!`);
  const player = this.players.get(message.channel.guild.id).player;
  player.pause(!player.paused ? true : false);
  await client.createMessage(message.channel.id, `🔊 The player has been ${!player.paused ? "paused" : "resumed"}.`);
};

exports.playing = async (message) => {
  if (!message.member.voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, I'm not in a voice channel!`);
  const player = this.players.get(message.channel.guild.id).player;
  if (!player) return client.createMessage(message.channel.id, `${message.author.mention}, I'm not playing anything!`);
  const track = await fetch(`http://${player.node.host}:${player.node.port}/decodetrack?track=${encodeURIComponent(player.track)}`, { headers: { Authorization: player.node.password } }).then(res => res.json());
  const parts = Math.floor((player.state.position / track.length) * 10);
  await client.createMessage(message.channel.id, {
    "embed": {
      "color": 16711680,
      "author": {
        "name": "Now Playing",
        "icon_url": client.user.avatarURL
      },
      "fields": [{
        "name": "ℹ️ Title:",
        "value": track.title
      },
      {
        "name": "🎤 Artist:",
        "value": track.author
      },
      {
        "name": "💬 Channel:",
        "value": message.channel.guild.channels.get(message.member.voiceState.channelID).name
      },
      {
        "name": `${"▬".repeat(parts)}🔘${"▬".repeat(10 - parts)}`,
        "value": `${moment.duration(player.state.position).format("m:ss", { trim: false })}/${track.isStream ? "∞" : moment.duration(track.length).format("m:ss", { trim: false })}`
      }]
    }
  });
};

exports.queue = async (message) => {
  if (!message.member.voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, you need to be in a voice channel first!`);
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return client.createMessage(message.channel.id, `${message.author.mention}, I'm not in a voice channel!`);
  if (!message.channel.guild.members.get(client.user.id).permission.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
  if (!message.channel.guild.members.get(client.user.id).permission.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
  const queue = queues.get(message.channel.guild.id);
  const player = this.players.get(message.channel.guild.id).player;
  const tracks = await fetch(`http://${player.node.host}:${player.node.port}/decodetracks`, { method: "POST", body: JSON.stringify(queue), headers: { Authorization: player.node.password, "Content-Type": "application/json" } }).then(res => res.json());
  const trackList = [];
  const firstTrack = tracks.shift();
  for (const [i, track] of tracks.entries()) {
    trackList.push(`${i + 1}. ${track.info.author} - **${track.info.title}** (${track.info.isStream ? "∞" : moment.duration(track.info.length).format("m:ss", { trim: false })})`);
  }
  const pageSize = 5;
  const embeds = [];
  const groups = trackList.map((item, index) => {
    return index % pageSize === 0 ? trackList.slice(index, index + pageSize) : null;
  }).filter(Boolean);
  for (const [i, value] of groups.entries()) {
    embeds.push({
      "embed": {
        "author": {
          "name": "Queue",
          "icon_url": client.user.avatarURL
        },
        "color": 16711680,
        "footer": {
          "text": `Page ${i + 1} of ${groups.length}`
        },
        "fields": [{
          "name": "🎶 Now Playing",
          "value": `${firstTrack.info.author} - **${firstTrack.info.title}** (${firstTrack.info.isStream ? "∞" : moment.duration(firstTrack.info.length).format("m:ss", { trim: false })})`
        }, {
          "name": "🗒️ Queue",
          "value": value.join("\n")
        }]
      }
    });
  }
  if (embeds.length === 0) return `${message.author.mention}, there's nothing in the queue!`;
  return paginator(message, embeds);
};