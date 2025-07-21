// this is a method to wait for someone to rejoin a voice channel
import {
  TypedEmitter,
  type Client,
  type Member,
  type StageChannel,
  type Uncached,
  type VoiceChannel,
} from "oceanic.js";
import { random } from "./misc.ts";

interface AwaitRejoinEvents {
  end: [member?: Member | Uncached];
}

class AwaitRejoin extends TypedEmitter<AwaitRejoinEvents> {
  member: string;
  anyone: boolean;
  channel: VoiceChannel | StageChannel;
  ended: boolean;
  bot: Client;
  listener: (member: Member, channel: VoiceChannel | StageChannel | Uncached) => boolean;
  stopTimeout: ReturnType<typeof setTimeout>;
  checkInterval: ReturnType<typeof setInterval>;
  constructor(client: Client, channel: VoiceChannel | StageChannel, anyone: boolean, memberID: string) {
    super();
    this.member = memberID;
    this.anyone = anyone;
    this.channel = channel;
    this.ended = false;
    this.bot = client;
    this.listener = (member, newChannel) => this.verify(member, newChannel);
    this.bot.on("voiceChannelJoin", this.listener);
    this.bot.on("voiceChannelSwitch", this.listener);
    this.stopTimeout = setTimeout(() => this.stop(), 10000);
    this.checkInterval = setInterval(() => this.verify({ id: memberID }, channel, true), 1000);
  }

  verify(member: Member | Uncached, channel: VoiceChannel | StageChannel | Uncached, checked = false) {
    if (this.channel.id === channel.id) {
      if (!("voiceMembers" in channel)) return false;
      if ((this.member === member.id && this.channel.voiceMembers.has(member.id)) || (this.anyone && !checked)) {
        clearTimeout(this.stopTimeout);
        this.stop(member);
        return true;
      }
      const filteredMembers = this.channel.voiceMembers.filter((i) => i.id !== this.bot.user.id && !i.bot);
      if (this.anyone && (!checked || filteredMembers.length > 0)) {
        clearTimeout(this.stopTimeout);
        this.stop(random(filteredMembers));
        return true;
      }
      return false;
    }
    return false;
  }

  stop(member?: Member | Uncached) {
    if (this.ended) return;
    this.ended = true;
    clearInterval(this.checkInterval);
    this.bot.removeListener("voiceChannelJoin", this.listener);
    this.bot.removeListener("voiceChannelSwitch", this.listener);
    this.emit("end", member);
  }
}

export default AwaitRejoin;
