import { Buffer } from "node:buffer";
import Command from "#cmd-classes/command.js";

const QURAN_SURAH_COUNT = 114;
const DISCORD_MESSAGE_LIMIT = 2000;
const FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1200&q=80";
const BISMILLAH_ARABIC =
  "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650";

class BismillahCommand extends Command {
  async run() {
    await this.acknowledge();

    const surah = await fetchRandomSurahArabic();
    const image = await createBismillahImage(surah);
    const content = `${formatSurahArabic(surah)}\nSource: <https://quran.com/${surah.number}>`;
    const embed = {
      image: {
        url: image ? "attachment://bismillah.png" : FALLBACK_IMAGE_URL,
      },
    };

    return {
      content,
      embeds: [embed],
      files: image ? [{ contents: image, name: "bismillah.png" }] : [],
    };
  }

  static description = "Sends one full Arabic surah with a related image";
}

async function fetchRandomSurahArabic() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const surahNumber = Math.floor(Math.random() * QURAN_SURAH_COUNT) + 1;
    const surah = await fetchSurahArabic(surahNumber);
    const content = `${formatSurahArabic(surah)}\nSource: <https://quran.com/${surah.number}>`;

    if (content.length <= DISCORD_MESSAGE_LIMIT) return surah;
  }

  return fetchSurahArabic(1);
}

async function fetchSurahArabic(surahNumber) {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);

  if (!response.ok) {
    throw new Error(`Surah request failed: ${response.status}`);
  }

  const payload = await response.json();
  const surah = payload.data;

  if (!surah?.number || !surah?.ayahs?.length) {
    throw new Error("Quran response did not include a surah.");
  }

  return surah;
}

function formatSurahArabic(surah) {
  const lines = [`Surah ${surah.number}: ${surah.name}`, ""];

  for (const ayah of surah.ayahs) {
    lines.push(`${surah.number}:${ayah.numberInSurah} ${ayah.text}`);
  }

  return lines.join("\n");
}

async function createBismillahImage(surah) {
  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    return;
  }

  const width = 1200;
  const height = 675;
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#102a24"/>
          <stop offset="55%" stop-color="#1f6f5b"/>
          <stop offset="100%" stop-color="#d4af37"/>
        </linearGradient>
        <pattern id="pattern" width="96" height="96" patternUnits="userSpaceOnUse">
          <path d="M48 4 L92 48 L48 92 L4 48 Z" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3"/>
          <circle cx="48" cy="48" r="18" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#pattern)"/>
      <rect x="70" y="70" width="1060" height="535" rx="34" fill="rgba(5,18,15,0.56)" stroke="rgba(255,255,255,0.24)" stroke-width="2"/>
      <text x="600" y="240" text-anchor="middle" direction="rtl" unicode-bidi="bidi-override" font-family="Arial, 'Times New Roman', serif" font-size="62" fill="#fff">${escapeXml(BISMILLAH_ARABIC)}</text>
      <text x="600" y="345" text-anchor="middle" direction="rtl" unicode-bidi="bidi-override" font-family="Arial, 'Times New Roman', serif" font-size="48" fill="#f7e7a3">${escapeXml(surah.name)}</text>
      <text x="600" y="430" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#ffffff">Surah ${surah.number} - ${escapeXml(surah.englishName || "Quran")}</text>
      <text x="600" y="490" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="rgba(255,255,255,0.78)">quran.com/${surah.number}</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default BismillahCommand;
