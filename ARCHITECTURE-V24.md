# Spend Tracker V24 Architecture

## Boundary
V24 is a standalone package built from the audited V23 PWA source. The financial/data implementation remains in the existing compatibility layer; V24 changes the Settings presentation and adds a dedicated Fun/Dice adapter.

## Runtime layers
- `assets/app-legacy.js` — existing Money/Wealth data and business logic.
- `assets/v21.js` — existing shell, navigation, themes, profile synchronization and floating-dice mechanics.
- `assets/settings-v24.js` — V24 Settings presentation only. It reuses existing profile, category, payment, income, backup, personalization and reset functions.
- `assets/v24-fun.js` — V24 dice-content adapter. It selects a `dice` entry from `src/features/fun-library.js` and writes it into the Brain Food preview without changing dice movement/drag behavior.
- `src/features/fun-library.js` — content-only Fun Engine library.
- `assets/styles-base.css` + `assets/styles.css` — existing visual system plus V24 Settings styles.
- `sw.js` — V24-versioned PWA cache.

## Settings boundary
The Settings UI contains:
1. Profile
2. Appearance & Text
3. Money Categories
4. Payment Methods
5. Income Accounts
6. Backup & Transfer
7. Personalization
8. Reset App Data

Wealth Setup is intentionally not rendered inside Settings. Wealth mode and its underlying records remain part of the app.

## Dice boundary
The floating dice element and its pointer/drag/safe-placement code remain in `assets/v21.js`. V24 replaces only the `V21Fun.dice()` content path so a tap/click selects a modular Fun Engine entry and displays it in the Brain Food preview card.

## Data safety
No migration or reset is introduced. Existing localStorage keys are reused. V24 does not replace the Money/Wealth data model.
