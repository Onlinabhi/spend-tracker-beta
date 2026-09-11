# Spend Tracker V24

Standalone static PWA build based on the audited V23 source package.

## V24 scope
- Preserve the existing Money + Wealth application and financial logic.
- Replace only the Settings presentation with a clean V24 profile/settings UI.
- Remove Wealth Setup from Settings. Wealth mode itself remains unchanged.
- Keep profile photo/name/email editing compatible with the existing profile store.
- Preserve existing categories, payment methods, income accounts, backup, personalization and reset functions.
- Keep the existing floating dice movement/drag mechanics.
- Route dice clicks through the modular Fun Engine and show the generated entry in the Brain Food preview card.

## Run
Serve this folder from a local HTTP server. Opening `index.html` directly can prevent PWA/service-worker features from working in some browsers.

## Validation
`npm run check` validates JavaScript syntax. `npm run build` is a static-build marker because no compilation is required.
