# Token Action HUD Hack100

[Token Action HUD Core](https://github.com/Larkinabout/fvtt-token-action-hud-core) system module for the Hack100 system (Foundry VTT v13).

## Groups

- **Rolls**: abilities and specialisms with their percentage (characters), base and special rates, plain roll or attack (NPCs).
- **Inventory**: weapons (attack, damage on a hit), armor (equip / remove), consumables (use one), other items (show in chat).
- **Experience**: abilities and specialisms with an experience check, one click for the improvement roll.
- **Utility**: luck and specialism points (+1 / -1), initiative, join / leave combat, token visibility (GM), short and long rest.

## Clicks

| Action | Click | Shift+click | Right click |
| --- | --- | --- | --- |
| Ability, specialism, rate, weapon | Roll right away | Roll dialog (modifier, luck, SP) | Weapon: open the sheet |
| Armor | Equip / remove | | Open the sheet |
| Consumable | Use (quantity -1, chat card) | | Open the sheet |
| Item | Show in chat | | Open the sheet |
| Luck, specialism points | +1 | | -1 |

Every action has a tooltip that repeats these shortcuts.

## Requirements

- Foundry VTT v13
- Hack100 system with the `skipDialog` roll option and item consumables
- Token Action HUD Core 2.x
