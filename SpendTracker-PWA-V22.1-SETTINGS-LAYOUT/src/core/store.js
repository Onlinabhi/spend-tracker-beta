/* V21 store contract. The V20 localStorage key remains the compatibility boundary. */
window.SpendTrackerStore = {
  version: 21,
  storageKey: 'spend_tracker_v11',
  get(){ return window.state || null; },
  save(){ if(typeof window.save==='function') window.save(); }
};
