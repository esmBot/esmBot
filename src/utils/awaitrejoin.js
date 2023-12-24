// this is a method to wait for someone to rejoin a voice channel
import { EventEmitter } from "node:events";
import { random } from "./misc.js";

class AwaitRejoin extends EventEmitter {
  /**
   * @param {import("oceanic.js").VoiceChannel | import("oceanic.js").StageChannel} channel
   * @param {boolean} anyone
   * @param {string} memberID
   */
  constructor(channel, anyone, memberID) {
    super();
    this.member = memberID;
    this.anyone = anyone;
    this.channel = channel;
    this.ended = false;
    this.bot = channel.client;
    this.listener = (member, newChannel) => this.verify(member, newChannel);
    this.bot.on("voiceChannelJoin", this.listener);
    this.bot.on("voiceChannelSwitch", this.listener);
    this.stopTimeout = setTimeout(() => this.stop(), 10000);
    this.checkInterval = setInterval(() => this.verify({ id: memberID }, channel, true), 1000);
  }

  /**
   * @param {import("oceanic.js").Member | { id: string; }} member
   * @param {{ id: string; }} channel
   * @param {boolean} [checked]
   */
  verify(member, channel, checked) {
    if (this.channel.id === channel.id) {
      if ((this.member === member.id && this.channel.voiceMembers.has(member.id)) || (this.anyone && !checked)) {
        clearTimeout(this.stopTimeout);
        this.stop(member, true);
        return true;
      }
      const filteredMembers = this.channel.voiceMembers.filter((i) => i.id !== this.bot.user.id && !i.bot);
      if (this.anyone && (!checked || filteredMembers.length > 0)) {
        clearTimeout(this.stopTimeout);
        this.stop(random(filteredMembers), true);
        return true;
      }
    } else {
      return false;
    }
  }

  /**
   * @param {import("oceanic.js").Member | { id: string; }} [member]
   * @param {boolean} [rejoined]
   */
  stop(member, rejoined = false) {
    if (this.ended) return;
    this.ended = true;
    clearInterval(this.checkInterval);
    this.bot.removeListener("voiceChannelJoin", this.listener);
    this.bot.removeListener("voiceChannelSwitch", this.listener);
    this.emit("end", rejoined, member);
  }
}

export default AwaitRejoin;