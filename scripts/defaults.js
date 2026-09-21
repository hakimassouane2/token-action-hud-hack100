import { GROUP } from "./constants.js";

/**
 * Default layout and groups
 */
export let DEFAULTS = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  const groups = GROUP;
  Object.values(groups).forEach((group) => {
    group.name = coreModule.api.Utils.i18n(group.name);
    group.listName = `Group: ${coreModule.api.Utils.i18n(
      group.listName ?? group.name
    )}`;
  });
  const groupsArray = Object.values(groups);

  DEFAULTS = {
    layout: [
      {
        nestId: "rolls",
        id: "rolls",
        name: coreModule.api.Utils.i18n("tokenActionHud.hack100.rolls"),
        groups: [
          { ...groups.abilities, nestId: "rolls_abilities" },
          { ...groups.specialisms, nestId: "rolls_specialisms" },
          { ...groups.rates, nestId: "rolls_rates" },
        ],
      },
      {
        nestId: "inventory",
        id: "inventory",
        name: coreModule.api.Utils.i18n("tokenActionHud.hack100.inventory"),
        groups: [
          { ...groups.weapons, nestId: "inventory_weapons" },
          { ...groups.armor, nestId: "inventory_armor" },
          { ...groups.consumables, nestId: "inventory_consumables" },
          { ...groups.items, nestId: "inventory_items" },
        ],
      },
      {
        nestId: "experience",
        id: "experience",
        name: coreModule.api.Utils.i18n("tokenActionHud.hack100.experience"),
        groups: [{ ...groups.experience, nestId: "experience_experience" }],
      },
      {
        nestId: "utility",
        id: "utility",
        name: coreModule.api.Utils.i18n("tokenActionHud.utility"),
        // Subgroups (Resources / Combat / Token / Rest) are added at runtime by
        // the action handler, so they only appear when they contain something.
        groups: [],
      },
    ],
    groups: groupsArray,
  };
});
