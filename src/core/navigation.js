/* V21.01 navigation contract. Hash route keeps the webapp on the same section after refresh. */
window.SpendTrackerNavigation = {
  money:['home','transactions','analytics','budgets','more'],
  wealth:['home','transactions','analytics','budgets','more'],
  encode(mode,page){return `#${mode}:${page}`},
  profile:'more'
};
