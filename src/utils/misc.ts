import { execFile as baseExecFile } from "node:child_process";
import process from "node:process";
import util from "node:util";
import { type Client, type Guild } from "oceanic.js";
import packageJson from "../../package.json" with { type: "json" };
import type { DatabasePlugin } from "../database.ts";
import { disconnect } from "./media.ts";

export async function getVers() {
  process.env.ESMBOT_VER = packageJson.version;
  const execFile = util.promisify(baseExecFile);

  process.env.GIT_REV = await execFile("git", ["rev-parse", "HEAD"]).then(
    (output) => output.stdout.substring(0, 7),
    () => "unknown commit",
  );
}

export function initLog() {
  console.log(`
     ,*\`$                    z\`"v
    F zBw\`%                 A ,W "W
  ,\` ,EBBBWp"%. ,-=~~==-,+*  4BBE  T
  M  BBBBBBBB* ,w=####Wpw  4BBBBB#  1
 F  BBBBBBBMwBBBBBBBBBBBBB#wXBBBBBH  E
 F  BBBBBBkBBBBBBBBBBBBBBBBBBBBE4BL  k
 #  BFBBBBBBBBBBBBF"      "RBBBW    F
  V ' 4BBBBBBBBBBM            TBBL  F
   F  BBBBBBBBBBF              JBB  L
   F  FBBBBBBBEB                BBL 4
   E  [BB4BBBBEBL               BBL 4
   I   #BBBBBBBEB              4BBH  *w
   A   4BBBBBBBBBEW,         ,BBBB  W  [
.A  ,k  4BBBBBBBBBBBEBW####BBBBBBM BF  F
k  <BBBw BBBBEBBBBBBBBBBBBBBBBBQ4BM  #
 5,  REBBB4BBBBB#BBBBBBBBBBBBP5BFF  ,F
   *w  \`*4BBW\`"FF#F##FFFF"\` , *   +"
      *+,   " F'"'*^~~~^"^\`  V+*^
          \`"""

esmBot ${process.env.ESMBOT_VER} (${process.env.GIT_REV})
`);
}

// random(array) to select a random entry in array
export function random<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

export async function exit(client: Client, database: DatabasePlugin | undefined) {
  client.disconnect(false);
  if (database) await database.stop();
  disconnect();
  if (process.env.API_TYPE !== "ws") {
    const { media } = await import("./mediaLib.ts");
    media.shutdown();
  }
  process.exit();
}

export function maxFileSize(guild: Guild | null) {
  let fileSize = 20971520;
  switch (guild?.premiumTier) {
    case 2:
      fileSize = 52428800;
      break;
    case 3:
      fileSize = 104857600;
      break;
  }
  return fileSize;
}

export function formatDuration(ms: number) {
  const days = Math.floor(ms / 86400000);
  const initDuration = new Date(ms).toISOString().slice(11, 19);
  return (days ? days + ":" : "") + initDuration;
}
