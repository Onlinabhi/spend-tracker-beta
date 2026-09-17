# CI Testing Status

This tracks the actual, current state of automated verification for this
project. **"Configured" means the check exists in a workflow file. It does
not mean the check has passed.** A row only moves to "Verified" after a
real GitHub Actions run has completed successfully — see the run link that
should be added here once that happens.

## Android build workflow (`.github/workflows/android-build.yml`)

| Check | Status | Notes |
|---|---|---|
| Dependency installation (`npm ci`) | Configured | Not yet run in GitHub Actions |
| TypeScript check (`npm run typecheck`) | Configured | Not yet run in GitHub Actions |
| Unit tests (`npm test`) | Configured | Not yet run in GitHub Actions |
| Web production build (`npm run build`) | Configured | Not yet run in GitHub Actions |
| Capacitor Android platform present/added | Configured | The repo does not currently commit an `android/` folder; the workflow runs `npx cap add android` if it's missing. Not yet run. |
| Capacitor sync (`npx cap sync android`) | Configured | Not yet run in GitHub Actions |
| Java setup (Temurin 21) | Configured | Not yet run in GitHub Actions |
| Android SDK setup | Configured | Not yet run in GitHub Actions |
| Android debug build (`./gradlew assembleDebug`) | Configured | Not yet run in GitHub Actions |
| APK existence check | Configured | Explicit file-existence check, not just a green Gradle exit code. Not yet run. |
| APK artifact upload (`spend-tracker-android-debug`) | Configured | Not yet run in GitHub Actions |

**Last real run:** none yet. Update this row after the first manual trigger:

```
Run: <link to the GitHub Actions run>
Date: <date>
Result: <success/failure>
```

## Fast-checks workflow (`.github/workflows/ci.yml`)

Runs typecheck/lint/test/build (no Android/Gradle) on every push and PR, for
quick feedback without the ~5+ minute Android SDK + Gradle overhead. Same
"Configured, not yet Verified" status applies — it has never run against
this repository either.

## Known gap this workflow does NOT cover

Both workflows build and test the **web/TypeScript layer** and produce a
**real native Android APK via Capacitor** — this is a genuine device build,
not a browser simulation, and no SQLite functionality is mocked to make CI
pass. What it does *not* do is exercise the app *at runtime* on a device or
emulator (no Espresso/UI tests, no emulator boot). A build succeeding tells
you the code compiles and packages correctly and the native SQLite plugin
links in; it does not by itself prove every screen works correctly on a
phone. Manual installation and testing of the downloaded APK is still the
step that confirms real-device behavior.
