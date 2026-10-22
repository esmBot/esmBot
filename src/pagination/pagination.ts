import {
  Constants,
  type CreateMessageOptions,
  type InteractionContent,
  type Message,
  type MessageActionRow,
  type ModalData,
  type ModalLabel,
  type StringSelectMenu,
} from "oceanic.js";
import type Command from "#cmd-classes/command.js";
import { collectors } from "../utils/collections.ts";
import logger from "../utils/logger.ts";
import InteractionCollector from "./awaitinteractions.ts";

type Pages = (CreateMessageOptions | InteractionContent)[];

interface ClassType<InstanceType extends {} = {}> extends Function {
  new (...args: any[]): InstanceType;
  prototype: InstanceType;
}

export function PaginationMixin<TBase extends ClassType<Command>>(Base: TBase) {
  return class Pagination extends Base {
    pages: Pages = [];
    page: number = 0;
    components: { components: MessageActionRow[] } & InteractionContent = { components: [] };

    async paginator(pages: Pages) {
      this.page = 0;
      this.components = {
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: this.getString("pagination.back"),
                emoji: {
                  id: null,
                  name: "◀",
                },
                style: 1,
                customID: "back",
              },
              {
                type: 2,
                label: this.getString("pagination.forward"),
                emoji: {
                  id: null,
                  name: "▶",
                },
                style: 1,
                customID: "forward",
              },
              {
                type: 2,
                label: this.getString("pagination.jump"),
                emoji: {
                  id: null,
                  name: "🔢",
                },
                style: 1,
                customID: "jump",
              },
              {
                type: 2,
                label: this.getString("pagination.delete"),
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
      this.pages = pages;
      return Object.assign(pages[this.page], pages.length > 1 ? this.components : {});
    }

    async finalize(currentPage: Message) {
      if (!currentPage) return;
      if (this.pages && this.pages.length > 1) {
        const interactionCollector = new InteractionCollector(this.client);
        interactionCollector.on("interaction", async (interaction) => {
          try {
            if (interaction.data.customID !== "jump") {
              await interaction.deferUpdate();
            }
          } catch (e) {
            logger.warn(`Could not defer update, cannot continue further with pagination: ${e}`);
            return;
          }
          if ((interaction.member ?? interaction.user).id === this.author.id) {
            if (interaction.isComponentInteraction()) {
              switch (interaction.data.customID) {
                case "back":
                  this.page = this.page > 0 ? --this.page : this.pages.length - 1;
                  try {
                    if (this.interaction) {
                      currentPage = await this.interaction.editOriginal(
                        Object.assign(this.pages[this.page], this.reference ?? {}),
                      );
                    } else {
                      currentPage = await currentPage.edit(Object.assign(this.pages[this.page], this.reference ?? {}));
                    }
                  } catch (e) {
                    logger.warn(`Failed to navigate to previous page: ${e}`);
                  }
                  interactionCollector.extend();
                  break;
                case "forward":
                  this.page = this.page + 1 < this.pages.length ? ++this.page : 0;
                  try {
                    if (this.interaction) {
                      currentPage = await this.interaction.editOriginal(
                        Object.assign(this.pages[this.page], this.reference ?? {}),
                      );
                    } else {
                      currentPage = await currentPage.edit(Object.assign(this.pages[this.page], this.reference ?? {}));
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
                    title: this.getString("pagination.jumpTo"),
                    components: [
                      {
                        type: Constants.ComponentTypes.LABEL,
                        label: this.getString("pagination.pageNumber"),
                        component: {
                          type: Constants.ComponentTypes.STRING_SELECT,
                          customID: "seekDropdown",
                          placeholder: this.getString("pagination.pageNumber"),
                          options: [],
                        },
                      },
                    ],
                  };
                  const start =
                    this.pages.length > 25 && this.page > 11
                      ? this.pages.length - this.page > 12
                        ? Math.max(this.page - 12, 0)
                        : this.pages.length - 25
                      : 0;
                  let j = 0;
                  for (let i = start; i < this.pages.length && i < start + 25; i++) {
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
                    if (this.interaction) {
                      await this.interaction.deleteOriginal();
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
              this.page = Number(interaction.data.components.getStringSelectValues("seekDropdown", true)[0]);
              try {
                if (this.interaction) {
                  currentPage = await this.interaction.editOriginal(
                    Object.assign(this.pages[this.page], this.reference ?? {}, this.components),
                  );
                } else {
                  currentPage = await currentPage.edit(
                    Object.assign(this.pages[this.page], this.reference ?? {}, this.components),
                  );
                }
              } catch (e) {
                logger.warn(`Failed to navigate to selected page: ${e}`);
              }
            }
          } else {
            try {
              await interaction.createFollowup({
                content: this.getString("pagination.cantChangePage"),
                flags: 64,
              });
            } catch (e) {
              logger.warn(`Failed to send wrong member message: ${e}`);
            }
          }
        });
        interactionCollector.once("end", async (deleted = false) => {
          collectors.delete(currentPage.id);
          interactionCollector.removeAllListeners("interaction");
          if (!deleted) {
            for (const index of this.components.components[0].components.keys()) {
              this.components.components[0].components[index].disabled = true;
            }
            try {
              if (this.interaction) {
                await this.interaction.editOriginal(this.components);
              } else {
                await currentPage.edit(this.components);
              }
            } catch (e) {
              logger.warn(`Failed to disable pagination buttons: ${e}`);
            }
          }
        });
        collectors.set(currentPage.id, interactionCollector);
      }
    }
  };
}
