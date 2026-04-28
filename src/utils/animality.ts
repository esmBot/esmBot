import Command from "#cmd-classes/command.js";

const ANIMALITY_TIMEOUT_MS = 15000;
const ANIMALITY_BASE_URL = "https://api.animality.xyz/all";

type AnimalityResult =
  | {
      ok: true;
      image: string;
      fact: string;
      animal: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function fetchAnimality(animal: string): Promise<AnimalityResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANIMALITY_TIMEOUT_MS);

  try {
    const response = await fetch(`${ANIMALITY_BASE_URL}/${animal}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Could not fetch a ${animal} right now.`,
      };
    }

    const data = await response.json() as { image?: string; fact?: string; animal?: string };
    if (!data.image || !data.fact) {
      return {
        ok: false,
        message: `Animality did not return a complete ${animal} response.`,
      };
    }

    return {
      ok: true,
      image: data.image,
      fact: data.fact,
      animal: data.animal ?? animal,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof DOMException && error.name === "AbortError"
        ? `Timed out fetching a ${animal}.`
        : `Could not fetch a ${animal} right now.`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function createAnimalityCommand({
  animal,
  title,
  description,
  aliases = [],
}: {
  animal: string;
  title: string;
  description: string;
  aliases?: string[];
}) {
  return class AnimalityCommand extends Command {
    async run() {
      await this.acknowledge();

      const result = await fetchAnimality(animal);
      if (!result.ok) {
        this.success = false;
        return result.message;
      }

      return {
        embeds: [
          {
            title,
            description: result.fact,
            color: 0x6aa84f,
            image: {
              url: result.image,
            },
            footer: {
              text: "Powered by Animality",
            },
          },
        ],
      };
    }

    static description = description;
    static aliases = aliases;
  };
}
