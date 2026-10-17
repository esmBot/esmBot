import {
  type CommandInteraction,
  type InteractionContent,
  type Message,
  ButtonStyles,
  ComponentTypes,
} from "oceanic.js";
import type Command from "#cmd-classes/command.js";
import InteractionCollector from "../pagination/awaitinteractions.ts";
import { collectors } from "./collections.ts";
import { getString } from "./i18n.ts";
import { invokeCommand } from "./invoke.ts";
import logger from "./logger.ts";

export function rerunButton(name: string, locale: string): InteractionContent["components"] {
  return [
    {
      type: ComponentTypes.ACTION_ROW,
      components: [
        {
          type: ComponentTypes.BUTTON,
          style: ButtonStyles.PRIMARY,
          customID: "rerun",
          label: getString("image.rerun", { locale, params: { command: name } }),
        },
      ],
    },
  ];
}

export function awaitRerun(interaction: CommandInteraction, message: Message, command: Command) {
  const collector = new InteractionCollector(interaction.client);
  let clicked = false;
  collector.on("interaction", async (click) => {
    if (clicked || click.data.customID !== "rerun") return;
    clicked = true;
    collector.stop();
    try {
      await click.editParent({
        content: getString("image.rerunning", { locale: click.locale, params: { command: command.cmdName } }),
        components: [],
      });
    } catch (e) {
      logger.warn(`Failed to update re-run prompt: ${e}`);
    }
    invokeCommand(command).catch((e) => logger.error(`Failed to re-run command ${command.cmdName}: ${e.stack || e}`));
  });
  collector.once("end", async () => {
    collectors.delete(message.id);
    collector.removeAllListeners("interaction");
    if (clicked) return;
    try {
      await interaction.editFollowup(message.id, { components: [] });
    } catch (e) {
      logger.warn(`Failed to remove re-run button: ${e}`);
    }
  });
  collectors.set(message.id, collector);
}
