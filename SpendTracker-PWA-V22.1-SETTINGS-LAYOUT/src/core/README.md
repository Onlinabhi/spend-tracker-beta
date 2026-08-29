# V21 architecture modules

The V21 shell is intentionally split into stable domains. The current `app-legacy.js` remains the compatibility layer for V20 data and behavior. New work should move one domain at a time into these modules without changing storage keys until a migration is tested.

- `store.js`: single source of truth and persistence boundary.
- `theme.js`: design tokens and five presets.
- `navigation.js`: Money/Wealth and profile navigation.
- `overlay.js`: one active preview/modal policy.
- `personalization.js`: preferences and contextual message selection.
- `backup.js`: export/import/merge and schema migration.
