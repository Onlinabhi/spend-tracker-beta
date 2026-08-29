/* Spend Tracker V21.01 Fun Library
   Content-only module. Add/edit language packs here without touching financial logic.
   Contract: entries are {id, kind, event, text:{en:'...', hi:'...', ...}}.
*/
(function(){
  'use strict';
  const ENTRIES=[
    {id:'tx-expense-01',kind:'funny',event:'expense',text:{en:'Money left the building. At least we logged its exit. 💸',hi:'पैसा बाहर गया। कम से कम उसकी एंट्री तो हुई। 💸'}},
    {id:'tx-expense-02',kind:'money',event:'expense',text:{en:'Another rupee accounted for. Future-you approves.',hi:'एक और रुपये का हिसाब। भविष्य वाला आप खुश है।'}},
    {id:'tx-income-01',kind:'money',event:'income',text:{en:'Money came in. Please resist the urge to give it a vacation. 😌',hi:'पैसा आया है। उसे तुरंत छुट्टी पर भेजने की जरूरत नहीं। 😌'}},
    {id:'tx-transfer-01',kind:'transaction',event:'transfer',text:{en:'Personal transfer recorded. The rupee has a destination now.',hi:'पर्सनल ट्रांसफर दर्ज हुआ। अब रुपये का ठिकाना पता है।'}},
    {id:'tx-transfer-02',kind:'funny',event:'transfer',text:{en:'You moved money. The money has filed a change-of-address form. 😂',hi:'पैसा आपने खिसकाया। उसने पता बदलने का फॉर्म भर दिया। 😂'}},
    {id:'tx-edit-01',kind:'transaction',event:'edit',text:{en:'Ledger updated. History has been corrected, because humans edit things.',hi:'लेजर अपडेट हुआ। इतिहास भी कभी-कभी एडिट होता है।'}},
    {id:'budget-01',kind:'budget',event:'context',text:{en:'A budget is a plan. Reality is where the receipts live.',hi:'बजट एक योजना है। असली कहानी रसीदों में रहती है।'}},
    {id:'analytics-01',kind:'fact',event:'context',text:{en:'Visible spending is easier to change than mysterious spending.',hi:'जो खर्च दिखता है, उसे बदलना आसान होता है।'}},
    {id:'wealth-01',kind:'wealth',event:'context',text:{en:'Quiet compounding beats loud financial drama.',hi:'शांत कंपाउंडिंग, बड़े वित्तीय ड्रामे से बेहतर है।'}},
    {id:'dice-01',kind:'funny',event:'dice',text:{en:'You rolled the financial dice. It landed on: track the money. 🎲',hi:'आपने वित्तीय पासा फेंका। नतीजा: पैसे का हिसाब रखो। 🎲'}},
    {id:'dice-02',kind:'fact',event:'dice',text:{en:'Small expenses become large totals by repeating themselves.',hi:'छोटे खर्च बार-बार होकर बड़ा कुल बना देते हैं।'}},
    {id:'dice-03',kind:'funny',event:'dice',text:{en:'The wallet has submitted another plot twist. Please document it. 😂',hi:'वॉलेट ने एक और प्लॉट ट्विस्ट दिया है। इसे दर्ज करें। 😂'}},
    {id:'dice-04',kind:'money',event:'dice',text:{en:'Knowing where money goes is half the battle.',hi:'पैसा कहाँ जाता है, यह जानना आधी लड़ाई जीतना है।'}},
    {id:'empty-01',kind:'funny',event:'empty',text:{en:'Nothing here yet. Suspiciously peaceful.',hi:'अभी यहाँ कुछ नहीं है। जरूरत से ज्यादा शांति है।'}},
    {id:'backup-01',kind:'backup',event:'backup',text:{en:'Backup complete. Future-you just received a tiny favour.',hi:'बैकअप पूरा। भविष्य वाले आप की थोड़ी मदद हो गई।'}}
  ];
  const api={
    version:'21.01',
    entries:ENTRIES,
    languages:['en','hi'],
    get(id){return ENTRIES.find(x=>x.id===id)||null},
    add(entry){if(!entry?.id||!entry?.text?.en)return false;ENTRIES.push(entry);return true},
    all(){return ENTRIES.slice()}
  };
  window.SpendTrackerFunLibrary=api;
})();
