import { createAnimalityCommand } from "#utils/animality.js";

export default createAnimalityCommand({
  animal: "lion",
  title: "Lion",
  description: "Gets a random lion picture and fact",
  aliases: ["lions"],
});
