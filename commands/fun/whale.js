import { createAnimalityCommand } from "#utils/animality.js";

export default createAnimalityCommand({
  animal: "whale",
  title: "Whale",
  description: "Gets a random whale picture and fact",
  aliases: ["whales"],
});
