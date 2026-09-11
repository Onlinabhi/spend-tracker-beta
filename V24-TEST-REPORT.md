# Spend Tracker V24 Validation

## Automated validation
- JavaScript syntax check: PASS
- Manifest JSON parse: PASS
- Local HTML asset references: PASS
- Service-worker asset list: PASS
- V23 Settings module removed from runtime/package: PASS
- V24 Settings module contains no Wealth Setup UI: PASS
- V24 Fun adapter loaded after Settings: PASS

## Regression intent
- Money screen markup/business logic preserved from the audited V23 package.
- Wealth screen markup/business logic preserved from the audited V23 package.
- Existing data keys are reused.
- Existing floating-dice movement/drag code is not rewritten.

## Manual browser test checklist
1. Open `index.html` from a local HTTP server.
2. Confirm Money home, Transactions, Analytics and Goals load normally.
3. Confirm Wealth home, Net Worth, Activity, Analytics, Money Owed and Milestones load normally.
4. Tap the header profile button in Money mode. Confirm V24 Settings appears.
5. Confirm profile photo is shown at the top and can be changed.
6. Confirm Edit profile changes name/email and Save persists it.
7. Confirm there is no `Wealth Setup` panel in Settings.
8. Open Appearance & Text and test Day/Night/Auto, themes and text size.
9. Test add/edit/delete for Money Categories, Payment Methods and Income Accounts.
10. Test Full Backup, CSV Export, Restore, Merge and Share.
11. Test Personalization switches.
12. Test Reset App Data only if using disposable test data.
13. Tap the floating dice without dragging. Confirm a Brain Food preview appears and its text comes from the Fun Engine library.
14. Drag the floating dice. Confirm it still moves and does not open the preview as a click.
15. Repeat dice taps and confirm different eligible Fun Engine entries can appear.
16. Test the same Settings and dice behavior in Wealth mode.
17. Install the PWA and confirm the V24 cache loads.
