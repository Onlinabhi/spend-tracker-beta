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
- **`.github/workflows/android-build.yml`** — the full pipeline through a real Capacitor Android debug build, manually triggered. See "Android Beta Testing" below.

Push this repo to GitHub to actually exercise them — see `docs/CI_TESTING.md` for the current (unverified) status of every check.

## Android Beta Testing

This builds a real native Android debug APK via Capacitor — not a browser
preview, not a mocked build. GitHub Pages, if this repo has it configured,
only deploys a web preview and does **not** prove the Android app works;
this workflow is the actual Android verification.

1. Open the repository on GitHub.
2. Go to the **Actions** tab.
3. Select **Build Android APK** in the workflow list on the left.
4. Click **Run workflow**.
5. In the branch dropdown, select the branch you want to test (e.g. `New-arch`).
6. Click **Run workflow** to start it.
7. Wait for the run to finish — it typechecks, runs unit tests, builds the web app, syncs Capacitor, and compiles a debug APK with Gradle. This can take several minutes, mostly for the Android SDK/Gradle steps.
8. Open the completed run. **A green checkmark means every step — typecheck, tests, build, Capacitor sync, and the Android build — actually passed.** A red X means something failed; open the failing step's log before trusting anything downstream of it.
9. Scroll to the **Artifacts** section of the run and download **`spend-tracker-android-debug`**.
10. Unzip it if needed, then transfer `app-debug.apk` to an Android device and install it (you'll need to allow installs from unknown sources, since this isn't a Play Store build).

**A failed workflow run must be investigated before the APK is trusted** —
do not install an APK from a run that shows a red X or that never
completed; the debug APK from a failed run may be stale, missing, or built
from partially-broken code.

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
