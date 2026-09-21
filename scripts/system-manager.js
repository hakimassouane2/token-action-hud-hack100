// System Module Imports
import { ActionHandler } from "./action-handler.js";
import { RollHandler as Core } from "./roll-handler.js";
import { DEFAULTS } from "./defaults.js";

export let SystemManager = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  /**
   * Extends Token Action HUD Core's SystemManager class
   */
  SystemManager = class SystemManager extends coreModule.api.SystemManager {
    /**
     * Returns an instance of the ActionHandler to Token Action HUD Core
     * @override
     */
    getActionHandler() {
      return new ActionHandler();
    }

    /**
     * Returns a list of roll handlers to Token Action HUD Core
     * @override
     */
    getAvailableRollHandlers() {
      return { core: "Core Hack100" };
    }

    /**
     * Returns an instance of the RollHandler to Token Action HUD Core
     * @override
     */
    getRollHandler(rollHandlerId) {
      return new Core();
    }

    /**
     * Returns the default layout and groups to Token Action HUD Core
     * @override
     */
    async registerDefaults() {
      return DEFAULTS;
    }

    /**
     * No system module settings for now
     * @override
     */
    registerSettings(coreUpdate) {}

    /**
     * Returns styles to Token Action HUD Core
     * @override
     */
    registerStyles() {
      return {};
    }
  };
});
