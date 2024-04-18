// this is a method to wait for someone to rejoin a voice channel
import { EventEmitter } from "node:events";
import { random } from "./misc.js";

class AwaitRejoin extends EventEmitter {
  constructor(channel, anyone, memberID) {
    super();
    this.member = memberID;
    this.anyone = anyone;
    this.channel = channel;
    this.rejoined = false;
    this.ended = false;
    this.bot = channel.client;
    this.listener = (member, newChannel) => this.verify(member, newChannel);
    this.bot.on("voiceChannelJoin", this.listener);
    this.bot.on("voiceChannelSwitch", this.listener);
    this.stopTimeout = setTimeout(() => this.stop(), 10000);
    this.checkInterval = setInterval(() => this.verify({ id: memberID }, channel, true), 1000);
  }

  verify(member, channel, checked) {
    if (this.channel.id === channel.id) {
      if ((this.member === member.id && this.channel.voiceMembers.has(member.id)) || (this.anyone && !checked)) {
        clearTimeout(this.stopTimeout);
        this.rejoined = true;
        this.stop(member);
        return true;
      } else if (this.anyone && (!checked || this.channel.voiceMembers.size > 1)) {
        clearTimeout(this.stopTimeout);
        this.rejoined = true;
        this.stop(random(this.channel.voiceMembers.filter((i) => i.id !== this.bot.user.id && !i.bot)));
        return true;
      }
    } else {
      return false;
    }
  }

  stop(member) {
    if (this.ended) return;
    this.ended = true;
    clearInterval(this.checkInterval);
    this.bot.removeListener("voiceChannelJoin", this.listener);
    this.bot.removeListener("voiceChannelSwitch", this.listener);
    this.emit("end", this.rejoined, member);
  }
}

export default AwaitRejoin;