import InteractionCollector from "./awaitinteractions.js";
import { collectors } from "#utils/collections.js";
import logger from "#utils/logger.js";
import { getString } from "#utils/i18n.js";
import {
  Constants,
  type Client,
  type CommandInteraction,
  type EmbedOptions,
  type InteractionContent,
  type Member,
  type Message,
  type MessageActionRow,
  type MessageComponent,
  type User
} from "oceanic.js";

type PaginationInfo = {
  type: "classic" | "application";
  message: Message;
  interaction: CommandInteraction;
  author: User | Member;
};

export default async (client: Client, info: PaginationInfo, pages: { embeds: EmbedOptions[] }[]) => {
  const options = info.type === "classic" ? {
    messageReference: {
      channelID: info.message.channelID,
      messageID: info.message.id,
      guildID: info.message.guildID ?? undefined,
      failIfNotExists: false
    },
    allowedMentions: {
      repliedUser: false
    }
  } : {};
  let page = 0;
  const components: { components: MessageActionRow[] } & InteractionContent = {
    components: [{
      type: Constants.ComponentTypes.ACTION_ROW,
      components: [
        {
          type: Constants.ComponentTypes.BUTTON,
          label: getString("pagination.back", { locale: info.type === "application" ? info.interaction.locale : undefined }),
          emoji: {
            id: null,
            name: "◀"
          },
          style: 1,
          customID: "back"
        },
        {
          type: Constants.ComponentTypes.BUTTON,
          label: getString("pagination.forward", { locale: info.type === "application" ? info.interaction.locale : undefined }),
          emoji: {
            id: null,
            name: "▶"
          },
          style: 1,
          customID: "forward"
        },
        {
          type: Constants.ComponentTypes.BUTTON,
          label: getString("pagination.jump", { locale: info.type === "application" ? info.interaction.locale : undefined }),
          emoji: {
            id: null,
            name: "🔢"
          },
          style: 1,
          customID: "jump"
        },
        {
          type: Constants.ComponentTypes.BUTTON,
          label: getString("pagination.delete", { locale: info.type === "application" ? info.interaction.locale : undefined }),
          emoji: {
            id: null,
            name: "🗑"
          },
          style: 4,
          customID: "delete"
        }
      ]
    }]
  };
  let currentPage: Message;
  if (info.type === "classic") {
    currentPage = await client.rest.channels.createMessage(info.message.channelID, Object.assign(pages[page], options, pages.length > 1 ? { components } : {}));
  } else {
    const response = await info.interaction.createFollowup(Object.assign(pages[page], pages.length > 1 ? { components } : {}));
    currentPage = await response.getMessage();
    if (!currentPage) currentPage = await info.interaction.getOriginal();
  }
  
  if (pages.length > 1) {
    const interactionCollector = new InteractionCollector(client, currentPage);
    interactionCollector.on("interaction", async (interaction) => {
      try {
        await interaction.deferUpdate();
      } catch (e) {
        logger.warn(`Could not defer update, cannot continue further with pagination: ${e}`);
        return;
      }
      if ((interaction.member ?? interaction.user).id === info.author.id) {
        switch (interaction.data.customID) {
          case "back":
            page = page > 0 ? --page : pages.length - 1;
            if (info.type === "application") {
              currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options));
            } else {
              currentPage = await currentPage.edit(Object.assign(pages[page], options));
            }
            interactionCollector.extend();
            break;
          case "forward":
            page = page + 1 < pages.length ? ++page : 0;
            if (info.type === "application") {
              currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options));
            } else {
              currentPage = await currentPage.edit(Object.assign(pages[page], options));
            }
            interactionCollector.extend();
            break;
          case "jump": {
            const newComponents: MessageActionRow[] = JSON.parse(JSON.stringify(components));
            for (const index of newComponents[0].components.keys()) {
              newComponents[0].components[index].disabled = true;
            }
            if (info.type === "application") {
              currentPage = await info.interaction.editOriginal({ components: newComponents });
            } else {
              currentPage = await currentPage.edit({ components: newComponents });
            }
            interactionCollector.extend();
            const jumpComponent: MessageComponent = {
              type: Constants.ComponentTypes.STRING_SELECT,
              customID: "seekDropdown",
              placeholder: getString("pagination.pageNumber", { locale: interaction.locale }),
              options: []
            };
            for (let i = 0; i < pages.length && i < 25; i++) {
              const payload = {
                label: (i + 1).toString(),
                value: i.toString()
              };
              jumpComponent.options[i] = payload;
            }
            const followup = await interaction.createFollowup({ content: getString("pagination.jumpTo", { locale: interaction.locale }), components: {
              type: 1,
              components: [jumpComponent]
            }, flags: 64 });
            const askMessage = await followup.getMessage();
            const dropdownCollector = new InteractionCollector(client, askMessage);
            let ended = false;
            dropdownCollector.on("interaction", async (response) => {
              if (response.data.customID !== "seekDropdown") return;
              try {
                await interaction.deleteFollowup(askMessage.id);
              } catch {
                // no-op
              }
              page = Number(response.data.values.raw[0]);
              if (info.type === "application") {
                currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options, { components }));
              } else {
                currentPage = await currentPage.edit(Object.assign(pages[page], options, { components }));
              }
              ended = true;
              dropdownCollector.stop();
            });
            dropdownCollector.once("end", async () => {
              collectors.delete(askMessage.id);
              if (ended) return;
              try {
                await interaction.deleteFollowup(askMessage.id);
              } catch {
                // no-op
              }
              if (info.type === "application") {
                currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options, { components }));
              } else {
                currentPage = await currentPage.edit(Object.assign(pages[page], options, { components }));
              }
            });
            collectors.set(askMessage.id, dropdownCollector);
            break;
          }
          case "delete":
            interactionCollector.emit("end", true);
            try {
              if (info.type === "application") {
                await info.interaction.deleteOriginal();
              } else {
                await currentPage.delete();
              }
            } catch {
              // no-op
            }
            return;
          default:
            break;
        }
      } else {
        await interaction.createFollowup({
          content: getString("pagination.cantChangePage", { locale: interaction.locale }),
          flags: 64
        });
      }
    });
    interactionCollector.once("end", async (deleted = false) => {
      collectors.delete(currentPage.id);
      interactionCollector.removeAllListeners("interaction");
      if (!deleted) {
        for (const index of components[0].components.keys()) {
          components[0].components[index].disabled = true;
        }
        try {
          if (info.type === "application") {
            await info.interaction.editOriginal({ components });
          } else {
            await currentPage.edit({ components });
          }
        } catch {
          // no-op
        }
      }
    });
    collectors.set(currentPage.id, interactionCollector);
  }
};
