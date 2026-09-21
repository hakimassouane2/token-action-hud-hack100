import { ABILITIES, IMAGES } from "./constants.js";

export let ActionHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  const i18n = (key) => coreModule.api.Utils.i18n(key);

  /**
   * Extends Token Action HUD Core's ActionHandler class and builds
   * Hack100 actions for the HUD.
   */
  ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
    /**
     * Build system actions
     * Called by Token Action HUD Core
     * @override
     */
    async buildSystemActions(groupIds) {
      if (!this.actor) return;

      this.actorType = this.actor.type;
      this.system = this.actor.system ?? {};
      this.items = [
        ...coreModule.api.Utils.sortItemsByName(this.actor.items).values(),
      ];

      this.#buildAbilities();
      this.#buildSpecialisms();
      this.#buildRates();
      this.#buildWeapons();
      this.#buildArmor();
      this.#buildItems();
      this.#buildExperience();
      this.#buildUtility();
    }

    /**
     * Tooltip: title, optional subtitle, then a hint line (how to click)
     * @returns {{content: string, class: string}}
     */
    #tooltip(title, { subtitle, description, hint } = {}) {
      const html = [
        `<h4 class="hack100-tah-title">${title}</h4>`,
        subtitle ? `<p class="hack100-tah-subtitle">${subtitle}</p>` : "",
        description ? `<div class="hack100-tah-description">${description}</div>` : "",
        hint ? `<p class="hack100-tah-hint">${hint}</p>` : "",
      ].join("");
      return { content: html, class: "hack100-tah-tooltip" };
    }

    /**
     * Abilities (characters only), with their percentage
     */
    #buildAbilities() {
      const abilities = this.system.abilities;
      if (this.actorType !== "character" || !abilities) return;

      const hint = i18n("tokenActionHud.hack100.hints.roll");
      const actions = ABILITIES.filter((id) => abilities[id]).map((id) => {
        const name = i18n(`hack100.abilities.${id}`);
        const value = abilities[id].value ?? 0;
        return {
          id: `ability_${id}`,
          name,
          info1: { text: `${value}%` },
          encodedValue: ["ability", id].join(this.delimiter),
          tooltip: this.#tooltip(name, { subtitle: `${value}%`, hint }),
        };
      });

      this.addActions(actions, { id: "abilities", type: "system" });
    }

    /**
     * Named specialisms (characters only), with their percentage
     */
    #buildSpecialisms() {
      const specialisms = this.system.specialisms;
      if (this.actorType !== "character" || !specialisms) return;

      const sp = this.system.sp ?? {};
      const subtitleSp = game.i18n.format("tokenActionHud.hack100.spLeft", {
        value: sp.value ?? 0,
        max: sp.max ?? 0,
      });
      const hint = i18n("tokenActionHud.hack100.hints.specialism");

      const actions = Object.entries(specialisms)
        .filter(([, specialism]) => specialism?.name)
        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
        .map(([key, specialism]) => ({
          id: `specialism_${key}`,
          name: specialism.name,
          info1: { text: `${specialism.value ?? 0}%` },
          encodedValue: ["specialism", key].join(this.delimiter),
          tooltip: this.#tooltip(specialism.name, {
            subtitle: `${specialism.value ?? 0}% · ${subtitleSp}`,
            hint,
          }),
        }));

      this.addActions(actions, { id: "specialisms", type: "system" });
    }

    /**
     * NPC rates: base and special, each as a plain roll and as an attack
     */
    #buildRates() {
      if (this.actorType !== "npc") return;

      const bonus = this.system.damageBonus ?? 0;
      const attackSubtitle = game.i18n.format("tokenActionHud.hack100.attackDamage", {
        bonus: bonus >= 0 ? `+${bonus}` : `${bonus}`,
      });
      const rates = [
        { kind: "base", name: i18n("hack100.npc.rate"), value: this.system.rate ?? 0 },
        {
          kind: "special",
          name: this.system.specialRateLabel || i18n("hack100.npc.specialRate"),
          value: this.system.specialRate ?? 0,
        },
      ];

      const actions = rates.flatMap(({ kind, name, value }) => {
        const attackName = `${i18n("hack100.npc.attack")} (${name})`;
        return [
          {
            id: `rate_${kind}`,
            name,
            info1: { text: `${value}%` },
            encodedValue: ["rate", kind, "roll"].join(this.delimiter),
            tooltip: this.#tooltip(name, {
              subtitle: `${value}%`,
              hint: i18n("tokenActionHud.hack100.hints.roll"),
            }),
          },
          {
            id: `rate_${kind}_attack`,
            name: attackName,
            info1: { text: `${value}%` },
            encodedValue: ["rate", kind, "attack"].join(this.delimiter),
            tooltip: this.#tooltip(attackName, {
              subtitle: `${value}% · ${attackSubtitle}`,
              hint: i18n("tokenActionHud.hack100.hints.roll"),
            }),
          },
        ];
      });

      this.addActions(actions, { id: "rates", type: "system" });
    }

    /**
     * Item action shared by every inventory group
     */
    #itemAction(item, actionType, { subtitle, hint } = {}) {
      return {
        id: item.id,
        name: item.name,
        img: coreModule.api.Utils.getImage(item),
        encodedValue: [actionType, item.id].join(this.delimiter),
        tooltip: this.#tooltip(item.name, {
          subtitle,
          description: item.system?.description,
          hint,
        }),
      };
    }

    /**
     * Weapons: click rolls the attack (and the damage on a hit)
     */
    #buildWeapons() {
      const weapons = this.items.filter((item) => item.type === "weapon");
      if (weapons.length === 0) return;

      const hint = i18n("tokenActionHud.hack100.hints.weapon");
      const actions = weapons.map((item) => {
        const damage = parseInt(item.system?.damage) || 0;
        const type = i18n(`hack100.items.${item.system?.weaponType ?? "melee"}`);
        const damageText = game.i18n.format("tokenActionHud.hack100.attackDamage", {
          bonus: damage >= 0 ? `+${damage}` : `${damage}`,
        });
        const action = this.#itemAction(item, "weapon", {
          subtitle: `${type} · ${damageText}`,
          hint,
        });
        action.info1 = { text: damage >= 0 ? `+${damage}` : `${damage}` };
        return action;
      });

      this.addActions(actions, { id: "weapons", type: "system" });
    }

    /**
     * Armor: click equips or removes it
     */
    #buildArmor() {
      const armors = this.items.filter((item) => item.type === "armor");
      if (armors.length === 0) return;

      const hint = i18n("tokenActionHud.hack100.hints.armor");
      const actions = armors.map((item) => {
        const protection = parseInt(item.system?.protection) || 0;
        const action = this.#itemAction(item, "armor", {
          subtitle: `${i18n("hack100.items.protectionValue")} ${protection}`,
          hint,
        });
        action.cssClass = item.system?.equipped ? "toggle active" : "toggle";
        action.info1 = { text: `${protection}` };
        return action;
      });

      this.addActions(actions, { id: "armor", type: "system" });
    }

    /**
     * Gear: consumables (click uses one) and other items (click shows in chat)
     */
    #buildItems() {
      const gear = this.items.filter((item) => item.type === "item");
      if (gear.length === 0) return;

      const toAction = (item, hintKey) => {
        const action = this.#itemAction(item, "item", { hint: i18n(hintKey) });
        const quantity = item.system?.quantity;
        if (typeof quantity === "number" && (item.system?.consumable || quantity !== 1)) {
          action.info1 = { text: `×${quantity}` };
        }
        return action;
      };

      const consumables = gear
        .filter((item) => item.system?.consumable)
        .map((item) => toAction(item, "tokenActionHud.hack100.hints.consumable"));
      const others = gear
        .filter((item) => !item.system?.consumable)
        .map((item) => toAction(item, "tokenActionHud.hack100.hints.item"));

      if (consumables.length) this.addActions(consumables, { id: "consumables", type: "system" });
      if (others.length) this.addActions(others, { id: "items", type: "system" });
    }

    /**
     * Abilities and specialisms with an experience check to roll
     */
    #buildExperience() {
      if (this.actorType !== "character") return;

      const hint = i18n("tokenActionHud.hack100.hints.experience");
      const actions = [];
      for (const id of ABILITIES) {
        const ability = this.system.abilities?.[id];
        if (!ability?.experienceCheck) continue;
        const name = i18n(`hack100.abilities.${id}`);
        actions.push({
          id: `xp_${id}`,
          name,
          info1: { text: `${ability.value ?? 0}%` },
          encodedValue: ["experience", id].join(this.delimiter),
          tooltip: this.#tooltip(name, { subtitle: `${ability.value ?? 0}%`, hint }),
        });
      }
      for (const [key, specialism] of Object.entries(this.system.specialisms ?? {})) {
        if (!specialism?.name || !specialism.experienceCheck) continue;
        actions.push({
          id: `xp_${key}`,
          name: specialism.name,
          info1: { text: `${specialism.value ?? 0}%` },
          encodedValue: ["experience", key].join(this.delimiter),
          tooltip: this.#tooltip(specialism.name, {
            subtitle: `${specialism.value ?? 0}%`,
            hint,
          }),
        });
      }

      if (actions.length) this.addActions(actions, { id: "experience", type: "system" });
    }

    /**
     * Utility tab, organised into runtime-derived subgroups:
     *   - Resources: luck and specialism points (characters)
     *   - Combat   : initiative + join/leave the encounter
     *   - Token    : visibility toggle (GM only)
     *   - Rest     : short / long rest (characters)
     */
    #buildUtility() {
      const parent = { nestId: "utility", level: 1 };
      const token = this.token;

      const addSubgroup = (id, name, actions) => {
        if (actions.length === 0) return;
        const groupData = { id, name, type: "system-derived" };
        this.addGroup(groupData, parent, true);
        this.addActions(actions, groupData);
      };

      /* --- Resources: luck and SP, +1 / -1 without the sheet ------------- */
      const resources = [];
      if (this.actorType === "character") {
        const resourceHint = i18n("tokenActionHud.hack100.hints.resource");
        const luck = this.system.luck ?? {};
        const sp = this.system.sp ?? {};
        resources.push(
          {
            id: "resource_luck",
            name: i18n("hack100.luck.title"),
            img: IMAGES.luck,
            info1: { text: `${luck.value ?? 0}/${luck.max ?? 3}` },
            encodedValue: ["resource", "luck"].join(this.delimiter),
            tooltip: this.#tooltip(i18n("hack100.luck.title"), { hint: resourceHint }),
          },
          {
            id: "resource_sp",
            name: i18n("hack100.sp.title"),
            img: IMAGES.sp,
            info1: { text: `${sp.value ?? 0}/${sp.max ?? 0}` },
            encodedValue: ["resource", "sp"].join(this.delimiter),
            tooltip: this.#tooltip(i18n("hack100.sp.title"), { hint: resourceHint }),
          }
        );
      }
      addSubgroup("utilityResources", i18n("tokenActionHud.hack100.utilityResources"), resources);

      /* --- Combat: initiative + join/leave the encounter ------------------ */
      const combat = [
        {
          id: "utility_initiative",
          name: i18n("tokenActionHud.hack100.initiative"),
          img: IMAGES.initiative,
          encodedValue: ["utility", "initiative"].join(this.delimiter),
          tooltip: this.#tooltip(i18n("tokenActionHud.hack100.initiative"), {
            hint: i18n("tokenActionHud.hack100.hints.initiative"),
          }),
        },
      ];
      if (token) {
        const name = i18n(
          token.inCombat ? "tokenActionHud.removeFromCombat" : "tokenActionHud.addToCombat"
        );
        combat.push({
          id: "utility_toggleCombat",
          name,
          img: token.inCombat ? IMAGES.leaveCombat : IMAGES.joinCombat,
          encodedValue: ["utility", "toggleCombat"].join(this.delimiter),
          tooltip: this.#tooltip(name),
        });
      }
      addSubgroup("utilityCombat", i18n("tokenActionHud.hack100.utilityCombat"), combat);

      /* --- Token: visibility toggle (GM only) ----------------------------- */
      const tokenActions = [];
      if (token && game.user?.isGM) {
        const hidden = token.document?.hidden;
        const name = i18n(hidden ? "tokenActionHud.makeVisible" : "tokenActionHud.makeInvisible");
        tokenActions.push({
          id: "utility_toggleVisibility",
          name,
          img: hidden ? IMAGES.visible : IMAGES.invisible,
          encodedValue: ["utility", "toggleVisibility"].join(this.delimiter),
          tooltip: this.#tooltip(name, {
            hint: i18n("tokenActionHud.hack100.hints.visibility"),
          }),
        });
      }
      addSubgroup("utilityToken", i18n("tokenActionHud.hack100.utilityToken"), tokenActions);

      /* --- Rest: short / long rest (characters only, kept last) ----------- */
      const rest = [];
      if (this.actorType === "character") {
        const shortRestUsed = this.system.shortRestUsed;
        rest.push(
          {
            id: "utility_shortRest",
            name: i18n("hack100.rest.shortRest"),
            img: IMAGES.shortRest,
            cssClass: shortRestUsed ? "disabled" : "",
            encodedValue: ["utility", "shortRest"].join(this.delimiter),
            tooltip: this.#tooltip(i18n("hack100.rest.shortRest"), {
              hint: i18n(
                shortRestUsed ? "hack100.rest.shortRestUsed" : "hack100.rest.shortRestHint"
              ),
            }),
          },
          {
            id: "utility_longRest",
            name: i18n("hack100.rest.longRest"),
            img: IMAGES.longRest,
            encodedValue: ["utility", "longRest"].join(this.delimiter),
            tooltip: this.#tooltip(i18n("hack100.rest.longRest"), {
              hint: i18n("hack100.rest.longRestHint"),
            }),
          }
        );
      }
      addSubgroup("utilityRest", i18n("tokenActionHud.hack100.utilityRest"), rest);
    }
  };
});
