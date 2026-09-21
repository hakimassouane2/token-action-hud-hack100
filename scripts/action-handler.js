import { ABILITIES, ABILITY_IMAGES, ATTACK_ABILITIES, IMAGES } from "./constants.js";

export let ActionHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  const i18n = (key) => coreModule.api.Utils.i18n(key);

  /**
   * Badge shown at the right of an action button. Given as raw HTML ("icon")
   * rather than "text": the core adds a tooltip repeating a text badge, not an
   * icon one.
   */
  const badge = (text) => ({ icon: `<span class="hack100-tah-badge">${text}</span>` });

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
      // No single actor means several tokens are selected
      if (!this.actor) return this.#buildMultipleTokens();

      this.selectedTokens = this.token ? [this.token] : [];
      this.actorType = this.actor.type;
      this.system = this.actor.system ?? {};
      this.items = [
        ...coreModule.api.Utils.sortItemsByName(this.actor.items).values(),
      ];

      this.#buildRolls();
      this.#buildWeapons();
      this.#buildArmor();
      this.#buildItems();
      this.#buildExperience();
      this.#buildUtility();
    }

    /**
     * Actions offered when SEVERAL tokens are selected: what they have in
     * common. Every token plays the action on its own (each rolls its own
     * check), the combat and visibility toggles apply to the whole selection.
     *   - Characters only: abilities and basic attacks (melee / ranged),
     *     without percentages since they differ from one actor to the next
     *   - Any selection  : initiative, join / leave combat, visibility (GM)
     */
    #buildMultipleTokens() {
      this.selectedTokens = this.tokens?.length ? [...this.tokens] : [...(canvas.tokens?.controlled ?? [])];
      if (this.selectedTokens.length < 2) return;

      const actors = this.selectedTokens.map((token) => token.actor);
      if (actors.every((actor) => actor?.type === "character")) {
        const toAction = (id) => ({
          id: `ability_${id}`,
          name: i18n(`hack100.abilities.${id}`),
          img: ABILITY_IMAGES[id],
          encodedValue: ["ability", id].join(this.delimiter),
        });
        const parent = { nestId: "rolls", level: 1 };
        const addSubgroup = (id, name, actions) => {
          const groupData = { id, name, type: "system-derived" };
          this.addGroup(groupData, parent, true);
          this.addActions(actions, groupData);
        };
        addSubgroup(
          "rollAbilities",
          i18n("tokenActionHud.hack100.abilities"),
          ABILITIES.filter((id) => !ATTACK_ABILITIES.includes(id)).map(toAction)
        );
        addSubgroup("rollAttacks", i18n("tokenActionHud.hack100.attacks"), ATTACK_ABILITIES.map(toAction));
      }

      this.#buildUtility();
    }

    /**
     * Tooltip: title, then the explanation as a plain paragraph
     * @returns {{content: string, class: string}}
     */
    #tooltip(title, body) {
      const html = [
        `<h4 class="hack100-tah-title">${title}</h4>`,
        body ? `<p class="hack100-tah-body">${body}</p>` : "",
      ].join("");
      return { content: html, class: "hack100-tah-tooltip" };
    }

    /**
     * Rolls tab, organised into runtime-derived subgroups:
     *   - Abilities  : character abilities except melee/ranged, or NPC rates
     *   - Attacks    : melee and ranged, or NPC rate attacks
     *   - Specialisms: named specialisms (characters)
     *
     * Derived like the utility subgroups, so they show up whatever layout a
     * user saved before, and only when they contain something.
     */
    #buildRolls() {
      const parent = { nestId: "rolls", level: 1 };
      const addSubgroup = (id, name, actions) => {
        if (actions.length === 0) return;
        const groupData = { id, name, type: "system-derived" };
        this.addGroup(groupData, parent, true);
        this.addActions(actions, groupData);
      };

      const { abilities, attacks } =
        this.actorType === "npc" ? this.#rateActions() : this.#abilityActions();

      addSubgroup("rollAbilities", i18n("tokenActionHud.hack100.abilities"), abilities);
      addSubgroup("rollAttacks", i18n("tokenActionHud.hack100.attacks"), attacks);
      addSubgroup("rollSpecialisms", i18n("tokenActionHud.hack100.specialisms"), this.#specialismActions());
    }

    /**
     * Character abilities with their percentage, split into skills and attacks
     * @returns {{abilities: object[], attacks: object[]}}
     */
    #abilityActions() {
      const abilities = this.system.abilities;
      if (this.actorType !== "character" || !abilities) return { abilities: [], attacks: [] };

      const toAction = (id) => ({
        id: `ability_${id}`,
        name: i18n(`hack100.abilities.${id}`),
        img: ABILITY_IMAGES[id],
        info1: badge(`${abilities[id].value ?? 0}%`),
        encodedValue: ["ability", id].join(this.delimiter),
      });

      const ids = ABILITIES.filter((id) => abilities[id]);
      return {
        abilities: ids.filter((id) => !ATTACK_ABILITIES.includes(id)).map(toAction),
        attacks: ids.filter((id) => ATTACK_ABILITIES.includes(id)).map(toAction),
      };
    }

    /**
     * Named specialisms (characters only), with their percentage
     */
    #specialismActions() {
      const specialisms = this.system.specialisms;
      if (this.actorType !== "character" || !specialisms) return [];

      return Object.entries(specialisms)
        .filter(([, specialism]) => specialism?.name)
        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
        .map(([key, specialism]) => ({
          id: `specialism_${key}`,
          name: specialism.name,
          img: IMAGES.specialism,
          info1: badge(`${specialism.value ?? 0}%`),
          encodedValue: ["specialism", key].join(this.delimiter),
        }));
    }

    /**
     * NPC rates (base and special): plain rolls as skills, attacks apart
     * @returns {{abilities: object[], attacks: object[]}}
     */
    #rateActions() {
      const rates = [
        {
          kind: "base",
          name: i18n("hack100.npc.rate"),
          value: this.system.rate ?? 0,
          img: IMAGES.rateBase,
          attackImg: IMAGES.attackBase,
        },
        {
          kind: "special",
          name: this.system.specialRateLabel || i18n("hack100.npc.specialRate"),
          value: this.system.specialRate ?? 0,
          img: IMAGES.rateSpecial,
          attackImg: IMAGES.attackSpecial,
        },
      ];

      const abilities = rates.map(({ kind, name, value, img }) => ({
        id: `rate_${kind}`,
        name,
        img,
        info1: badge(`${value}%`),
        encodedValue: ["rate", kind, "roll"].join(this.delimiter),
      }));

      const attacks = rates.map(({ kind, name, value, attackImg }) => ({
        id: `rate_${kind}_attack`,
        name: `${i18n("hack100.npc.attack")} (${name})`,
        img: attackImg,
        info1: badge(`${value}%`),
        encodedValue: ["rate", kind, "attack"].join(this.delimiter),
      }));

      return { abilities, attacks };
    }

    /**
     * Item action shared by every inventory group
     */
    #itemAction(item, actionType) {
      return {
        id: item.id,
        name: item.name,
        img: coreModule.api.Utils.getImage(item),
        encodedValue: [actionType, item.id].join(this.delimiter),
      };
    }

    /**
     * Weapons: click rolls the attack (and the damage on a hit)
     */
    #buildWeapons() {
      const weapons = this.items.filter((item) => item.type === "weapon");
      if (weapons.length === 0) return;

      const actions = weapons.map((item) => {
        const damage = parseInt(item.system?.damage) || 0;
        const action = this.#itemAction(item, "weapon");
        action.info1 = badge(damage >= 0 ? `+${damage}` : `${damage}`);
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

      const actions = armors.map((item) => {
        const protection = parseInt(item.system?.protection) || 0;
        const action = this.#itemAction(item, "armor");
        action.cssClass = item.system?.equipped ? "toggle active" : "toggle";
        action.info1 = badge(`${protection}`);
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

      const toAction = (item) => {
        const action = this.#itemAction(item, "item");
        const quantity = item.system?.quantity;
        if (typeof quantity === "number" && (item.system?.consumable || quantity !== 1)) {
          action.info1 = badge(`×${quantity}`);
        }
        return action;
      };

      const consumables = gear
        .filter((item) => item.system?.consumable)
        .map(toAction);
      const others = gear
        .filter((item) => !item.system?.consumable)
        .map(toAction);

      if (consumables.length) this.addActions(consumables, { id: "consumables", type: "system" });
      if (others.length) this.addActions(others, { id: "items", type: "system" });
    }

    /**
     * Abilities and specialisms with an experience check to roll
     */
    #buildExperience() {
      if (this.actorType !== "character") return;

      const actions = [];
      for (const id of ABILITIES) {
        const ability = this.system.abilities?.[id];
        if (!ability?.experienceCheck) continue;
        const name = i18n(`hack100.abilities.${id}`);
        actions.push({
          id: `xp_${id}`,
          name,
          img: ABILITY_IMAGES[id],
          info1: badge(`${ability.value ?? 0}%`),
          encodedValue: ["experience", id].join(this.delimiter),
        });
      }
      for (const [key, specialism] of Object.entries(this.system.specialisms ?? {})) {
        if (!specialism?.name || !specialism.experienceCheck) continue;
        actions.push({
          id: `xp_${key}`,
          name: specialism.name,
          img: IMAGES.specialism,
          info1: badge(`${specialism.value ?? 0}%`),
          encodedValue: ["experience", key].join(this.delimiter),
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
     * The combat and token actions cover every selected token.
     */
    #buildUtility() {
      const parent = { nestId: "utility", level: 1 };
      const tokens = this.selectedTokens ?? [];

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
            info1: badge(`${luck.value ?? 0}/${luck.max ?? 3}`),
            encodedValue: ["resource", "luck"].join(this.delimiter),
            tooltip: this.#tooltip(i18n("hack100.luck.title"), resourceHint),
          },
          {
            id: "resource_sp",
            name: i18n("hack100.sp.title"),
            img: IMAGES.sp,
            info1: badge(`${sp.value ?? 0}/${sp.max ?? 0}`),
            encodedValue: ["resource", "sp"].join(this.delimiter),
            tooltip: this.#tooltip(i18n("hack100.sp.title"), resourceHint),
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
        },
      ];
      if (tokens.length) {
        // Once every selected token is in combat, the action takes them out
        const remove = tokens.every((token) => token.inCombat);
        combat.push({
          id: "utility_toggleCombat",
          name: i18n(remove ? "tokenActionHud.removeFromCombat" : "tokenActionHud.addToCombat"),
          img: remove ? IMAGES.leaveCombat : IMAGES.joinCombat,
          encodedValue: ["utility", "toggleCombat", remove ? "remove" : "add"].join(this.delimiter),
        });
      }
      addSubgroup("utilityCombat", i18n("tokenActionHud.hack100.utilityCombat"), combat);

      /* --- Token: visibility toggle (GM only) ----------------------------- */
      const tokenActions = [];
      if (tokens.length && game.user?.isGM) {
        // Once every selected token is hidden, the action reveals them
        const show = tokens.every((token) => token.document?.hidden);
        tokenActions.push({
          id: "utility_toggleVisibility",
          name: i18n(show ? "tokenActionHud.makeVisible" : "tokenActionHud.makeInvisible"),
          img: show ? IMAGES.visible : IMAGES.invisible,
          encodedValue: ["utility", "toggleVisibility", show ? "show" : "hide"].join(this.delimiter),
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
            tooltip: this.#tooltip(
              i18n("hack100.rest.shortRest"),
              i18n(shortRestUsed ? "hack100.rest.shortRestUsed" : "hack100.rest.shortRestHint")
            ),
          },
          {
            id: "utility_longRest",
            name: i18n("hack100.rest.longRest"),
            img: IMAGES.longRest,
            encodedValue: ["utility", "longRest"].join(this.delimiter),
            tooltip: this.#tooltip(i18n("hack100.rest.longRest"), i18n("hack100.rest.longRestHint")),
          }
        );
      }
      addSubgroup("utilityRest", i18n("tokenActionHud.hack100.utilityRest"), rest);
    }
  };
});
