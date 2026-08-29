/* V21.01 backup contract. JSON is the full-state format; CSV is transaction-only. */
window.SpendTrackerBackup = {
  schema:'spend-tracker-v21',
  full:'json',
  spreadsheet:'csv',
  acceptedRestore:['json','csv'],
  acceptedMerge:['json','csv'],
  merge:'stable-id',
  cloud:'user-controlled-share',
  automaticUpload:false
};
