# Spend Tracker — Rebuild

A TypeScript/React/Capacitor rebuild of the existing Spend Tracker app,
replacing a single 3,388-line `index.html` + `localStorage` blob with a
layered, feature-oriented architecture backed by SQLite.

**Read `docs/DEVELOPMENT_STATUS.md` first.** It has the honest, detailed
status of every feature (completed / partially completed / not started /
blocked) and — critically — the CI verification status, which right now is
"not yet run" for everything, since this sandbox has no network access and
the GitHub Actions workflows have never fired on a real repository.

## What's built

The full Money domain: Categories, Payment Methods, Accounts, Transactions
(create/edit/delete/filter/search), Budgets, Goals, Dashboard, Analytics,
Settings + Themes, Backup/Restore (versioned JSON with safety snapshots),
Legacy data migration (from the real old-app format), and CSV import/export.
Dice remains fully isolated, listening only to `TransactionCreated`, with
its ON/OFF flag now backed by real persisted settings.

Not built: the Wealth domain, Notifications, and Android release signing —
see `docs/ROADMAP.md` for what's next.

## Setup (on a machine with network access)

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run dev           # web dev server, for iterating on UI/styling
npm run build          # type-checks + builds the web bundle
npx cap add android    # first time only, or let CI do it
npm run cap:sync
npm run android:debug  # ./gradlew assembleDebug under the hood
```

The database layer (`CapacitorSqliteAdapter`) only works inside a real
Capacitor/Android runtime. `npm run dev` in a plain browser is useful for
UI/styling iteration but will fail to open the database.

## CI

Two GitHub Actions workflows:
- **`.github/workflows/ci.yml`** — install, typecheck, lint, unit tests, web build. Runs on every push/PR.
- **`.github/workflows/android-debug.yml`** — the above plus Capacitor Android platform setup, `cap sync`, a Gradle debug build, and uploads `app-debug.apk` as a downloadable workflow artifact.

Push this repo to GitHub to actually exercise them — nothing here has run yet.

## Read these first

1. `docs/DEVELOPMENT_STATUS.md` — the honest status matrix (start here)
2. `docs/FEATURE_INVENTORY.md` — what the existing app actually does today
3. `docs/ARCHITECTURE.md` — the layering rules and event-driven decoupling
4. `docs/DATABASE.md` — schema + migration policy
5. `docs/ROADMAP.md` — phase-by-phase status against the original spec

## What to hand back to me

Push to GitHub, confirm both workflows go green, and tell me what broke (if
anything) — I wrote this carefully but without being able to compile it.
After that: Wealth domain, Notifications, or Android release signing, per
`docs/ROADMAP.md`.
