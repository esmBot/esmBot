const client = require("./client.js");
const logger = require("./logger.js");
const paginator = require("./pagination/pagination.js");
const fetch = require("node-fetch");
const moment = require("moment");
require("moment-duration-format");
const { Manager } = require("@lavacord/eris");

let nodes = require("../servers.json").lava;

exports.players = new Map();

exports.queues = new Map();
const skipVotes = new Map();

exports.manager;

exports.status = false;

exports.connected = false;

exports.checkStatus = async () => {
  const newNodes = [];
  for (const node of nodes) {
    try {
      const response = await fetch(`http://${node.host}:${node.port}/version`, { headers: { Authorization: node.password } }).then(res => res.text());
      if (response) newNodes.push(node);
    } catch {
      logger.log(`Failed to get status of Lavalink node ${node.host}.`);
    }
  }
  nodes = newNodes;
  this.status = newNodes.length === 0 ? true : false;
  return this.status;
};

exports.connect = async () => {
  this.manager = new Manager(client, nodes, {
    user: client.user.id
  });
  const { length } = await this.manager.connect();
  logger.log(`Successfully connected to ${length} Lavalink node(s).`);
  exports.connected = true;
  this.manager.on("error", (error, node) => {
    logger.error(`An error occurred on Lavalink node ${node}: ${error}`);
  });
  return length;
};

exports.play = async (sound, message, music = false) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.voiceState.channelID) return `${message.author.mention}, you need to be in a voice channel first!`;
  if (!message.channel.guild.members.get(client.user.id).permissions.has("voiceConnect") || !message.channel.permissionsOf(client.user.id).has("voiceConnect")) return `${message.author.mention}, I can't join this voice channel!`;
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
  if (tracks.length === 0) return `${message.author.mention}, I couldn't find that song!`;
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
    return `${message.author.mention}, your tune has been added to the queue!`;
  } else {
    this.nextSong(message, connection, tracks[0].track, tracks[0].info, music, voiceChannel, player ? player.loop : false);
    return;
  }
};

exports.nextSong = async (message, connection, track, info, music, voiceChannel, loop = false, inQueue = false) => {
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
        const track = await fetch(`http://${connection.node.host}:${connection.node.port}/decodetrack?track=${encodeURIComponent(newQueue[0])}`, { headers: { Authorization: connection.node.password } }).then(res => res.json());
        this.nextSong(message, connection, newQueue[0], track, music, voiceChannel, isLooping, true);
        if (playingMessage.channel.messages.get(playingMessage.id)) await playingMessage.delete();
      }
    });
  }
};

exports.stop = async (message) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.voiceState.channelID) return `${message.author.mention}, you need to be in a voice channel first!`;
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return `${message.author.mention}, I'm not in a voice channel!`;
  if (this.players.get(message.channel.guild.id).host !== message.author.id) return `${message.author.mention}, only the current voice session host can stop the music!`;
  this.manager.leave(message.channel.guild.id);
  const connection = this.players.get(message.channel.guild.id).player;
  connection.destroy();
  this.players.delete(message.channel.guild.id);
  this.queues.delete(message.channel.guild.id);
  return "🔊 The current voice channel session has ended.";
};

exports.skip = async (message) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.voiceState.channelID) return `${message.author.mention}, you need to be in a voice channel first!`;
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return `${message.author.mention}, I'm not in a voice channel!`;
  const player = this.players.get(message.channel.guild.id);
  if (player.host !== message.author.id) {
    const votes = skipVotes.has(message.channel.guild.id) ? skipVotes.get(message.channel.guild.id) : { count: 0, ids: [] };
    if (votes.ids.includes(message.author.id)) return `${message.author.mention}, you've already voted to skip!`;
    const newObject = {
      count: votes.count + 1,
      ids: [...votes.ids, message.author.id].filter(item => !!item)
    };
    if (votes.count + 1 === 3) {
      player.player.stop(message.channel.guild.id);
      skipVotes.set(message.channel.guild.id, { count: 0, ids: [] });
    } else {
      skipVotes.set(message.channel.guild.id, newObject);
      return `🔊 Voted to skip song (${votes.count + 1}/3 people have voted).`;
    }
  } else {
    player.player.stop(message.channel.guild.id);
    return;
  }
};

exports.pause = async (message) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.voiceState.channelID) return `${message.author.mention}, you need to be in a voice channel first!`;
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return `${message.author.mention}, I'm not in a voice channel!`;
  if (this.players.get(message.channel.guild.id).host !== message.author.id) return `${message.author.mention}, only the current voice session host can pause/resume the music!`;
  const player = this.players.get(message.channel.guild.id).player;
  player.pause(!player.paused ? true : false);
  return `🔊 The player has been ${!player.paused ? "paused" : "resumed"}.`;
};

exports.playing = async (message) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.voiceState.channelID) return `${message.author.mention}, you need to be in a voice channel first!`;
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return `${message.author.mention}, I'm not in a voice channel!`;
  const player = this.players.get(message.channel.guild.id).player;
  if (!player) return `${message.author.mention}, I'm not playing anything!`;
  const track = await fetch(`http://${player.node.host}:${player.node.port}/decodetrack?track=${encodeURIComponent(player.track)}`, { headers: { Authorization: player.node.password } }).then(res => res.json());
  const parts = Math.floor((player.state.position / track.length) * 10);
  return {
    "embed": {
      "color": 16711680,
      "author": {
        "name": "Now Playing",
        "icon_url": client.user.avatarURL
      },
      "fields": [{
        "name": "ℹ️ Title:",
        "value": track.title ? track.title : "Unknown"
      },
      {
        "name": "🎤 Artist:",
        "value": track.author ? track.author : "Unknown"
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
  };
};

exports.queue = async (message) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.voiceState.channelID) return `${message.author.mention}, you need to be in a voice channel first!`;
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return `${message.author.mention}, I'm not in a voice channel!`;
  if (!message.channel.guild.members.get(client.user.id).permissions.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
  if (!message.channel.guild.members.get(client.user.id).permissions.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
  const queue = this.queues.get(message.channel.guild.id);
  const player = this.players.get(message.channel.guild.id);
  const tracks = await fetch(`http://${player.player.node.host}:${player.player.node.port}/decodetracks`, { method: "POST", body: JSON.stringify(queue), headers: { Authorization: player.player.node.password, "Content-Type": "application/json" } }).then(res => res.json());
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
  if (groups.length === 0) groups.push("del");
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
          "name": "🔁 Looping?",
          "value": player.loop ? "Yes" : "No"
        }, {
          "name": "🗒️ Queue",
          "value": value !== "del" ? value.join("\n") : "There's nothing in the queue!"
        }]
      }
    });
  }
  if (embeds.length === 0) return `${message.author.mention}, there's nothing in the queue!`;
  return paginator(message, embeds);
};

exports.loop = async (message) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.voiceState.channelID) return `${message.author.mention}, you need to be in a voice channel first!`;
  if (!message.channel.guild.members.get(client.user.id).voiceState.channelID) return `${message.author.mention}, I'm not in a voice channel!`;
  if (this.players.get(message.channel.guild.id).host !== message.author.id) return `${message.author.mention}, only the current voice session host can loop the music!`;
  const object = this.players.get(message.channel.guild.id);
  object.loop = !object.loop;
  this.players.set(message.channel.guild.id, object);
  return object.loop ? "🔊 The player is now looping." : "🔊 The player is no longer looping.";
};