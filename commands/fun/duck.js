import { createAnimalityCommand } from "#utils/animality.js";

export default createAnimalityCommand({
  animal: "duck",
  title: "Duck",
  description: "Gets a random duck picture and fact",
  aliases: ["ducks", "quack"],
});
