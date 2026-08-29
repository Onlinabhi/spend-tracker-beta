/* V21.01 overlay contract. Form modals are persistent UI; only transient overlays close on scroll. */
window.SpendTrackerOverlay = {
  closeTransient(){
    document.querySelectorAll('#brainFoodPanel.show,#settingsPanel.show').forEach(x=>x.classList.remove('show'));
  },
  closeForms:false
};
