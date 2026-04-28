import { createAnimalityCommand } from "#utils/animality.js";

export default createAnimalityCommand({
  animal: "bear",
  title: "Bear",
  description: "Gets a random bear picture and fact",
  aliases: ["bears"],
});
