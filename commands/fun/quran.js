import Command from "#cmd-classes/command.js";

const TOTAL_VERSES = 6236;

function toScript(text) {
  return [...text].map(c => {
    const u = c.codePointAt(0);
    if (u >= 65 && u <= 90) return String.fromCodePoint(u - 65 + 0x1D4D0);
    if (u >= 97 && u <= 122) return String.fromCodePoint(u - 97 + 0x1D4EA);
    return c;
  }).join("");
}

class QuranCommand extends Command {
  async run() {
    const verse = Math.floor(Math.random() * TOTAL_VERSES) + 1;
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${verse}/editions/quran-uthmani,en.asad`);
    if (!res.ok) return "Failed to fetch verse.";
    const { data } = await res.json();
    const arabic = data[0];
    const english = data[1];
    const title = toScript(`${english.surah.englishName} ${english.surah.number}:${english.numberInSurah}`);
    const payload = {
      embeds: [{
        title: `☪️☪️✨ ${title} ✨☪️☪️`,
        description: `*${english.text}*\n\n${arabic.text}`,
        color: 0x1a6b3a,
        footer: { text: `${english.surah.englishNameTranslation} • Translated by Muhammad Asad` },
      }],
    };
    if (this.type === "application" && this.interaction) {
      const msg = await this.interaction.createFollowup(payload);
      await msg.message.createReaction("⬆️");
      await msg.message.createReaction("⬇️");
      return;
    }
    return payload;
  }

  static description = "Gets a random verse from the Quran";
  static aliases = ["quran", "ayah"];
}

export default QuranCommand;
