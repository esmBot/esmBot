import { createAnimalityCommand } from "#utils/animality.js";

export default createAnimalityCommand({
  animal: "horse",
  title: "Horse",
  description: "Gets a random horse picture and fact",
  aliases: ["horses"],
});
