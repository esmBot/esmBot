import InteractionCollector from "./awaitinteractions.js";
import { collectors } from "../collections.js";
import logger from "../logger.js";
import { getString } from "../i18n.js";
import { Constants } from "oceanic.js";

/**
 * @param {import("oceanic.js").Client} client
 * @param {{ type: "classic" | "application"; message: import("oceanic.js").Message; interaction: import("oceanic.js").CommandInteraction; author: import("oceanic.js").User | import("oceanic.js").Member; }} info
 * @param {{ embeds: import("oceanic.js").EmbedOptions[]; }[]} pages
 */
export default async (client, info, pages) => {
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
  const components = {
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
  let currentPage;
  if (info.type === "classic") {
    currentPage = await client.rest.channels.createMessage(info.message.channelID, Object.assign(pages[page], options, pages.length > 1 ? components : {}));
  } else {
    const response = await info.interaction.createFollowup(Object.assign(pages[page], pages.length > 1 ? components : {}));
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
            const newComponents = JSON.parse(JSON.stringify(components));
            for (const index of newComponents.components[0].components.keys()) {
              newComponents.components[0].components[index].disabled = true;
            }
            if (info.type === "application") {
              currentPage = await info.interaction.editOriginal(newComponents);
            } else {
              currentPage = await currentPage.edit(newComponents);
            }
            interactionCollector.extend();
            const jumpComponents = {
              components: [{
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [{
                  type: Constants.ComponentTypes.STRING_SELECT,
                  customID: "seekDropdown",
                  placeholder: getString("pagination.pageNumber", { locale: interaction.locale }),
                  options: []
                }]
              }]
            };
            for (let i = 0; i < pages.length && i < 25; i++) {
              const payload = {
                label: i + 1,
                value: i
              };
              jumpComponents.components[0].components[0].options[i] = payload;
            }
            const followup = await interaction.createFollowup(Object.assign({ content: getString("pagination.jumpTo", { locale: interaction.locale }), flags: 64 }, jumpComponents));
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
                currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options, components));
              } else {
                currentPage = await currentPage.edit(Object.assign(pages[page], options, components));
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
                currentPage = await info.interaction.editOriginal(Object.assign(pages[page], options, components));
              } else {
                currentPage = await currentPage.edit(Object.assign(pages[page], options, components));
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
        for (const index of components.components[0].components.keys()) {
          components.components[0].components[index].disabled = true;
        }
        try {
          if (info.type === "application") {
            await info.interaction.editOriginal(components);
          } else {
            await currentPage.edit(components);
          }
        } catch {
          // no-op
        }
      }
    });
    collectors.set(currentPage.id, interactionCollector);
  }
};
