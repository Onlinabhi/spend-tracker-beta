/* V21.01 personalization contract. Presentation/content never owns financial state. */
window.SpendTrackerPersonalization = {
  categories:['funny','fact','money','transaction','budget','wealth','backup'],
  events:['expense','income','transfer','edit','dice','context','backup'],
  library(){ return window.SpendTrackerFunLibrary || {all:()=>[]}; }
};
