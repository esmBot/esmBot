import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const captionPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "assets", "captions", "skuub-captions.txt");

const templates = [
  "how skuub DOES look {action}",
  "how skuub IS moving with {item}",
  "how skuub feels {action}",
  "how skuub thinks he looks {action}",
  "skuub at {score} with {money} explaining why he needs {item}",
  "skuub at {score} with {money}",
  "skuub being greeted at {place} after {group} saw his {thing}",
  "skuub in residency after the nurses saw his {thing}",
  "skuub checking out the \"{itemName}\" item",
  "skuub when you ask him to {request}",
  "skuub seeing {item} in the enemies hands",
  "skuub threatening to {request}",
  "when you realise skuub is {action}",
  "when you in a good mood so you join skuub on his {thing}",
  "skuubs hud telling him its {score} so he has to {forcedAction}",
  "do I even need to say it: skuub has equipped the \"{itemName}\"",
];

const phraseBanks = {
  action: [
    "buying the awp",
    "clearing toilets",
    "joining the team on the site defence",
    "walking through a smoke in a 1v1",
    "saving after legging one guy mid",
    "button mashing when he sees the big green",
    "pushing with the smoke with a zeus",
    "throwing the game",
    "reaching bird state",
    "clutching the round with the mag-7",
    "pretending to listen to the save call",
    "following Cameron so he can bait him",
  ],
  group: ["the class", "the nurses", "the team", "the enemies", "the site defence"],
  item: ["the awp", "the mag-7", "the big green", "the sawed off", "a zeus", "the high explosive grenade", "EA FC 26"],
  itemName: ["awp", "mag-7", "big green", "sawed off", "zeus", "high explosive grenade", "EA FC 26"],
  forcedAction: [
    "buy the awp",
    "save",
    "rotate",
    "push with a zeus",
    "build a fort first",
    "clear toilets",
    "walk through a smoke in a 1v1",
  ],
  money: ["$800", "$1050", "$4750"],
  place: ["school", "residency", "bossmanLAN kadikoy", "window", "b site"],
  request: ["buy a rifle", "buy the awp", "rotate", "save", "build a fort first", "install EA FC 26"],
  score: ["12-11", "11-12"],
  thing: ["leetify", "faceit premium clip", "awp skill", "shotgun adventures", "ninja defuse", "mag-7 clip"],
};

let cachedCaptions: string[] | undefined;

export async function getSkuubCaptions() {
  if (!cachedCaptions) {
    const text = await readFile(captionPath, "utf8");
    cachedCaptions = text
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return cachedCaptions;
}

export async function generateSkuubCaptionIdea() {
  const sourceCaptions = await getSkuubCaptions();

  for (let attempt = 0; attempt < 12; attempt++) {
    const caption = fillTemplate(randomEntry(templates));
    if (isUsableCaption(caption, sourceCaptions)) return caption;
  }

  return randomEntry(sourceCaptions);
}

function fillTemplate(template: string) {
  return template.replaceAll(/\{(\w+)\}/g, (_match, key: keyof typeof phraseBanks) => {
    const bank = phraseBanks[key];
    return bank ? randomEntry(bank) : "";
  });
}

function isUsableCaption(caption: string, sourceCaptions: string[]) {
  const normalized = normalize(caption);
  return caption.length >= 18 && caption.length <= 160 && !sourceCaptions.some((source) => normalize(source) === normalized);
}

function normalize(text: string) {
  return text.toLowerCase().replaceAll(/\s+/g, " ").trim();
}

function randomEntry<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}
