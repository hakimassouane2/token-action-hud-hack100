/**
 * Module-based constants
 */
export const MODULE = {
  ID: "token-action-hud-hack100",
};

/**
 * Core module version required by the system module.
 * NB: Token Action HUD Core compares version parts as strings, so specifying a
 * minor/patch here forces an exact match. Only the major version is locked, to
 * stay compatible with any 2.x release.
 */
export const REQUIRED_CORE_MODULE_VERSION = "2";

/**
 * Groups displayed in the HUD. Names are localization keys resolved in defaults.js.
 * The rolls subgroups (abilities, attacks, specialisms) and the utility subgroups
 * (resources, combat, token, rest) are derived at runtime.
 */
export const GROUP = {
  // Inventory
  weapons: { id: "weapons", name: "tokenActionHud.hack100.weapons", type: "system" },
  armor: { id: "armor", name: "tokenActionHud.hack100.armor", type: "system" },
  consumables: { id: "consumables", name: "tokenActionHud.hack100.consumables", type: "system" },
  items: { id: "items", name: "tokenActionHud.hack100.items", type: "system" },

  // Experience
  experience: { id: "experience", name: "tokenActionHud.hack100.experience", type: "system" },
};

/**
 * Hack100 abilities (system.abilities.*), in sheet order
 */
export const ABILITIES = [
  "strength",
  "agility",
  "stealth",
  "toughness",
  "perception",
  "reasoning",
  "influence",
  "willpower",
  "melee",
  "ranged",
];

/**
 * Foundry core images for each ability (rolls and experience)
 */
export const ABILITY_IMAGES = {
  strength: "icons/magic/control/buff-strength-muscle-damage-orange.webp",
  agility: "icons/skills/movement/feet-winged-boots-brown.webp",
  stealth: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
  toughness: "icons/magic/defensive/shield-barrier-deflect-gold.webp",
  perception: "icons/magic/perception/eye-ringed-green.webp",
  reasoning: "icons/skills/trades/academics-investigation-puzzles.webp",
  influence: "icons/skills/social/diplomacy-handshake-yellow.webp",
  willpower: "icons/magic/holy/meditation-chi-focus-blue.webp",
  melee: "icons/skills/melee/hand-grip-sword-strike-orange.webp",
  ranged: "icons/skills/ranged/archery-bow-attack-yellow.webp",
};

/**
 * Abilities listed as attacks rather than skills
 */
export const ATTACK_ABILITIES = ["melee", "ranged"];

/**
 * Foundry core images used by the utility actions
 */
export const IMAGES = {
  luck: "icons/magic/control/buff-luck-fortune-clover-green.webp",
  sp: "icons/magic/symbols/star-yellow.webp",
  specialism: "icons/magic/symbols/star-rising-purple.webp",
  rateBase: "icons/sundries/gaming/dice-pair-white-green.webp",
  rateSpecial: "icons/magic/symbols/star-rising-purple.webp",
  attackBase: "icons/skills/melee/strike-blade-blood-red.webp",
  attackSpecial: "icons/skills/melee/strike-dagger-arcane-pink.webp",
  initiative: "icons/sundries/gaming/dice-runed-brown.webp",
  joinCombat: "icons/skills/melee/hand-grip-sword-orange.webp",
  leaveCombat: "icons/skills/movement/figure-running-gray.webp",
  visible: "icons/creatures/eyes/human-single-blue.webp",
  invisible: "icons/magic/perception/silhouette-stealth-shadow.webp",
  shortRest: "icons/environment/settlement/tent.webp",
  longRest: "icons/environment/settlement/house-farmland.webp",
};
