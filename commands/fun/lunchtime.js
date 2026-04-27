import { Buffer } from "node:buffer";
import sharp from "sharp";
import Command from "#cmd-classes/command.js";

const FOOD_EMOJIS = [
  "\ud83e\udd6a",
  "\ud83c\udf71",
  "\ud83c\udf54",
  "\ud83c\udf55",
  "\ud83e\udd57",
  "\ud83c\udf5c",
  "\ud83c\udf5f",
  "\ud83c\udf2e",
];

function randomEmojiGroup(length) {
  return Array.from({ length }, () => FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)]).join("");
}

class LunchCommand extends Command {
  async run() {
    const invitee = this.getOptionUser("user") ?? this.message?.mentions.users[0];
    if (!invitee) {
      this.success = false;
      return "Please mention someone to invite to lunch.";
    }

    const leftEmojis = randomEmojiGroup(3);
    const rightEmojis = randomEmojiGroup(3);
    const image = await createLunchImage();
    const description =
      `${leftEmojis} Hi <@${invitee.id}>, you have been invited to lunch by ` +
      `<@${this.author.id}>, you must accept! ${rightEmojis}`;

    return {
      content: `<@${invitee.id}>`,
      allowedMentions: {
        users: [invitee.id],
      },
      embeds: [
        {
          description,
          color: 0xf4a261,
          image: {
            url: "attachment://lunch-invite.png",
          },
        },
      ],
      files: [
        {
          contents: image,
          name: "lunch-invite.png",
        },
      ],
    };
  }

  static flags = [
    {
      name: "user",
      type: "user",
      description: "The user to invite to lunch",
      classic: true,
      required: true,
    },
  ];

  static description = "Invites someone to lunch";
  static aliases = ["lunch"];
}

async function createLunchImage() {
  const width = 1200;
  const height = 675;
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff7e6"/>
          <stop offset="52%" stop-color="#f6d365"/>
          <stop offset="100%" stop-color="#fda085"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#6b3f1d" flood-opacity="0.28"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <circle cx="1060" cy="110" r="86" fill="rgba(255,255,255,0.35)"/>
      <circle cx="145" cy="560" r="110" fill="rgba(255,255,255,0.28)"/>
      <text x="600" y="112" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800" fill="#4f2d18">Lunch invite</text>
      <g filter="url(#shadow)" transform="translate(205 175)">
        <ellipse cx="395" cy="365" rx="390" ry="58" fill="rgba(99,59,31,0.18)"/>
        <path d="M102 235 C140 85 650 50 700 230 C710 275 650 300 400 300 C150 300 88 275 102 235 Z" fill="#f4b35b"/>
        <path d="M130 220 C190 115 600 92 668 220 C575 250 225 252 130 220 Z" fill="#ffd48a"/>
        <path d="M122 305 C210 360 592 360 680 305 L642 405 C560 468 242 468 160 405 Z" fill="#d8843f"/>
        <path d="M152 302 C250 338 552 338 650 302 L615 382 C530 425 270 425 185 382 Z" fill="#fff0c8"/>
        <path d="M138 284 C210 250 610 248 680 284 C625 326 194 326 138 284 Z" fill="#6fbf5f"/>
        <path d="M150 276 C222 230 590 230 662 276 C580 302 232 302 150 276 Z" fill="#d83f31"/>
        <path d="M170 260 C250 212 565 212 640 260 C552 282 258 282 170 260 Z" fill="#f6d365"/>
        <circle cx="255" cy="153" r="12" fill="#8a5428"/>
        <circle cx="360" cy="130" r="10" fill="#8a5428"/>
        <circle cx="478" cy="142" r="11" fill="#8a5428"/>
        <circle cx="585" cy="166" r="10" fill="#8a5428"/>
        <circle cx="428" cy="195" r="9" fill="#8a5428"/>
      </g>
      <text x="600" y="606" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#5f3b1f">sandwich status: secured</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export default LunchCommand;
