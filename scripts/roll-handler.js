export let RollHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  /**
   * Extends Token Action HUD Core's RollHandler class and handles action
   * events triggered when an action is clicked.
   *
   * Click conventions:
   *   - Rolls (abilities, specialisms, rates, weapons): click rolls right away,
   *     Shift+click opens the system roll dialog (modifier, luck, SP).
   *   - Items: right click opens the item sheet.
   *   - Resources (luck, SP): left click +1, right click -1.
   */
  RollHandler = class RollHandler extends coreModule.api.RollHandler {
    /**
     * Handle action click
     * Called by Token Action HUD Core when an action is left or right-clicked
     * @override
     */
    async handleActionClick(event, encodedValue) {
      const delimiter = this.delimiter ?? "|";
      const [actionType, actionId, actionSubType] = encodedValue.split(delimiter);

      if (this.actor) {
        return this.#handle(this.actor, this.token, actionType, actionId, actionSubType, event);
      }

      // Several tokens selected: run the action for each of them
      for (const token of coreModule.api.Utils.getControlledTokens?.() ?? []) {
        if (token.actor) {
          await this.#handle(token.actor, token, actionType, actionId, actionSubType, event);
        }
      }
    }

    /**
     * Dispatch a single actor's action
     */
    async #handle(actor, token, actionType, actionId, actionSubType, event) {
      const skipDialog = !event?.shiftKey;

      switch (actionType) {
        case "ability":
        case "specialism":
          return actor.rollAbility?.(actionId, { skipDialog });

        case "rate":
          return actor.rollRate?.(actionId, {
            attack: actionSubType === "attack",
            skipDialog,
          });

        case "weapon":
        case "armor":
        case "item":
          return this.#handleItem(actor, actionType, actionId, skipDialog);

        case "experience":
          return actor.rollExperience?.(actionId);

        case "resource":
          return this.#handleResource(actor, actionId);

        case "utility":
          return this.#handleUtility(actor, token, actionId);
      }
    }

    /**
     * Item actions: right click opens the sheet, left click depends on the type
     */
    async #handleItem(actor, actionType, itemId, skipDialog) {
      const item = actor.items.get(itemId);
      if (!item) return;

      if (this.isRightClick) return item.sheet?.render(true);

      switch (actionType) {
        case "weapon":
          return item.roll?.({ skipDialog });
        case "armor":
          return item.update({ "system.equipped": !item.system.equipped });
        case "item":
          return item.use?.();
      }
    }

    /**
     * Resources: left click adds one point, right click removes one
     */
    async #handleResource(actor, resource) {
      const delta = this.isRightClick ? -1 : 1;

      if (resource === "luck") {
        return actor.modifyLuck?.(delta);
      }
      if (resource === "sp") {
        const sp = actor.system.sp ?? {};
        const value = Math.max(0, Math.min(sp.max ?? 0, (sp.value ?? 0) + delta));
        if (value !== sp.value) return actor.update({ "system.sp.value": value });
      }
    }

    /**
     * Utility actions
     */
    async #handleUtility(actor, token, actionId) {
      switch (actionId) {
        case "initiative":
          return actor.rollInitiative?.({ createCombatants: true });

        case "toggleCombat":
          return (token?.document ?? coreModule.api.Utils.getFirstControlledToken?.()?.document)
            ?.toggleCombatant?.();

        case "toggleVisibility": {
          if (!game.user?.isGM) return;
          const doc =
            token?.document ?? coreModule.api.Utils.getFirstControlledToken?.()?.document;
          return doc?.update({ hidden: !doc.hidden });
        }

        case "shortRest":
          return actor.shortRest?.();

        case "longRest":
          return actor.longRest?.();
      }
    }
  };
});
