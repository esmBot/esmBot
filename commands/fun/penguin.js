import { createAnimalityCommand } from "#utils/animality.js";

export default createAnimalityCommand({
  animal: "penguin",
  title: "Penguin",
  description: "Gets a random penguin picture and fact",
  aliases: ["penguins"],
});
