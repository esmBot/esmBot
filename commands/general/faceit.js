import process from "node:process";
import Command from "#cmd-classes/command.js";

const FACEIT_TIMEOUT_MS = 15000;

class FaceitCommand extends Command {
  async run() {
    const nickname = (this.getOptionString("nickname") ?? this.args.join(" ")).trim();
    const apiKey = process.env.FACEIT_API_KEY;

    if (!nickname) return "Provide a FACEIT nickname.";
    if (!apiKey) return "FACEIT_API_KEY is not set.";

    await this.acknowledge();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FACEIT_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(`https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname)}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") return "FACEIT request timed out.";
      return "FACEIT request failed before a response was received.";
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 404) return `No FACEIT profile found for "${this.clean(nickname)}".`;
    if (!response.ok) return `FACEIT request failed (${response.status}).`;

    const player = await response.json();
    const cs2 = player?.games?.cs2 ?? player?.games?.csgo;

    if (!cs2) return `Found ${this.clean(player.nickname ?? nickname)}, but no CS2/CS:GO FACEIT rank is available.`;

    const resolvedNickname = this.clean(player.nickname ?? nickname);
    const skillLevel = Number(cs2.skill_level);
    const faceitElo = Number(cs2.faceit_elo);

    let changeLine = "Tracking: **disabled** (no database configured)";
    if (!Number.isFinite(skillLevel) || !Number.isFinite(faceitElo)) {
      changeLine = "Tracking: **unavailable** (invalid rank data from FACEIT)";
    } else if (this.database) {
      const trackingKey = (player.nickname ?? nickname).toLowerCase();
      const previous = await this.database.getFaceitTracking(trackingKey);
      await this.database.setFaceitTracking(trackingKey, skillLevel, faceitElo);

      if (!previous) {
        changeLine = "Tracking: **started** (baseline saved)";
      } else if (skillLevel > previous.skill_level || faceitElo > previous.faceit_elo) {
        changeLine = `Rank update: **ranked up** (Level ${previous.skill_level} -> ${skillLevel}, ELO ${previous.faceit_elo} -> ${faceitElo})`;
      } else if (skillLevel < previous.skill_level || faceitElo < previous.faceit_elo) {
        changeLine = `Rank update: **ranked down** (Level ${previous.skill_level} -> ${skillLevel}, ELO ${previous.faceit_elo} -> ${faceitElo})`;
      } else {
        changeLine = "Rank update: **no change**";
      }
    }

    return `FACEIT for **${resolvedNickname}**\nLevel: **${cs2.skill_level ?? "N/A"}**\nELO: **${cs2.faceit_elo ?? "N/A"}**\nRegion: **${cs2.region ?? "N/A"}**\n${changeLine}`;
  }

  static flags = [
    {
      name: "nickname",
      type: "string",
      description: "The FACEIT nickname to look up",
      required: true,
      classic: true,
    },
  ];

  static description = "Gets a user's FACEIT rank";
  static aliases = ["fct", "faceitrank"];
}

export default FaceitCommand;
