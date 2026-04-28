import { Buffer } from "node:buffer";
import Command from "#cmd-classes/command.js";

const VERDICTS = [
  {
    label: "Mashallah Certified",
    color: 0x2ecc71,
    minConfidence: 82,
    notes: [
      "Passed the vibe inspection.",
      "The paperwork is glowing.",
      "Approved with enthusiastic nodding.",
    ],
  },
  {
    label: "Probably Halal",
    color: 0x27ae60,
    minConfidence: 70,
    notes: [
      "Looks acceptable from across the room.",
      "No alarms were triggered.",
      "The inspector is cautiously pleased.",
    ],
  },
  {
    label: "Questionable",
    color: 0xf1c40f,
    minConfidence: 45,
    notes: [
      "Proceed with caution.",
      "The file has been placed on a very serious desk.",
      "Something about this requires further staring.",
    ],
  },
  {
    label: "Needs Scholar Review",
    color: 0xe67e22,
    minConfidence: 55,
    notes: [
      "The council must convene.",
      "A clipboard has been requested.",
      "The ruling has entered committee.",
    ],
  },
  {
    label: "Astaghfirullah",
    color: 0xe74c3c,
    minConfidence: 68,
    notes: [
      "This one is spiritually loud.",
      "The inspection room went silent.",
      "Several eyebrows were raised.",
    ],
  },
  {
    label: "Haram Police Alert",
    color: 0xc0392b,
    minConfidence: 76,
    notes: [
      "Sirens were heard in the distance.",
      "The clipboard has been dropped.",
      "A strongly worded stamp has been applied.",
    ],
  },
  {
    label: "Halal, but Emotionally Suspicious",
    color: 0x9b59b6,
    minConfidence: 60,
    notes: [
      "Technically cleared, spiritually confusing.",
      "No violation found, but the vibes are unusual.",
      "Approved, pending emotional audit.",
    ],
  },
  {
    label: "Pending Moon Sighting",
    color: 0x3498db,
    minConfidence: 50,
    notes: [
      "Check back after sunset.",
      "The sky department has been contacted.",
      "Final answer depends on atmospheric drama.",
    ],
  },
  {
    label: "Certified After Maghrib",
    color: 0x1abc9c,
    minConfidence: 64,
    notes: [
      "Timing is everything.",
      "Approved, but only when the lighting improves.",
      "The evening committee has spoken.",
    ],
  },
];

function randomEntry(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomConfidence(min) {
  return min + Math.floor(Math.random() * (101 - min));
}

class HalalCheckCommand extends Command {
  async run() {
    await this.acknowledge();

    const verdict = randomEntry(VERDICTS);
    const confidence = randomConfidence(verdict.minConfidence);
    const note = randomEntry(verdict.notes);
    const image = await createCertificateImage(verdict, confidence, note);

    return {
      embeds: [
        {
          title: "HalalCheck",
          description: `**Verdict:** ${verdict.label}\n**Confidence:** ${confidence}%\n**Notes:** ${note}`,
          color: verdict.color,
          image: image ? { url: "attachment://halalcheck.png" } : undefined,
          footer: {
            text: "Not a fatwa",
          },
        },
      ],
      files: image ? [{ contents: image, name: "halalcheck.png" }] : [],
    };
  }

  static description = "Runs a random halal vibe inspection";
  static aliases = ["halal", "haramcheck"];
}

async function createCertificateImage(verdict, confidence, note) {
  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    return;
  }

  const width = 1200;
  const height = 675;
  const mainColor = colorToHex(verdict.color);
  const darkColor = darkenColor(verdict.color, 0.42);
  const label = escapeXml(verdict.label.toUpperCase());
  const escapedNote = escapeXml(note);

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${darkColor}"/>
          <stop offset="55%" stop-color="${mainColor}"/>
          <stop offset="100%" stop-color="#f7f0d4"/>
        </linearGradient>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M0 36 H72 M36 0 V72" stroke="rgba(255,255,255,0.11)" stroke-width="2"/>
          <circle cx="36" cy="36" r="10" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="2"/>
        </pattern>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000000" flood-opacity="0.25"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      <rect x="76" y="58" width="1048" height="559" rx="28" fill="rgba(255,255,255,0.86)" stroke="rgba(39,36,25,0.38)" stroke-width="3" filter="url(#shadow)"/>
      <rect x="112" y="95" width="976" height="485" rx="18" fill="none" stroke="${mainColor}" stroke-width="8"/>
      <text x="600" y="160" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800" fill="#26231b">HALALCHECK</text>
      <text x="600" y="210" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#5a5545">OFFICIAL VIBE INSPECTION RESULT</text>
      <g transform="translate(600 355) rotate(-9)">
        <rect x="-415" y="-82" width="830" height="164" rx="22" fill="rgba(255,255,255,0.58)" stroke="${mainColor}" stroke-width="10"/>
        <text x="0" y="18" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="${label.length > 24 ? 50 : 62}" font-weight="900" fill="${mainColor}">${label}</text>
      </g>
      <circle cx="914" cy="434" r="91" fill="none" stroke="${mainColor}" stroke-width="9"/>
      <circle cx="914" cy="434" r="70" fill="rgba(255,255,255,0.42)" stroke="${mainColor}" stroke-width="3"/>
      <text x="914" y="424" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#26231b">${confidence}%</text>
      <text x="914" y="463" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="#5a5545">CONFIDENCE</text>
      <text x="600" y="515" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#342f22">${escapedNote}</text>
      <text x="600" y="555" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#6c6552">NOT A FATWA</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function colorToHex(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function darkenColor(color, factor) {
  const r = Math.floor(((color >> 16) & 255) * factor);
  const g = Math.floor(((color >> 8) & 255) * factor);
  const b = Math.floor((color & 255) * factor);
  return colorToHex((r << 16) | (g << 8) | b);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default HalalCheckCommand;
