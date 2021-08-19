// this is a method to wait for someone to rejoin a voice channel
import { EventEmitter } from "events";

class AwaitRejoin extends EventEmitter {
  constructor(channel, anyone, memberID) {
    super();
    this.member = memberID;
    this.anyone = anyone;
    this.channel = channel;
    this.rejoined = false;
    this.ended = false;
    this.bot = channel.guild ? channel.guild.shard.client : channel._client;
    this.listener = (member, newChannel) => this.verify(member, newChannel);
    this.bot.on("voiceChannelJoin", this.listener);
    this.bot.on("voiceChannelSwitch", this.listener);
    setTimeout(() => this.stop(), 10000);
  }

  verify(member, channel) {
    if (this.channel.id === channel.id) {
      if (this.member === member.id || this.anyone) {
        this.rejoined = true;
        this.stop(member);
        return true;
      }
    } else {
      return false;
    }
  }

  stop(member) {
    if (this.ended) return;
    this.ended = true;
    this.bot.removeListener("voiceChannelJoin", this.listener);
    this.bot.removeListener("voiceChannelSwitch", this.listener);
    this.emit("end", this.rejoined, member);
  }
}

export default AwaitRejoin;