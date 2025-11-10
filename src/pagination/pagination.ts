import {
  type Client,
  type CommandInteraction,
  ComponentTypes,
  type CreateMessageOptions,
  type InteractionContent,
  type Member,
  type Message,
  type MessageActionRow,
  type ModalData,
  type ModalLabel,
  type StringSelectMenu,
  type User,
} from "oceanic.js";
import { collectors } from "../utils/collections.ts";
import { getString } from "../utils/i18n.ts";
import logger from "../utils/logger.ts";
import InteractionCollector from "./awaitinteractions.ts";

type Info = {
  author: User | Member;
  message?: Message;
  interaction?: CommandInteraction;
};
type Pages = (CreateMessageOptions | InteractionContent)[];

export default async (client: Client, info: Info, pages: Pages): Promise<undefined> => {
  const options = info.message
    ? {
        messageReference: {
          channelID: info.message.channelID,
          messageID: info.message.id,
          guildID: info.message.guildID ?? undefined,
          failIfNotExists: false,
        },
        allowedMentions: {
          repliedUser: false,
        },
      }
    : {};
  let page = 0;
  const components: { components: MessageActionRow[] } & InteractionContent = {
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: getString("pagination.back", { locale: info.interaction?.locale ?? undefined }),
            emoji: {
              id: null,
              name: "◀",
            },
            style: 1,
            customID: "back",
          },
          {
            type: 2,
            label: getString("pagination.forward", { locale: info.interaction?.locale ?? undefined }),
            emoji: {
              id: null,
              name: "▶",
            },
            style: 1,
            customID: "forward",
          },
          {
            type: 2,
            label: getString("pagination.jump", { locale: info.interaction?.locale ?? undefined }),
            emoji: {
              id: null,
              name: "🔢",
            },
            style: 1,
            customID: "jump",
          },
          {
            type: 2,
            label: getString("pagination.delete", { locale: info.interaction?.locale ?? undefined }),
            emoji: {
              id: null,
              name: "🗑",
            },
            style: 4,
            customID: "delete",
          },
        ],
      },
    ],
  };
  let currentPage: Message;
  if (info.message) {
    currentPage = await client.rest.channels.createMessage(
      info.message.channelID,
      Object.assign(pages[page], options, pages.length > 1 ? components : {}),
    );
  } else if (info.interaction) {
    const response = await info.interaction.createFollowup(
      Object.assign(pages[page], pages.length > 1 ? components : {}),
    );
    currentPage = await response.getMessage();
    if (!currentPage) currentPage = await info.interaction.getOriginal();
  } else {
    throw Error("Unknown pagination context");
  }

  if (pages.length > 1) {
    const interactionCollector = new InteractionCollector(client);
    interactionCollector.on("interaction", async (interaction) => {
      try {
        if (interaction.data.customID !== "jump") await interaction.deferUpdate();
      } catch (e) {
        logger.warn(`Could not defer update, cannot continue further with pagination: ${e}`);
        return;
      }
      if ((interaction.member ?? interaction.user).id === info.author.id) {
        if (interaction.isComponentInteraction()) {
          switch (interaction.data.customID) {
            case "back":
              page = page > 0 ? --page : pages.length - 1;
              try {
                if (info.interaction) {
                  currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options));
                } else {
                  currentPage = await currentPage.edit(Object.assign(pages[page], options));
                }
              } catch (e) {
                logger.warn(`Failed to navigate to previous page: ${e}`);
              }
              interactionCollector.extend();
              break;
            case "forward":
              page = page + 1 < pages.length ? ++page : 0;
              try {
                if (info.interaction) {
                  currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options));
                } else {
                  currentPage = await currentPage.edit(Object.assign(pages[page], options));
                }
              } catch (e) {
                logger.warn(`Failed to navigate to next page: ${e}`);
              }
              interactionCollector.extend();
              break;
            case "jump": {
              interactionCollector.extend();
              const jumpModal: ModalData = {
                customID: "jumpModal",
                title: getString("pagination.jumpTo", { locale: interaction.locale }),
                components: [
                  {
                    type: ComponentTypes.LABEL,
                    label: getString("pagination.pageNumber", { locale: interaction.locale }),
                    component: {
                      type: ComponentTypes.STRING_SELECT,
                      customID: "seekDropdown",
                      placeholder: getString("pagination.pageNumber", { locale: interaction.locale }),
                      options: [],
                    },
                  },
                ],
              };
              const start =
                pages.length > 25 && page > 11
                  ? pages.length - page > 12
                    ? Math.max(page - 12, 0)
                    : pages.length - 25
                  : 0;
              let j = 0;
              for (let i = start; i < pages.length && i < start + 25; i++) {
                const payload = {
                  label: (i + 1).toString(),
                  value: i.toString(),
                };
                ((jumpModal.components[0] as ModalLabel).component as StringSelectMenu).options[j] = payload;
                j++;
              }
              try {
                await interaction.createModal(jumpModal);
              } catch (e) {
                logger.warn(`Failed to create pagination jump modal: ${e}`);
              }
              break;
            }
            case "delete":
              interactionCollector.emit("end", true);
              try {
                if (info.interaction) {
                  await info.interaction.deleteOriginal();
                } else {
                  await currentPage.delete();
                }
              } catch (e) {
                logger.warn(`Failed to delete pagination message: ${e}`);
              }
              return;
            default:
              break;
          }
        } else if (interaction.isModalSubmitInteraction()) {
          if (interaction.data.customID !== "jumpModal") return;
          page = Number(interaction.data.components.getStringSelectValues("seekDropdown", true)[0]);
          if (info.interaction) {
            currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options, components));
          } else {
            currentPage = await currentPage.edit(Object.assign(pages[page], options, components));
          }
        }
      } else {
        await interaction.createFollowup({
          content: getString("pagination.cantChangePage", { locale: interaction.locale }),
          flags: 64,
        });
      }
    });
    interactionCollector.once("end", async (deleted = false) => {
      collectors.delete(currentPage.id);
      interactionCollector.removeAllListeners("interaction");
      if (!deleted) {
        for (const index of components.components[0].components.keys()) {
          components.components[0].components[index].disabled = true;
        }
        try {
          if (info.interaction) {
            await info.interaction.editOriginal(components);
          } else {
            await currentPage.edit(components);
          }
        } catch (e) {
          logger.warn(`Failed to disable pagination buttons: ${e}`);
        }
      }
    });
    collectors.set(currentPage.id, interactionCollector);
  }
};
