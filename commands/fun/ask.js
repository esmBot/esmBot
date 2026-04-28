import process from "node:process";
import Command from "#cmd-classes/command.js";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const MAX_DISCORD_CONTENT = 1900;
const GEMINI_TIMEOUT_MS = 20000;

function cleanText(text, remove = []) {
  let output = text.replaceAll("`", `\`${String.fromCharCode(8203)}`).replaceAll("@", `@${String.fromCharCode(8203)}`);
  for (const entry of remove) {
    if (entry) output = output.replaceAll(entry, "<redacted>");
  }
  return output;
}

function getGeminiText(data) {
  return data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
}

class AskCommand extends Command {
  async run() {
    const prompt = (this.getOptionString("prompt") ?? this.args.join(" ")).trim();
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

    if (!prompt) return "Give me a prompt to ask.";
    if (!apiKey) return "GEMINI_API_KEY is not set.";

    await this.acknowledge();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 700,
            },
          }),
        },
      );
    } catch (error) {
      if (error?.name === "AbortError") return "Gemini request timed out.";
      return "Gemini request failed before a response was received.";
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const error = cleanText(await response.text(), [apiKey]);
      return `Gemini request failed (${response.status}).\n\`\`\`${error.slice(0, 1500)}\`\`\``;
    }

    const data = await response.json();
    const text = getGeminiText(data);

    if (!text) return "Gemini did not return a text response.";

    return cleanText(text).slice(0, MAX_DISCORD_CONTENT);
  }

  static flags = [
    {
      name: "prompt",
      type: "string",
      description: "The prompt or question to send to Gemini",
      required: true,
      classic: true,
    },
  ];

  static description = "Asks Gemini a question";
  static aliases = ["ai", "gemini"];
}

export default AskCommand;
