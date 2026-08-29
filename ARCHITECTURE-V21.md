# Spend Tracker V21.01 baseline hardening

V21.01 is a test-hardening release built on the V21 local-first architecture. The financial state remains the source of truth in `localStorage`; presentation/controllers are layered around it.

## Replaceable domains
- `assets/app-legacy.js`: compatibility/data implementation retained during migration.
- `assets/v21.js`: V21 shell, controllers, route persistence, theme application, search, backup adapters, progress rendering, profile/settings presentation and fun-engine orchestration.
- `src/features/fun-library.js`: content-only fun library. Add/replace entries and language packs here without changing money/wealth logic.
- `assets/styles.css`: semantic visual system and V21.01 hardening.
- `sw.js`: PWA cache shell. Cache key is versioned so old service-worker assets do not silently survive a deployment.

## Money semantics
`expense` and `transfer` are both `isSpend` events for Money reporting. A transfer therefore appears in spending totals, trends, budgets and analytics. Wealth cash calculation subtracts the combined spend total once, preventing double subtraction.

## Search contract
Money transaction search matches:
- description
- category
- person / transfer recipient
- occasion
- payment method
- income account
- transaction type
- ISO date
- localized date
- raw amount, decimal amount and Indian-formatted amount

The same `mSearch` control is used by the Money transaction surface and recent-money search.

## Theme contract
Theme selection and appearance are separate dimensions:
- Color theme: Ocean Mint, Lavender Dream, Sunset Coral, Midnight Neon, Forest Sage.
- Appearance: Day, Night, Auto.
- Every theme supplies light and dark semantic surfaces.
- Accent text/button foreground is calculated from contrast instead of assuming white text.
- Components consume semantic tokens instead of deciding their own theme colors.

## Profile contract
Profile is global. Name, email and photo are one logical record. Settings shows a read-only profile card first and exposes an explicit edit state. Avatars are synchronized after refresh and across Money/Wealth surfaces.

## Backup contract
- Full backup: portable JSON containing Money, Wealth, profile, personalization and settings.
- CSV backup: transaction-only, spreadsheet-compatible export.
- Restore: accepts either JSON or V21 CSV.
- Merge: accepts either JSON or V21 CSV and merges by stable ID.
- Cloud share: user-controlled share of the full JSON file to Drive/other cloud-capable apps. There is no silent server upload.
- Future cloud providers can implement an adapter without changing the financial data model.

## Fun engine contract
The engine is presentation-only and has no ownership of financial state.
- `fun-library.js` owns content.
- Entries have stable IDs, event types, kinds and language maps.
- Transaction events can trigger contextual content.
- Dice requests use the same library.
- Personalization toggles filter content at runtime.
- Locale selection supports a language map with English fallback. Adding Hindi or future languages requires library entries, not financial-code edits.
- The floating dice controller owns only position/animation and calls the engine.

## Web refresh contract
The current Money/Wealth page is encoded in the URL hash (`#money:transactions`, `#wealth:analytics`, etc.). Refresh therefore restores the same section in the webapp. This is intentionally independent of native-app routing.

## PWA contract
The service worker cache is versioned and contains only files that actually exist in the build. Missing optional modules must never be listed in `cache.addAll`, because one missing cache asset can abort installation.
