import { createAnimalityCommand } from "#utils/animality.js";

export default createAnimalityCommand({
  animal: "fish",
  title: "Fish",
  description: "Gets a random fish picture and fact",
  aliases: ["fishes"],
});
