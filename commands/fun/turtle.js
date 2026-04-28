import { createAnimalityCommand } from "#utils/animality.js";

export default createAnimalityCommand({
  animal: "turtle",
  title: "Turtle",
  description: "Gets a random turtle picture and fact",
  aliases: ["turtles"],
});
