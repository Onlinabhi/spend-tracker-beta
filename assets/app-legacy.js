
const KEY='spend_tracker_v11', PROFILE_KEY='spend_tracker_profile_v18_1', BACKUP_DB='spend_tracker_backup_v18_1';
const uid=()=>crypto.randomUUID(),today=()=>new Date().toISOString().slice(0,10),todayISO=()=>today(),money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catsSeed=[['Food','🍜'],['Transport','🚕'],['Shopping','🛍️'],['Bills','🧾'],['Entertainment','🎬'],['Health','💊'],['Other','💸']];
const incomeSeed=[['Salary','💼'],['Bonus','🎁'],['Gift','🎀'],['Other income','💰']];
const methodsSeed=[['HDFC Credit Card','Credit card'],['SBI Account','Bank account'],['Cash','Cash'],['UPI','UPI']];
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{
money:{tx:[],cats:catsSeed.map(x=>({id:uid(),name:x[0],icon:x[1]})),incomeCats:incomeSeed.map(x=>({id:uid(),name:x[0],icon:x[1]})),methods:methodsSeed.map(x=>({id:uid(),name:x[0],type:x[1]})),incomeAccounts:[{id:uid(),name:'Kotak Account'}],budgets:{overall:50000,categories:{}}},
wealth:{debts:[],assets:[],mfs:[],fds:[],stocks:[],loans:[],epfo:{balance:0,contribution:0,date:today()},history:[],milestones:[]},
dark:false, themeMode:'manual', textScale:'normal'
};
state.money??={tx:[],cats:[],incomeCats:[],methods:[],incomeAccounts:[{id:uid(),name:'Kotak Account'}],budgets:{overall:0,categories:{}}};
state.money.budgets??={overall:0,categories:{}};state.money.budgets.categories??={};
state.wealth??={debts:[],assets:[],mfs:[],fds:[],stocks:[],loans:[],epfo:{balance:0,contribution:0,date:today()},history:[]};
state.wealth.debts??=[];state.wealth.assets??=[];state.wealth.mfs??=[];state.wealth.fds??=[];state.wealth.stocks??=[];state.wealth.loans??=[];
state.wealth.epfo??={balance:0,contribution:0,date:today()};state.wealth.history??=[];state.wealth.milestones??=[];state.themeMode??='manual';state.textScale??='normal';

// One-time migration from V5–V10 storage. V11 never overwrites a non-empty V11 dataset.
(function migrateLegacy(){
  if(localStorage.getItem(KEY)) return;
  const keys=['spend_tracker_v11','spend_tracker_v12','spend_tracker_v10','spend_tracker_v9','spend_tracker_v8','spend_tracker_v7','spend_tracker_v6','spend_tracker_v5'];
  for(const k of keys){
    try{const raw=localStorage.getItem(k);if(!raw)continue;const old=JSON.parse(raw);if(old?.money||old?.wealth){state=old;state.money??={tx:[],cats:[],incomeCats:[],methods:[],incomeAccounts:[{id:uid(),name:'Income account'}],budgets:{overall:0,categories:{}}};state.money.budgets??={overall:0,categories:{}};state.money.budgets.categories??={};state.wealth??={debts:[],assets:[],mfs:[],fds:[],stocks:[],loans:[],epfo:{balance:0,contribution:0,date:today()},history:[],milestones:[]};state.wealth.debts??=[];state.wealth.assets??=[];state.wealth.mfs??=[];state.wealth.fds??=[];state.wealth.stocks??=[];state.wealth.loans??=[];state.wealth.epfo??={balance:0,contribution:0,date:today()};state.wealth.history??=[];state.wealth.milestones??=[];state.themeMode??='manual';state.textScale??='normal';save();break;}}catch(e){}}
})();

let app={mode:'money',moneyPage:'home',wealthPage:'home',month:new Date(new Date().getFullYear(),new Date().getMonth(),1),trend:'7',txFilter:'all',editingTx:null,editingCat:null,editingMethod:null,editingIncome:null,editingDebt:null,editingMf:null,editingFd:null,editingStock:null,editingLoan:null,editingAsset:null,editingRepay:null,editingMilestone:null,txType:'expense',debtType:'lend'};

function $(id){return document.getElementById(id)}
function save(){localStorage.setItem(KEY,JSON.stringify(state));try{navigator.storage?.persist?.().catch?.(()=>{})}catch(e){}}
function refresh(){
  save();
  renderTheme();
  renderShell();
  if(app.mode==='money') renderMoney(); else renderWealth();
  renderMore();
}
function renderTheme(){
  document.body.classList.toggle('dark',!!state.dark);
  document.body.classList.toggle('text-small',state.textScale==='small');
  document.body.classList.toggle('text-large',state.textScale==='large');
  $('themeBtn').textContent=state.dark?'☀':'☾';
  $('themeBtn').setAttribute('aria-label',state.dark?'Switch to light mode':'Switch to dark mode');
  ['textSmall','textNormal','textLarge','wealthTextSmall','wealthTextNormal','wealthTextLarge'].forEach(id=>$(id)?.classList.remove('sel'));
  $((state.textScale==='small'?'textSmall':state.textScale==='large'?'textLarge':'textNormal'))?.classList.add('sel');
  $((state.textScale==='small'?'wealthTextSmall':state.textScale==='large'?'wealthTextLarge':'wealthTextNormal'))?.classList.add('sel');
}

let pendingDelete=null;
function askDelete(kind,id,label='this entry'){
  pendingDelete={kind,id};
  const m=$('deleteMessage'); if(m)m.textContent=`Delete ${label}? This cannot be undone from the app.`;
  $('deleteModal')?.classList.add('show');
}
function closeDelete(){pendingDelete=null;$('deleteModal')?.classList.remove('show')}
function confirmDelete(){
  if(!pendingDelete)return;
  const {kind,id}=pendingDelete,w=state.wealth;
  if(kind==='tx') state.money.tx=state.money.tx.filter(x=>x.id!==id);
  else if(kind==='fd') w.fds=w.fds.filter(x=>x.id!==id);
  else if(kind==='mf') w.mfs=w.mfs.filter(x=>x.id!==id);
  else if(kind==='stock') w.stocks=w.stocks.filter(x=>x.id!==id);
  else if(kind==='loan') w.loans=w.loans.filter(x=>x.id!==id);
  else if(kind==='asset') w.assets=w.assets.filter(x=>x.id!==id);
  else if(kind==='debt') w.debts=w.debts.filter(x=>x.id!==id);
  else if(kind==='milestone') w.milestones=w.milestones.filter(x=>x.id!==id);
  else if(kind==='epfo') w.epfo={balance:0,contribution:0,date:today()};
  save(); closeDelete(); refresh();
}

function renderShell(){
  const moneyMode=app.mode==='money';
  $('moneyApp').style.display=moneyMode?'block':'none';
  $('wealthApp').style.display=moneyMode?'none':'block';
  $('moneyMode').className=moneyMode?'money-active':'';
  $('wealthMode').className=moneyMode?'':'wealth-active';
  const page=moneyMode?app.moneyPage:app.wealthPage;
  document.querySelectorAll('.navitem').forEach(b=>{
    b.classList.remove('money-selected','wealth-selected');
    if(b.dataset.section===page || (!moneyMode && page==='debts' && b.dataset.section==='more'))b.classList.add(moneyMode?'money-selected':'wealth-selected');
  });
  document.querySelectorAll('#moneyApp .screen').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('#wealthApp .screen').forEach(x=>x.classList.remove('active'));
  const el=$(moneyMode?'m'+page:'w'+page); if(el)el.classList.add('active');
  $('fab').classList.toggle('wealth',!moneyMode);
  updateContextActions();
}
function updateContextActions(){const wm=app.mode==='wealth';$('moneyActions').style.display=wm?'none':'grid';$('wealthActions').style.display=wm?'grid':'none'}
function switchApp(mode){
  if(mode!=='money'&&mode!=='wealth')return;
  try{const fresh=JSON.parse(localStorage.getItem(KEY)||'null');if(fresh?.money&&fresh?.wealth)state=fresh;}catch(e){}
  app.mode=mode;
  app.moneyPage=app.moneyPage||'home';app.wealthPage=app.wealthPage||'home';
  if(mode==='wealth'&&!$('w'+app.wealthPage))app.wealthPage='home';
  if(mode==='money'&&!$('m'+app.moneyPage))app.moneyPage='home';
  refresh();
  window.scrollTo({top:0,behavior:'smooth'});
}
function navigate(section){
  if(app.mode==='wealth') openWealthPage(section); else openMoneyPage(section);
}
function openMoneyPage(p){const target=p||'home';app.moneyPage=$('m'+target)?target:'home';refresh();window.scrollTo({top:0,behavior:'smooth'})}
function openWealthPage(p){const target=p||'home';app.wealthPage=$('w'+target)?target:'home';refresh();window.scrollTo({top:0,behavior:'smooth'})}
function openMore(){
  if(app.mode==='wealth'){app.wealthPage=$('wmore')?'more':'home'}else{app.moneyPage=$('mmore')?'more':'home'}
  refresh();
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>{$('navMore')?.focus({preventScroll:true});},0);
}
function goHome(){navigate('home')}
function contextAdd(){if(app.mode==='money')openAction('money');else openAction('wealth')}
function openAction(mode){$('actionTitle').textContent=mode==='money'?'Add transaction':'Add to Wealth';$('actionSub').textContent=mode==='money'?'Choose one money action.':'Choose one wealth record.';$('moneyActions').style.display=mode==='money'?'grid':'none';$('wealthActions').style.display=mode==='wealth'?'grid':'none';$('actionModal').classList.add('show')}
function closeModal(id){$(id).classList.remove('show')}
function toggleTheme(){state.dark=!state.dark;state.themeMode='manual';save();renderTheme()}
function setThemePreference(v){if(v===null){state.themeMode='auto';state.dark=window.matchMedia?.('(prefers-color-scheme: dark)').matches||false}else{state.themeMode='manual';state.dark=!!v}save();renderTheme();refresh()}
function setTextScale(v){state.textScale=['small','normal','large'].includes(v)?v:'normal';save();renderTheme();refresh()}
function renderMoney(){
  const m=monthTx(),e=m.filter(x=>x.type==='expense'),i=m.filter(x=>x.type==='income');
  const spent=e.reduce((s,x)=>s+Number(x.amount||0),0),inc=i.reduce((s,x)=>s+Number(x.amount||0),0);
  $('mTotal').textContent=money(spent);$('mIncome').textContent=money(inc);$('mBalance').textContent=money(inc-spent);$('mCount').textContent=m.length;
  const now=new Date(),dk=todayISO(),todayAmt=state.money.tx.filter(x=>x.type==='expense'&&x.date.slice(0,10)===dk).reduce((s,x)=>s+Number(x.amount||0),0),weekAmt=state.money.tx.filter(x=>x.type==='expense'&&(now-new Date(x.date))/864e5<7).reduce((s,x)=>s+Number(x.amount||0),0);
  $('mToday').textContent=money(todayAmt);$('mWeek').textContent=money(weekAmt);$('mAvg').textContent=money(spent/Math.max(1,new Date(app.month.getFullYear(),app.month.getMonth()+1,0).getDate()));$('mBig').textContent=money(Math.max(0,...e.map(x=>Number(x.amount||0))));
  renderTrend();renderMoneyTransactions();renderMoneyAnalytics();renderBudgets();
}
function moneyMonth(d){app.month=new Date(app.month.getFullYear(),app.month.getMonth()+d,1);renderMoney()}
function monthTx(){return state.money.tx.filter(x=>{const d=new Date(x.date);return d.getFullYear()===app.month.getFullYear()&&d.getMonth()===app.month.getMonth()})}
function initTrendPreset(){
  const sel=$('trendPreset');if(!sel)return;
  const options=[['7','Last 7 days'],['30','Last 30 days'],['60','Last 60 days'],['90','Last 90 days'],['180','Last 180 days'],['365','Last 365 days'],['month','Selected month'],['prev','Previous month'],['year','Selected year'],['custom-month','Select month…'],['custom-year','Select year…']];
  sel.innerHTML=options.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('');sel.value=app.trend||'7';
}
function openTrendDate(kind){
  const ms=$('trendMonthSelect'),ys=$('trendYearSelect');if(!ms||!ys)return;
  const y=app.month.getFullYear(),m=app.month.getMonth()+1;
  ms.innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}">${new Date(2000,i,1).toLocaleDateString('en-IN',{month:'long'})}</option>`).join('');
  ys.innerHTML=Array.from({length:15},(_,i)=>{const yy=new Date().getFullYear()-7+i;return `<option value="${yy}">${yy}</option>`}).join('');
  ms.value=String(m);ys.value=String(y);$('trendDateTitle').textContent=kind==='year'?'Choose year':'Choose month';$('trendDateModal').classList.add('show');
}
function applyTrendDate(){app.month=new Date(+$('trendYearSelect').value,+$('trendMonthSelect').value-1,1);app.trend=$('trendDateTitle').textContent.includes('year')?'year':'month';closeModal('trendDateModal');renderMoney()}
function onTrendPreset(v){
  if(v==='custom-month'||v==='custom-year'){openTrendDate(v==='custom-year'?'year':'month');return}
  app.trend=v;renderTrend();
}
function renderTrend(){
  initTrendPreset();
  const r=app.trend||'7',now=new Date();let start,end,caption='';
  if(['7','30','60','90','180','365'].includes(r)){
    const n=+r;end=new Date(now.getFullYear(),now.getMonth(),now.getDate());start=new Date(end);start.setDate(start.getDate()-n+1);caption=`Rolling period · Last ${n} days`;
  }else if(r==='month'){
    start=new Date(app.month.getFullYear(),app.month.getMonth(),1);end=new Date(app.month.getFullYear(),app.month.getMonth()+1,0);caption=`${app.month.toLocaleDateString('en-IN',{month:'long',year:'numeric'})} · Selected month`;
  }else if(r==='prev'){
    start=new Date(app.month.getFullYear(),app.month.getMonth()-1,1);end=new Date(app.month.getFullYear(),app.month.getMonth(),0);caption=`${end.toLocaleDateString('en-IN',{month:'long',year:'numeric'})} · Previous month`;
  }else{
    start=new Date(app.month.getFullYear(),0,1);end=new Date(app.month.getFullYear(),11,31);caption=`${app.month.getFullYear()} · Selected year`;
  }
  const dates=[];for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1))dates.push(new Date(d));
  const ex=state.money.tx.filter(x=>x.type==='expense');
  const vals=dates.map(d=>{const k=d.toISOString().slice(0,10);return ex.filter(x=>x.date.slice(0,10)===k).reduce((a,x)=>a+Number(x.amount||0),0)});
  const total=vals.reduce((a,b)=>a+b,0),peak=Math.max(0,...vals),peakIndex=vals.indexOf(peak);
  const step=Math.max(1,Math.ceil(dates.length/14)),indices=dates.map((_,i)=>i).filter(i=>i%step===0||i===dates.length-1),mx=Math.max(1,...indices.map(i=>vals[i]));
  $('trendCaption').textContent=caption;$('trendTotal').textContent=money(total);$('trendTotalLabel').textContent='Total spending';
  $('mBars').innerHTML=indices.map(i=>{const d=dates[i],v=vals[i];return `<div class="barcol"><div class="bar ${v?(v/mx>.7?'warm':'cool'):''}" style="height:${Math.max(7,v/mx*100)}px"></div><div class="barlabel">${d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div></div>`}).join('');
  $('trendSummary').innerHTML=peak>0?`<span>${dates.length} days</span><span>Peak <strong>${money(peak)}</strong> · ${dates[peakIndex].toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>`:`<span>${dates.length} days</span><span>No spending in period</span>`;
}

function txHtml(arr){return arr.length?arr.map(x=>{const inc=x.type==='income',tr=x.type==='transfer',title=x.desc||(tr?'To '+x.person:x.cat)||'Transaction',meta=tr?[x.occasion,x.method]:[x.cat,inc?'Credited to '+(x.account||''):x.method],bg=inc?'#ebf8f0':tr?'#edf5ff':x.amount>2000?'#fff0ee':'#f1f4f7',date=x.date?new Date(x.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Date unavailable';return `<div class="tx" style="border-left-color:${inc?'#12b76a':tr?'#53b1fd':x.amount>2000?'#ef4444':'#98a2b3'}"><div class="tx-icon" style="background:${bg}">${inc?'💰':tr?'🤝':iconFor(x.cat)}</div><div class="tx-info"><div class="tx-title">${esc(title)}</div><div class="tx-meta">${esc(meta.filter(Boolean).join(' · '))}</div><div class="tx-date">${esc(date)}</div></div><div class="tx-amount ${inc?'positive':tr?'tx-transfer':''}">${inc?'+':tr?'→':'−'} ${money(x.amount)}</div><button class="tx-menu" aria-label="Transaction options" onclick="openTxMenu('${x.id}')">⋯</button></div>`}).join(''):'<div class="empty">No transactions found.</div>'}
function openTxMenu(id){const x=state.money.tx.find(t=>t.id===id);if(!x)return;app.editingTx=id;const title=x.desc||(x.type==='transfer'?'To '+x.person:x.cat)||'Transaction';$('txActionTitle').textContent=title;$('txActionMeta').textContent=x.date?new Date(x.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'';$('txActionModal').classList.add('show')}
function editSelectedTransaction(){const id=app.editingTx;closeModal('txActionModal');if(id)openTransaction(id)}
function deleteSelectedTransaction(){const id=app.editingTx;closeModal('txActionModal');if(id)askDelete('tx',id,'this transaction')}

function iconFor(c){return state.money.cats.find(x=>x.name===c)?.icon||state.money.incomeCats.find(x=>x.name===c)?.icon||'💸'}
function renderMoneyTransactions(){const q=($('mSearch')?.value||'').toLowerCase();const a=state.money.tx.filter(x=>(app.txFilter==='all'||x.type===app.txFilter)&&(x.desc+' '+(x.cat||'')+' '+(x.method||'')+' '+(x.person||'')+' '+(x.occasion||'')).toLowerCase().includes(q)).sort((a,b)=>new Date(b.date)-new Date(a.date));$('mTxList').innerHTML=txHtml(a);if(app.moneyPage==='home')$('mRecent').innerHTML=txHtml([...state.money.tx].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,15))}
function setMoneyFilter(f,b){app.txFilter=f;document.querySelectorAll('#mtransactions .filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderMoneyTransactions()}
function renderMoneyAnalytics(){const m=monthTx().filter(x=>x.type==='expense'),t=m.reduce((s,x)=>s+x.amount,0);$('mAnTotal').textContent=money(t);let c={};m.forEach(x=>c[x.cat]=(c[x.cat]||0)+x.amount);$('mCats').innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div style="margin-top:13px"><div class="budget-top"><b>${esc(iconFor(k)+' '+k)}</b><span>${money(v)}</span></div><div class="progress" style="margin-top:7px"><i style="width:${v/Math.max(1,t)*100}%"></i></div></div>`).join('')||'<div class="empty">No spending yet.</div>';let p={};m.forEach(x=>p[x.method]=(p[x.method]||0)+x.amount);let mx=Math.max(1,...Object.values(p));$('mMethods').innerHTML=Object.entries(p).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="budget-row"><div class="budget-top"><b>${esc(k)}</b><span>${money(v)}</span></div><div class="progress" style="margin-top:7px"><i style="width:${v/mx*100}%"></i></div></div>`).join('')||'<div class="empty">No payment usage yet.</div>'}
function renderBudgets(){let e=monthTx().filter(x=>x.type==='expense'),t=e.reduce((s,x)=>s+x.amount,0),o=state.money.budgets.overall||0,p=o?Math.min(100,t/o*100):0;$('budgetSpent').textContent=money(t);$('budgetLabel').textContent='of '+money(o);$('budgetBar').style.width=p+'%';$('budgetText').textContent=o?money(Math.max(0,o-t))+' remaining':'Set an overall monthly budget';let c={};e.forEach(x=>c[x.cat]=(c[x.cat]||0)+x.amount);$('budgetCats').innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>{let b=state.money.budgets.categories[k]||0;return `<div class="card" style="margin-top:9px"><div class="budget-top"><b>${esc(iconFor(k)+' '+k)}</b><span>${money(v)}${b?' / '+money(b):' spent'}</span></div>${b?`<div class="progress" style="margin-top:8px"><i style="width:${Math.min(100,v/b*100)}%"></i></div>`:'<div class="small" style="margin-top:5px">No category budget</div>'}</div>`}).join('')||'<div class="empty">No category spending yet.</div>'}
function openTransaction(id=null,forced=null){app.editingTx=id;renderTxOptions();const x=id&&state.money.tx.find(a=>a.id===id);$('txTitle').textContent=id?'Edit transaction':'Add transaction';$('fDate').value=x?.date?.slice(0,10)||today();$('tDate').value=x?.date?.slice(0,10)||today();$('fAmount').value=x?.amount||'';$('fDesc').value=x?.desc||'';$('fCat').value=x?.cat||'';$('fMethod').value=x?.method||'';$('fAccount').value=x?.account||state.money.incomeAccounts[0]?.name||'';$('tAmount').value=x?.amount||'';$('tPerson').value=x?.person||'';$('tOccasion').value=x?.occasion||'';$('tMethod').value=x?.method||state.money.methods[0]?.name||'';setTxType(forced||x?.type||'expense');$('txModal').classList.add('show')}
function renderTxOptions(){$('fMethod').innerHTML=state.money.methods.map(x=>`<option>${esc(x.name)}</option>`).join('');$('tMethod').innerHTML=$('fMethod').innerHTML;$('fAccount').innerHTML=state.money.incomeAccounts.map(x=>`<option>${esc(x.name)}</option>`).join('')}
function setTxType(t){app.txType=t;['te','ti','tt'].forEach(x=>$(x).classList.remove('sel'));({expense:'te',income:'ti',transfer:'tt'}[t]&&$({expense:'te',income:'ti',transfer:'tt'}[t]).classList.add('sel'));$('normalFields').style.display=t==='transfer'?'none':'block';$('transferFields').style.display=t==='transfer'?'block':'none';$('methodLabel').style.display=t==='income'?'none':'block';$('fMethod').style.display=t==='income'?'none':'block';$('accountLabel').style.display=t==='income'?'block':'none';$('fAccount').style.display=t==='income'?'block':'none';const cats=t==='income'?state.money.incomeCats:state.money.cats;$('fCat').innerHTML=cats.map(x=>`<option value="${esc(x.name)}">${esc(x.icon+' '+x.name)}</option>`).join('')}
function saveTransaction(){let o;if(app.txType==='transfer'){let a=+$('tAmount').value,p=$('tPerson').value.trim();if(!a||!p||/^\d+$/.test(p))return alert('Enter a valid amount and person name.');o={id:app.editingTx||uid(),type:'transfer',amount:a,person:p,occasion:$('tOccasion').value.trim(),method:$('tMethod').value,date:new Date($('tDate').value+'T12:00:00').toISOString()}}else{let a=+$('fAmount').value,cat=$('fCat').value;if(!a||!cat)return alert('Amount and category are required.');o={id:app.editingTx||uid(),type:app.txType,amount:a,cat,method:app.txType==='income'?'':$('fMethod').value,account:app.txType==='income'?$('fAccount').value:'',date:new Date($('fDate').value+'T12:00:00').toISOString(),desc:$('fDesc').value.trim()};if(app.txType==='expense'&&!o.method)return alert('Payment method is required.')}if(app.editingTx)state.money.tx[state.money.tx.findIndex(x=>x.id===app.editingTx)]=o;else state.money.tx.push(o);snapshotWorth();closeModal('txModal');refresh()}
function openCategory(id=null){app.editingCat=id;const c=id&&state.money.cats.find(x=>x.id===id);$('catTitle').textContent=id?'Edit category':'Add category';$('catName').value=c?.name||'';$('catIcon').value=c?.icon||'';$('categoryModal').classList.add('show')}
function saveCategory(){let n=$('catName').value.trim();if(!n||!/[^\W\d_]/u.test(n))return alert('Enter a name containing at least one letter.');if(app.editingCat){let c=state.money.cats.find(x=>x.id===app.editingCat),old=c.name;c.name=n;c.icon=$('catIcon').value.trim()||'💸';state.money.tx.forEach(x=>{if(x.cat===old)x.cat=n})}else state.money.cats.push({id:uid(),name:n,icon:$('catIcon').value.trim()||'💸'});closeModal('categoryModal');refresh()}
function deleteCategory(id){if(state.money.cats.length<=1)return alert('Keep one category.');const c=state.money.cats.find(x=>x.id===id),fb=state.money.cats.find(x=>x.id!==id)?.name;if(state.money.tx.some(x=>x.cat===c.name)){if(!confirm(`Move "${c.name}" transactions to "${fb}"?`))return;state.money.tx.forEach(x=>{if(x.cat===c.name)x.cat=fb})}else if(!confirm(`Delete "${c.name}"?`))return;state.money.cats=state.money.cats.filter(x=>x.id!==id);refresh()}

function openMilestone(id=null){app.editingMilestone=id;let m=id&&state.wealth.milestones.find(x=>x.id===id);$('milestoneTitle').textContent=id?'Edit milestone':'Add milestone';$('msName').value=m?.name||'';$('msTarget').value=m?.target||'';$('msCurrent').value=m?.current||'';$('msDate').value=m?.date||'';$('milestoneModal').classList.add('show')}
function saveMilestone(){let n=$('msName').value.trim(),target=+$('msTarget').value,current=+$('msCurrent').value||0;if(!n||!target||/^\d+$/.test(n)||target<=0)return alert('Enter a text goal name and target amount.');let old=app.editingMilestone&&state.wealth.milestones.find(x=>x.id===app.editingMilestone),o={id:app.editingMilestone||uid(),name:n,target,current:Math.min(current,target),date:$('msDate').value,status:old?.status||'open'};if(app.editingMilestone)state.wealth.milestones[state.wealth.milestones.findIndex(x=>x.id===app.editingMilestone)]=o;else state.wealth.milestones.push(o);closeModal('milestoneModal');refresh()}
function deleteMilestone(id){askDelete('milestone',id,'this milestone')}
function milestoneCards(limit=null){const arr=limit?state.wealth.milestones.slice(0,limit):state.wealth.milestones;return arr.length?arr.map(m=>{let p=Math.min(100,(m.current||0)/(m.target||1)*100),left=Math.max(0,m.target-(m.current||0));return `<div class="milestone"><div class="milestone-head"><div class="milestone-title">${esc(m.name)}</div><div class="milestone-amt">${p.toFixed(0)}%</div></div><div class="milestone-track"><i style="width:${p}%"></i></div><div class="milestone-foot"><span>${money(m.current||0)} / ${money(m.target)}</span><span>${left?money(left)+' left':'Completed'}</span></div><div class="actions"><button class="mini" onclick="openMilestone('${m.id}')">Edit</button><button class="mini danger" onclick="deleteMilestone('${m.id}')">Delete</button></div></div>`}).join(''):'<div class="empty">No milestones yet. Add a financial target.</div>'}
function renderMilestones(){
const box=$('wealthMilestones');if(!box)return;
if(!state.wealth.milestones.length){box.innerHTML='<div class="empty">No milestones yet. Add one financial target.</div>';return}
box.innerHTML=state.wealth.milestones.map(m=>{let p=Math.min(100,(m.current||0)/(m.target||1)*100);let left=Math.max(0,m.target-(m.current||0));return `<div class="milestone"><div class="milestone-head"><div class="milestone-title">${esc(m.name)}</div><div class="milestone-amt">${money(m.current||0)} / ${money(m.target)}</div></div><div class="milestone-track"><i style="width:${p}%"></i></div><div class="milestone-foot"><span>${p.toFixed(0)}% complete · ${money(left)} left</span><span>${m.date?'Target '+new Date(m.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'No target date'}</span></div><div class="actions"><button class="mini" onclick="openMilestone('${m.id}')">Edit</button><button class="mini danger" onclick="deleteMilestone('${m.id}')">Delete</button></div></div>`}).join('');
}
function renderMore(){
  renderProfile();
  const name=getProfileName();
  $('profileNameLabel')?.replaceChildren(document.createTextNode(name));
  $('wealthProfileNameLabel')?.replaceChildren(document.createTextNode(name));
  $('mCatsManage').innerHTML=state.money.cats.map(c=>`<div class="manage-row"><b>${esc(c.icon+' '+c.name)}</b><span></span><button class="mini" onclick="openCategory('${c.id}')">Edit</button><button class="mini danger" onclick="deleteCategory('${c.id}')">Delete</button></div>`).join('');
  $('mMethodsManage').innerHTML=state.money.methods.map(m=>`<div class="manage-row"><b>💳 ${esc(m.name)}</b><span>${esc(m.type)}</span><button class="mini" onclick="openMethod('${m.id}')">Edit</button><button class="mini danger" onclick="deleteMethod('${m.id}')">Delete</button></div>`).join('');
  $('mIncomeManage').innerHTML=state.money.incomeAccounts.map(a=>`<div class="manage-row"><b>🏦 ${esc(a.name)}</b><span></span><button class="mini" onclick="openIncomeAccount('${a.id}')">Edit</button><button class="mini danger" onclick="deleteIncomeAccount('${a.id}')">Delete</button></div>`).join('');
}
function openMethod(id=null){app.editingMethod=id;const m=id&&state.money.methods.find(x=>x.id===id);$('methodTitle').textContent=id?'Edit payment method':'Add payment method';$('methodName').value=m?.name||'';$('methodType').value=m?.type||'Other';$('methodModal').classList.add('show')}
function saveMethod(){let n=$('methodName').value.trim();if(!n||!/[^\W\d_]/u.test(n))return alert('Enter a name containing at least one letter.');if(app.editingMethod){let m=state.money.methods.find(x=>x.id===app.editingMethod),old=m.name;m.name=n;m.type=$('methodType').value;state.money.tx.forEach(x=>{if(x.method===old)x.method=n})}else state.money.methods.push({id:uid(),name:n,type:$('methodType').value});closeModal('methodModal');refresh()}
function deleteMethod(id){if(state.money.methods.length<=1)return alert('Keep one payment method.');const m=state.money.methods.find(x=>x.id===id),fb=state.money.methods.find(x=>x.id!==id)?.name;if(state.money.tx.some(x=>x.method===m.name)){if(!confirm(`Move transactions from "${m.name}" to "${fb}"?`))return;state.money.tx.forEach(x=>{if(x.method===m.name)x.method=fb})}else if(!confirm(`Delete "${m.name}"?`))return;state.money.methods=state.money.methods.filter(x=>x.id!==id);refresh()}
function openIncomeAccount(id=null){app.editingIncome=id;const a=id&&state.money.incomeAccounts.find(x=>x.id===id);$('incomeName').value=a?.name||'';$('incomeModal').classList.add('show')}
function saveIncomeAccount(){let n=$('incomeName').value.trim();if(!n||!/[^\W\d_]/u.test(n))return alert('Enter a name containing at least one letter.');if(app.editingIncome){let a=state.money.incomeAccounts.find(x=>x.id===app.editingIncome),old=a.name;a.name=n;state.money.tx.forEach(x=>{if(x.account===old)x.account=n})}else state.money.incomeAccounts.push({id:uid(),name:n});closeModal('incomeModal');refresh()}
function deleteIncomeAccount(id){if(state.money.incomeAccounts.length<=1)return alert('Keep one income account.');state.money.incomeAccounts=state.money.incomeAccounts.filter(x=>x.id!==id);refresh()}
function openBudget(){$('overallBudgetInput').value=state.money.budgets.overall||'';$('budgetEdit').innerHTML=state.money.cats.map(c=>`<label>${esc(c.icon+' '+c.name)}</label><input id="b_${c.id}" type="number" inputmode="decimal" min="0" step="100" value="${state.money.budgets.categories[c.name]||''}" placeholder="No category budget">`).join('');$('budgetModal').classList.add('show')}
function saveBudgets(){state.money.budgets.overall=+$('overallBudgetInput').value||0;state.money.cats.forEach(c=>{let v=+$('b_'+c.id).value||0;if(v)state.money.budgets.categories[c.name]=v;else delete state.money.budgets.categories[c.name]});closeModal('budgetModal');refresh()}

function wealthCalc(){const mfs=state.wealth.mfs.reduce((s,x)=>s+x.value,0),stocks=state.wealth.stocks.reduce((s,x)=>s+x.value,0),fds=state.wealth.fds.reduce((s,x)=>s+(x.value||x.principal),0),other=state.wealth.assets.reduce((s,x)=>s+x.value,0),epfo=state.wealth.epfo.balance;const income=state.money.tx.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0),expense=state.money.tx.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0),transfer=state.money.tx.filter(x=>x.type==='transfer').reduce((s,x)=>s+x.amount,0),cash=Math.max(0,income-expense-transfer);const assets=cash+mfs+stocks+fds+other+epfo,liab=state.wealth.loans.reduce((s,x)=>s+x.outstanding,0),lend=state.wealth.debts.filter(x=>x.type==='lend'&&x.status==='open').reduce((s,x)=>s+x.remaining,0),borrow=state.wealth.debts.filter(x=>x.type==='borrow'&&x.status==='open').reduce((s,x)=>s+x.remaining,0);return{assets,liab,lend,borrow,net:assets-liab+lend-borrow,cash,mfs,stocks,fds,other,epfo}}
function snapshotWorth(){const w=wealthCalc(),last=state.wealth.history.at(-1);if(!last||last.net!==w.net||last.assets!==w.assets||last.liabilities!==w.liab)state.wealth.history.push({date:new Date().toISOString(),net:w.net,assets:w.assets,liabilities:w.liab})}
function renderWealth(){const w=wealthCalc();$('wNetWorth').textContent=money(w.net);$('wAssets').textContent=money(w.assets);$('wLiab').textContent=money(w.liab);$('wLend').textContent=money(w.lend);$('wBorrow').textContent=money(w.borrow);$('wDelta').textContent=`${money(w.assets)} assets · ${money(w.liab)} liabilities`;const g=[['Money balance estimate',w.cash,'#6f7d93'],['FDs',w.fds,'#e58b36'],['Mutual funds',w.mfs,'#315d87'],['Stocks / ETFs',w.stocks,'#7957c7'],['EPFO',w.epfo,'#1b9870'],['Other assets',w.other,'#b47a22']].filter(x=>x[1]>0),sum=Math.max(1,g.reduce((s,x)=>s+x[1],0));$('wMix').innerHTML=g.map(x=>`<i class="piece" style="width:${x[1]/sum*100}%;background:${x[2]}"></i>`).join('');$('wLegend').innerHTML=g.map(x=>`<div><span class="dot" style="background:${x[2]}"></span>${esc(x[0])} · ${money(x[1])}</div>`).join('')||'<div class="small">Add wealth records.</div>';
$('wAssetPreview').innerHTML=g.slice().reverse().slice(0,5).map(x=>`<div class="asset"><div class="asset-head"><div class="asset-name">${esc(x[0])}</div><div class="asset-value">${money(x[1])}</div></div></div>`).join('')||'<div class="empty">No assets yet.</div>';if($('wdLend'))$('wdLend').textContent=money(w.lend);if($('wdBorrow'))$('wdBorrow').textContent=money(w.borrow);
$('wLiabPreview').innerHTML=state.wealth.loans.slice(0,3).map(l=>`<div class="asset"><div class="asset-head"><div><div class="asset-name">🏦 ${esc(l.name)}</div><div class="asset-sub">EMI ${money(l.emi)} · ${l.paid||0}/${l.tenure||'?'} paid</div></div><div class="asset-value">${money(l.outstanding)}</div></div></div>`).join('')||'<div class="empty">No loans yet.</div>';
$('wDebtPreview').innerHTML=state.wealth.debts.filter(d=>d.status==='open').slice(0,3).map(d=>`<div class="debt"><div class="debt-head"><div class="debt-person">${esc(d.person)}</div><span class="status">${d.type==='lend'?'They owe you':'You owe them'}</span></div><div class="debt-amount ${d.type==='lend'?'lend':'borrow'}">${money(d.remaining)}</div></div>`).join('')||'<div class="empty">No open money owed.</div>';
renderNetworth();renderWealthActivity();renderWealthAnalytics();renderDebts();renderMilestones();
const mp=$('wMilestonePreview');if(mp)mp.innerHTML=milestoneCards(2);
const bp=$('wealthBudgetMilestones');if(bp)bp.innerHTML=milestoneCards();
const active=state.wealth.milestones.filter(m=>(m.current||0)<(m.target||0));const totalTarget=active.reduce((a,m)=>a+Number(m.target||0),0),totalCurrent=active.reduce((a,m)=>a+Math.min(Number(m.current||0),Number(m.target||0)),0);if($('wGoalCount'))$('wGoalCount').textContent=active.length;if($('wGoalProgress'))$('wGoalProgress').textContent=(totalTarget?Math.round(totalCurrent/totalTarget*100):0)+'%';
}
function renderNetworth(){const w=wealthCalc();$('nwTotal').textContent=money(w.net);$('fdList').innerHTML=state.wealth.fds.map(f=>`<div class="asset"><div class="asset-head"><div><div class="asset-name">🏧 ${esc(f.bank)} FD</div><div class="asset-sub">Principal ${money(f.principal)}${f.rate?' · '+f.rate+'%':''}${f.maturity?' · Matures '+new Date(f.maturity).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):''}</div></div><div class="asset-value">${money(f.value||f.principal)}</div></div><div class="actions"><button class="mini" onclick="openFd('${f.id}')">Edit</button><button class="mini danger" onclick="deleteFd('${f.id}')">Delete</button></div></div>`).join('')||'<div class="empty">No FDs yet.</div>';
$('mfList').innerHTML=state.wealth.mfs.map(m=>`<div class="asset"><div class="asset-head"><div><div class="asset-name">📈 ${esc(m.name)}</div><div class="asset-sub">Invested ${money(m.invested)} · Gain ${money(m.value-(m.invested||0))}</div></div><div class="asset-value">${money(m.value)}</div></div><div class="actions"><button class="mini" onclick="openMf('${m.id}')">Edit</button><button class="mini danger" onclick="deleteMf('${m.id}')">Delete</button></div></div>`).join('')||'<div class="empty">No mutual funds yet.</div>';
$('stockList').innerHTML=state.wealth.stocks.map(s=>`<div class="asset"><div class="asset-head"><div><div class="asset-name">📊 ${esc(s.name)}</div><div class="asset-sub">${s.qty?s.qty+' units · ':''}${s.avg?'Avg '+money(s.avg)+' · ':''}${s.price?'Now '+money(s.price):''}</div></div><div class="asset-value">${money(s.value)}</div></div><div class="actions"><button class="mini" onclick="openStock('${s.id}')">Edit</button><button class="mini danger" onclick="deleteStock('${s.id}')">Delete</button></div></div>`).join('')||'<div class="empty">No stocks or ETFs yet.</div>';
$('epfoCard').innerHTML=`<div class="budget-top"><b>Current balance</b><span>${money(state.wealth.epfo.balance)}</span></div><div class="small" style="margin-top:5px">Expected monthly contribution ${money(state.wealth.epfo.contribution)} · Updated ${new Date(state.wealth.epfo.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>`;
$('loanList').innerHTML=state.wealth.loans.map(l=>`<div class="asset"><div class="asset-head"><div><div class="asset-name">🏦 ${esc(l.name)}</div><div class="asset-sub">EMI ${money(l.emi)} · ${l.paid||0}/${l.tenure||'?'} paid${l.next?' · Next '+new Date(l.next).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</div></div><div class="asset-value">${money(l.outstanding)}</div></div><div class="actions"><button class="mini" onclick="recordLoanEmi('${l.id}')">Pay EMI</button><button class="mini" onclick="openLoan('${l.id}')">Edit</button><button class="mini danger" onclick="deleteLoan('${l.id}')">Delete</button></div></div>`).join('')||'<div class="empty">No loans yet.</div>';
$('otherAssetList').innerHTML=state.wealth.assets.map(a=>`<div class="asset"><div class="asset-head"><div><div class="asset-name">🏠 ${esc(a.name)}</div><div class="asset-sub">${esc(a.type)} · Updated ${new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></div><div class="asset-value">${money(a.value)}</div></div><div class="actions"><button class="mini" onclick="openAsset('${a.id}')">Edit</button><button class="mini danger" onclick="deleteAsset('${a.id}')">Delete</button></div></div>`).join('')||'<div class="empty">No other assets yet.</div>';
$('worthHistory').innerHTML=state.wealth.history.length?[...state.wealth.history].slice(-10).reverse().map(h=>`<div class="history-row"><b>${new Date(h.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</b><span>${money(h.net)}</span></div>`).join(''):'<div class="small">Snapshots appear after wealth updates.</div>'}
function renderWealthActivity(){let rows=[];state.wealth.fds.forEach(x=>rows.push(['🏧',x.bank+' FD','Fixed deposit',x.value||x.principal,'#e58b36']));state.wealth.mfs.forEach(x=>rows.push(['📈',x.name,'Mutual fund',x.value,'#315d87']));state.wealth.stocks.forEach(x=>rows.push(['📊',x.name,'Stock / ETF',x.value,'#7957c7']));state.wealth.loans.forEach(x=>rows.push(['🏦',x.name,'Loan outstanding',-x.outstanding,'#c4322b']));rows.push(['🏢','EPFO','Retirement',state.wealth.epfo.balance,'#1b9870']);state.wealth.assets.forEach(x=>rows.push(['🏠',x.name,x.type,x.value,'#b47a22']));state.wealth.debts.filter(x=>x.status==='open').forEach(x=>rows.push(['🤝',x.person,x.type==='lend'?'Owed to you':'You owe',x.type==='lend'?x.remaining:-x.remaining,x.type==='lend'?'#16734a':'#c4322b']));$('wealthActivity').innerHTML=rows.length?rows.map(r=>`<div class="budget-row"><div class="budget-top"><b>${r[0]} ${esc(r[1])}</b><span style="font-weight:830;color:${r[4]}">${r[3]<0?'− ':'+'}${money(Math.abs(r[3]))}</span></div><div class="small">${esc(r[2])}</div></div>`).join(''):'<div class="empty">No Wealth records.</div>'}
function renderWealthAnalytics(){
  const w=wealthCalc();
  $('waNet').textContent=money(w.net);
  if($('waAssets'))$('waAssets').textContent=money(w.assets);
  if($('waLiab'))$('waLiab').textContent=money(w.liab);
  if($('waLend'))$('waLend').textContent=money(w.lend);
  if($('waBorrow'))$('waBorrow').textContent=money(w.borrow);
  const arr=[['Fixed deposits',w.fds,'#e58b36','FD'],['Mutual funds',w.mfs,'#315d87','MF'],['Stocks / ETFs',w.stocks,'#7957c7','ST'],['EPFO',w.epfo,'#1b9870','EP'],['Other assets',w.other,'#b47a22','OT'],['Money balance',w.cash,'#7b8798','CA']].filter(x=>x[1]>0);
  const total=Math.max(1,arr.reduce((a,x)=>a+x[1],0));
  if($('waAllocTotal'))$('waAllocTotal').textContent=money(total);
  $('waAlloc').innerHTML=arr.length?arr.map(x=>{const pct=x[1]/total*100;return `<div class="wealth-alloc-row"><div class="wealth-alloc-icon">${x[3]}</div><div class="wealth-alloc-main"><div class="wealth-alloc-top"><b>${esc(x[0])}</b><span>${money(x[1])} · ${pct.toFixed(0)}%</span></div><div class="wealth-alloc-track"><i style="width:${pct}%;background:${x[2]}"></i></div></div></div>`}).join(''):'<div class="empty">Add a wealth record to see allocation.</div>';
  $('waBreak').innerHTML=[['Assets',w.assets,'Positive'],['Liabilities',w.liab,'Debt'],['Receivable',w.lend,'Money owed to you'],['Payable',w.borrow,'Money you owe']].map(x=>`<div class="wealth-break-row"><div><b>${x[0]}</b><span>${x[2]}</span></div><strong>${money(x[1])}</strong></div>`).join('');
}
function renderDebts(){$('debtList').innerHTML=state.wealth.debts.length?state.wealth.debts.map(d=>`<div class="debt"><div class="debt-head"><div><div class="debt-person">${esc(d.person)}</div><div class="small">${esc(d.reason||'No reason')}${d.due?' · Due '+new Date(d.due).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</div></div><span class="status">${d.status==='open'?(d.type==='lend'?'They owe you':'You owe them'):'Settled'}</span></div><div class="debt-amount ${d.type==='lend'?'lend':'borrow'}">${money(d.remaining)}</div>${d.status==='open'?`<div class="actions"><button class="mini" onclick="openRepay('${d.id}')">Record repayment</button><button class="mini" onclick="openDebt('${d.id}')">Edit</button><button class="mini danger" onclick="deleteDebt('${d.id}')">Delete</button></div>`:'<div class="small">Fully settled.</div>'}${d.repayments?.length?`<div class="small" style="margin-top:8px">Repayments: ${d.repayments.map(r=>money(r.amount)).join(' · ')}</div>`:''}</div>`).join(''):'<div class="empty">Nothing owed.</div>'}
function openDebt(id=null){app.editingDebt=id;let d=id&&state.wealth.debts.find(x=>x.id===id);$('debtTitle').textContent=id?'Edit money owed':'Add money owed';$('dPerson').value=d?.person||'';$('dAmount').value=d?.remaining??d?.amount??'';$('dReason').value=d?.reason||'';$('dDue').value=d?.due||'';$('dNote').value=d?.note||'';setDebtType(d?.type||'lend');$('debtModal').classList.add('show')}
function setDebtType(t){app.debtType=t;$('lendType').classList.toggle('sel',t==='lend');$('borrowType').classList.toggle('sel',t==='borrow')}
function saveDebt(){let p=$('dPerson').value.trim(),a=+$('dAmount').value;if(!p||/^\d+$/.test(p)||!a||a<=0)return alert('Enter a valid person name and amount.');let old=app.editingDebt&&state.wealth.debts.find(x=>x.id===app.editingDebt),o={id:app.editingDebt||uid(),type:app.debtType,person:p,amount:old?.amount||a,remaining:app.editingDebt?Math.min(a,old.amount):a,reason:$('dReason').value.trim(),due:$('dDue').value,note:$('dNote').value.trim(),status:app.editingDebt&&a<=0?'settled':(old?.status||'open'),repayments:old?.repayments||[]};if(app.editingDebt)state.wealth.debts[state.wealth.debts.findIndex(x=>x.id===app.editingDebt)]=o;else state.wealth.debts.push(o);snapshotWorth();closeModal('debtModal');refresh()}
function openRepay(id){const d=state.wealth.debts.find(x=>x.id===id);app.editingRepay=id;$('repaySummary').innerHTML=`<b>${esc(d.person)}</b><div class="small">${d.type==='lend'?'They owe you':'You owe them'} · Remaining ${money(d.remaining)}</div>`;$('repayAmount').value='';$('repayDate').value=today();$('repayModal').classList.add('show')}
function saveRepayment(){const d=state.wealth.debts.find(x=>x.id===app.editingRepay),a=+$('repayAmount').value;if(!d||!a||a<=0)return alert('Enter a valid repayment.');if(a>d.remaining)return alert('Repayment cannot exceed the remaining amount.');d.remaining-=a;d.status=d.remaining<=0?'settled':'open';d.repayments??=[];d.repayments.push({amount:a,date:$('repayDate').value});snapshotWorth();closeModal('repayModal');refresh()}
function deleteDebt(id){if(confirm('Delete this money-owed record?')){state.wealth.debts=state.wealth.debts.filter(x=>x.id!==id);snapshotWorth();refresh()}}
function openEpfo(){$('eBalance').value=state.wealth.epfo.balance||'';$('eContribution').value=state.wealth.epfo.contribution||'';$('eDate').value=state.wealth.epfo.date||today();$('epfoModal').classList.add('show')}
function saveEpfo(){state.wealth.epfo={balance:+$('eBalance').value||0,contribution:+$('eContribution').value||0,date:$('eDate').value||today()};snapshotWorth();closeModal('epfoModal');refresh()}
function openMf(id=null){app.editingMf=id;let m=id&&state.wealth.mfs.find(x=>x.id===id);$('mfTitle').textContent=id?'Edit mutual fund':'Add mutual fund';$('mfName').value=m?.name||'';$('mfInvested').value=m?.invested||'';$('mfValue').value=m?.value||'';$('mfUnits').value=m?.units||'';$('mfDate').value=m?.date||today();$('mfModal').classList.add('show')}
function saveMf(){let n=$('mfName').value.trim(),v=+$('mfValue').value;if(!n||/^\d+$/.test(n)||!v)return alert('Enter a text fund name and current value.');let o={id:app.editingMf||uid(),name:n,invested:+$('mfInvested').value||0,value:v,units:+$('mfUnits').value||0,date:$('mfDate').value};if(app.editingMf)state.wealth.mfs[state.wealth.mfs.findIndex(x=>x.id===app.editingMf)]=o;else state.wealth.mfs.push(o);snapshotWorth();closeModal('mfModal');refresh()}
function deleteMf(id){if(confirm('Delete this mutual fund?')){state.wealth.mfs=state.wealth.mfs.filter(x=>x.id!==id);snapshotWorth();refresh()}}
function openFd(id=null){app.editingFd=id;let f=id&&state.wealth.fds.find(x=>x.id===id);$('fdTitle').textContent=id?'Edit fixed deposit':'Add fixed deposit';$('fdBank').value=f?.bank||'';$('fdPrincipal').value=f?.principal||'';$('fdRate').value=f?.rate||'';$('fdValue').value=f?.value||f?.principal||'';$('fdStart').value=f?.start||'';$('fdMaturity').value=f?.maturity||'';$('fdModal').classList.add('show')}
function saveFd(){let b=$('fdBank').value.trim(),p=+$('fdPrincipal').value;if(!b||/^\d+$/.test(b)||!p)return alert('Enter a text bank name and principal.');let o={id:app.editingFd||uid(),bank:b,principal:p,rate:+$('fdRate').value||0,value:+$('fdValue').value||p,start:$('fdStart').value,maturity:$('fdMaturity').value};if(app.editingFd)state.wealth.fds[state.wealth.fds.findIndex(x=>x.id===app.editingFd)]=o;else state.wealth.fds.push(o);snapshotWorth();closeModal('fdModal');refresh()}
function deleteFd(id){if(confirm('Delete this FD?')){state.wealth.fds=state.wealth.fds.filter(x=>x.id!==id);snapshotWorth();refresh()}}
function openStock(id=null){app.editingStock=id;let s=id&&state.wealth.stocks.find(x=>x.id===id);$('stockTitle').textContent=id?'Edit stock / ETF':'Add stock / ETF';$('stockName').value=s?.name||'';$('stockQty').value=s?.qty||'';$('stockAvg').value=s?.avg||'';$('stockPrice').value=s?.price||'';$('stockValue').value=s?.value||'';$('stockDate').value=s?.date||today();$('stockModal').classList.add('show')}
function saveStock(){let n=$('stockName').value.trim(),v=+$('stockValue').value;if(!n||/^\d+$/.test(n)||!v)return alert('Enter a text stock/ETF name and current value.');let o={id:app.editingStock||uid(),name:n,qty:+$('stockQty').value||0,avg:+$('stockAvg').value||0,price:+$('stockPrice').value||0,value:v,date:$('stockDate').value};if(app.editingStock)state.wealth.stocks[state.wealth.stocks.findIndex(x=>x.id===app.editingStock)]=o;else state.wealth.stocks.push(o);snapshotWorth();closeModal('stockModal');refresh()}
function deleteStock(id){if(confirm('Delete this stock / ETF?')){state.wealth.stocks=state.wealth.stocks.filter(x=>x.id!==id);snapshotWorth();refresh()}}
function openLoan(id=null){app.editingLoan=id;let l=id&&state.wealth.loans.find(x=>x.id===id);$('loanTitle').textContent=id?'Edit loan':'Add loan';$('loanName').value=l?.name||'';$('loanOutstanding').value=l?.outstanding||'';$('loanEmi').value=l?.emi||'';$('loanRate').value=l?.rate||'';$('loanTenure').value=l?.tenure||'';$('loanPaid').value=l?.paid||'';$('loanNext').value=l?.next||'';$('loanModal').classList.add('show')}
function saveLoan(){let n=$('loanName').value.trim(),o=+$('loanOutstanding').value;if(!n||/^\d+$/.test(n)||!o)return alert('Enter a text loan name and balance.');let x={id:app.editingLoan||uid(),name:n,outstanding:o,emi:+$('loanEmi').value||0,rate:+$('loanRate').value||0,tenure:+$('loanTenure').value||0,paid:+$('loanPaid').value||0,next:$('loanNext').value};if(app.editingLoan)state.wealth.loans[state.wealth.loans.findIndex(x=>x.id===app.editingLoan)]=x;else state.wealth.loans.push(x);snapshotWorth();closeModal('loanModal');refresh()}
function recordLoanEmi(id){const l=state.wealth.loans.find(x=>x.id===id);if(!l)return;const amount=Number(l.emi||0);if(!amount)return alert('Set the EMI amount first.');l.outstanding=Math.max(0,Number(l.outstanding||0)-amount);l.paid=Number(l.paid||0)+1;if(l.tenure&&l.paid>l.tenure)l.paid=l.tenure;snapshotWorth();refresh()}
function deleteLoan(id){if(confirm('Delete this loan?')){state.wealth.loans=state.wealth.loans.filter(x=>x.id!==id);snapshotWorth();refresh()}}
function openAsset(id=null){app.editingAsset=id;let a=id&&state.wealth.assets.find(x=>x.id===id);$('assetTitle').textContent=id?'Edit other asset':'Add other asset';$('assetName').value=a?.name||'';$('assetType').value=a?.type||'Other';$('assetValue').value=a?.value||'';$('assetDate').value=a?.date||today();$('assetModal').classList.add('show')}
function saveAsset(){let n=$('assetName').value.trim(),v=+$('assetValue').value;if(!n||/^\d+$/.test(n)||!v)return alert('Enter a text asset name and value.');let x={id:app.editingAsset||uid(),name:n,type:$('assetType').value,value:v,date:$('assetDate').value};if(app.editingAsset)state.wealth.assets[state.wealth.assets.findIndex(x=>x.id===app.editingAsset)]=x;else state.wealth.assets.push(x);snapshotWorth();closeModal('assetModal');refresh()}
function deleteAsset(id){if(confirm('Delete this asset?')){state.wealth.assets=state.wealth.assets.filter(x=>x.id!==id);snapshotWorth();refresh()}}
function getProfileName(){return localStorage.getItem(PROFILE_KEY+'_name')||localStorage.getItem('spend_tracker_profiles_v12_name')||localStorage.getItem('spend_tracker_profile_v16_name')||'Default'}
function getProfileEmail(){return localStorage.getItem(PROFILE_KEY+'_email')||''}
function profileInitials(name){const n=String(name||'Default').trim();if(!n)return 'A';return n.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'A'}
function renderProfile(){const name=getProfileName(),email=getProfileEmail();['profileNameInput','wealthProfileNameInput'].forEach(id=>{const e=$(id);if(e)e.value=name==='Default'?'':name});['profileEmailInput','wealthProfileEmailInput'].forEach(id=>{const e=$(id);if(e)e.value=email});['profileAvatar','wealthProfileAvatar'].forEach(id=>{const e=$(id);if(e)e.textContent=profileInitials(name)});$('profileNameLabel')?.replaceChildren(document.createTextNode(name));$('wealthProfileNameLabel')?.replaceChildren(document.createTextNode(name))}
function saveProfile(){const nameEl=app.mode==='wealth'?$('wealthProfileNameInput'):$('profileNameInput'),emailEl=app.mode==='wealth'?$('wealthProfileEmailInput'):$('profileEmailInput');const n=(nameEl?.value||'').trim();const e=(emailEl?.value||'').trim();if(!n)return alert('Enter your name.');if(e&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))return alert('Enter a valid email address.');localStorage.setItem(PROFILE_KEY+'_name',n);localStorage.setItem(PROFILE_KEY+'_email',e);renderMore();alert('Profile saved.')}
function renameProfile(){const n=prompt('Profile name',getProfileName());if(n&&n.trim()){localStorage.setItem(PROFILE_KEY+'_name',n.trim());renderMore()}}
function resetProfile(){if(!confirm('Delete all current Money and Wealth data? This cannot be undone from the app.'))return;localStorage.removeItem(KEY);localStorage.removeItem(PROFILE_KEY+'_name');localStorage.removeItem(PROFILE_KEY+'_email');location.reload()}
function backupPayload(){return {format:'Spend Tracker Backup',version:'18.1',schema:'spend-tracker-v18.1',exportedAt:new Date().toISOString(),profile:{name:getProfileName(),email:getProfileEmail()},data:state}}
function backupBlob(){return new Blob([JSON.stringify(backupPayload(),null,2)],{type:'application/json'})}
function openBackupDb(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(new Error('IndexedDB unavailable'));const r=indexedDB.open(BACKUP_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('meta'))r.result.createObjectStore('meta')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('DB error'))})}
async function getBackupHandle(){try{const db=await openBackupDb();return await new Promise((resolve,reject)=>{const t=db.transaction('meta','readonly'),q=t.objectStore('meta').get('fileHandle');q.onsuccess=()=>resolve(q.result||null);q.onerror=()=>reject(q.error)})}catch(e){return null}}
async function setBackupHandle(handle){try{const db=await openBackupDb();await new Promise((resolve,reject)=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').put(handle,'fileHandle');t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}catch(e){}}
async function clearBackupHandle(){try{const db=await openBackupDb();await new Promise((resolve,reject)=>{const t=db.transaction('meta','readwrite');t.objectStore('meta').delete('fileHandle');t.oncomplete=resolve;t.onerror=()=>reject(t.error)})}catch(e){}}
async function writeHandle(handle,blob){if(handle.queryPermission){let p=await handle.queryPermission({mode:'readwrite'});if(p!=='granted')p=await handle.requestPermission({mode:'readwrite'});if(p!=='granted')throw new Error('permission')}const w=await handle.createWritable();await w.write(blob);await w.close()}
async function backupData(){const blob=backupBlob(),safe=(getProfileName()||'profile').replace(/[^a-z0-9_-]+/gi,'-').toLowerCase(),filename='spend-tracker-'+safe+'-backup.json';let h=await getBackupHandle();if(h){try{await writeHandle(h,blob);alert('Backup updated.');return}catch(e){await clearBackupHandle()}}try{if(window.showSaveFilePicker){h=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'Spend Tracker backup',accept:{'application/json':['.json']}}]});await writeHandle(h,blob);await setBackupHandle(h);alert('Backup saved. Future backups will update this same file.');return}}catch(e){if(e?.name==='AbortError')return}
if(navigator.share&&typeof File!=='undefined'){try{await navigator.share({title:'Spend Tracker backup',text:'Spend Tracker backup file',files:[new File([blob],filename,{type:'application/json'})]});return}catch(e){if(e?.name==='AbortError')return}}
const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);alert('Backup file created. Use Share to send it to Drive.')}
function exportData(){backupData()}
function readBackup(callback){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{const f=i.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result),x=raw?.data||raw;if(!x?.money||!x?.wealth)throw new Error('shape');callback(x,raw)}catch(e){alert('Invalid Spend Tracker backup file.')}};r.readAsText(f)};i.click()}
function importData(){readBackup((x,raw)=>{if(!confirm('Restore this backup and replace the current Money + Wealth data?'))return;state=x;if(raw?.profile){const pn=typeof raw.profile==='object'?raw.profile.name:raw.profile;const pe=typeof raw.profile==='object'?(raw.profile.email||''):'';if(pn)localStorage.setItem(PROFILE_KEY+'_name',String(pn));if(pe)localStorage.setItem(PROFILE_KEY+'_email',String(pe))}state.money??={tx:[],cats:[],incomeCats:[],methods:[],incomeAccounts:[],budgets:{overall:0,categories:{}}};state.money.budgets??={overall:0,categories:{}};state.wealth??={debts:[],assets:[],mfs:[],fds:[],stocks:[],loans:[],epfo:{balance:0,contribution:0,date:today()},history:[],milestones:[]};state.themeMode??='manual';state.textScale??='normal';save();refresh();alert('Backup restored successfully.')})}
function mergeById(current,incoming){const out=[...(current||[])],index=new Map(out.map((x,i)=>[x.id,i]));for(const x of (incoming||[])){if(x?.id&&index.has(x.id))out[index.get(x.id)]=x;else out.push(x)}return out}
function mergeByName(current,incoming){const out=[...(current||[])],index=new Map(out.map((x,i)=>[String(x.name||'').toLowerCase(),i]));for(const x of (incoming||[])){const k=String(x.name||'').toLowerCase();if(k&&index.has(k))out[index.get(k)]={...out[index.get(k)],...x};else out.push(x)}return out}
function mergeHistory(current,incoming){const out=[...(current||[])],seen=new Set(out.map(x=>`${x.date}|${x.net}|${x.assets}|${x.liabilities}`));for(const x of (incoming||[])){const k=`${x.date}|${x.net}|${x.assets}|${x.liabilities}`;if(!seen.has(k)){out.push(x);seen.add(k)}}return out}
function mergeData(){readBackup((x,raw)=>{if(!confirm('Merge this backup into the current data? Existing records stay unless the same ID is present.'))return;state.money.tx=mergeById(state.money.tx,x.money.tx);state.money.cats=mergeByName(state.money.cats,x.money.cats);state.money.incomeCats=mergeByName(state.money.incomeCats,x.money.incomeCats);state.money.methods=mergeByName(state.money.methods,x.money.methods);state.money.incomeAccounts=mergeByName(state.money.incomeAccounts,x.money.incomeAccounts);state.money.budgets.categories={...(state.money.budgets.categories||{}),...(x.money.budgets?.categories||{})};if(Number(x.money.budgets?.overall||0)>Number(state.money.budgets?.overall||0))state.money.budgets.overall=x.money.budgets.overall;state.wealth.debts=mergeById(state.wealth.debts,x.wealth.debts);state.wealth.assets=mergeById(state.wealth.assets,x.wealth.assets);state.wealth.mfs=mergeById(state.wealth.mfs,x.wealth.mfs);state.wealth.fds=mergeById(state.wealth.fds,x.wealth.fds);state.wealth.stocks=mergeById(state.wealth.stocks,x.wealth.stocks);state.wealth.loans=mergeById(state.wealth.loans,x.wealth.loans);state.wealth.milestones=mergeById(state.wealth.milestones,x.wealth.milestones);state.wealth.history=mergeHistory(state.wealth.history,x.wealth.history);if(raw?.profile&&!localStorage.getItem(PROFILE_KEY+'_name')){const pn=typeof raw.profile==='object'?raw.profile.name:raw.profile,pe=typeof raw.profile==='object'?(raw.profile.email||''):'';if(pn)localStorage.setItem(PROFILE_KEY+'_name',String(pn));if(pe)localStorage.setItem(PROFILE_KEY+'_email',String(pe))}if(x.wealth.epfo&&(x.wealth.epfo.balance||x.wealth.epfo.contribution))state.wealth.epfo=x.wealth.epfo;if(x.dark!==undefined)state.dark=x.dark;if(x.themeMode)state.themeMode=x.themeMode;if(x.textScale)state.textScale=x.textScale;save();refresh();alert('Backup merged successfully.')})}
function exportCSV(){const rows=[['Date','Type','Description/Person','Category/Occasion','Payment Method','Income Account','Amount'],...state.money.tx.map(x=>[x.date,x.type,x.desc||x.person,x.cat||x.occasion,x.method,x.account,x.amount])],b=new Blob([rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='spend-tracker-money.csv';document.body.appendChild(a);a.click();a.remove()}

snapshotWorth();refresh();

let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('installApp')?.classList.add('show')});
async function installPwa(){if(!deferredInstallPrompt){alert('Install is available when this app is opened from HTTPS or localhost.');return}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('installApp')?.classList.remove('show')}
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
if(state.themeMode==='auto'&&window.matchMedia){const mq=window.matchMedia('(prefers-color-scheme: dark)');const apply=()=>{state.dark=mq.matches;renderTheme()};mq.addEventListener?.('change',apply)}



/* V19.03 Personal Edition: global adaptive personality layer */
(function(){
const PERSONAL_KEY='spend_tracker_personalization_v1';
const PHOTO_KEY='spend_tracker_profile_photo_v1';
const lib={
 funny:[
  'Wallet behaving today. Suspicious. 👀','Money went somewhere. Naturally, it refuses to explain. 😂','Financial chaos, now neatly documented.','Your wallet has entered the chat.','Numbers don’t judge. They merely expose.','Another day, another tiny attack on the bank balance.','At least the app knows where the money went.','Budget: a polite suggestion you occasionally ignore.','Your future self requested fewer plot twists.','Spending detected. Humanity continues.','Money is temporary. Screenshots are forever.','That purchase looked smaller in your head, didn’t it?','Your wallet would like a quiet weekend.','Responsible today. Let’s not get carried away.','The numbers are numbering.','Financial detective mode: activated. 🕵️','Your bank account has entered character development.','₹ here, ₹ there, and suddenly we have a documentary.','You tracked it. That already makes it official.','The budget has seen things.','A little discipline, a little chaos. Balanced.','Your money has better attendance than most meetings.','Spending report: brutally honest, as requested.','Nothing to see here. Except the transactions.','Money does not disappear. It relocates aggressively.','Today’s financial plot thickens.','The wallet survives another episode.','At least the math is honest.','Your expenses are developing lore.','Another receipt for the museum. 😂'
 ],
 money:[
  'Money mode: let’s keep the chaos measurable.','Every rupee gets a job. Even the suspicious ones.','Your spending story, minus the dramatic music.','Small leaks sink budgets. Good thing we have receipts.','Track first. Panic later.','The goal is clarity, not financial perfection.','A clean ledger is a beautiful thing.','Today’s numbers are ready for inspection.','Your money deserves better records.','One transaction at a time.','Less guessing. More knowing.','Money looks calmer when it is organised.','The dashboard is awake.','Receipts in. Excuses out.','Financial housekeeping, but make it useful.'
 ],
 wealth:[
  'Future-you is quietly taking notes. 📈','Slowly building the empire.','Wealth is boring until it compounds.','Net worth: the long game scoreboard.','Let the assets do some of the heavy lifting.','Future-you likes boring consistency.','Compounding is basically patience with receipts.','A little more today, a little more later.','Wealth mode: fewer fireworks, more foundations.','Your future balance sheet is watching.','Build. Track. Repeat.','The long game has entered the chat.','Assets up, excuses down.','Quiet progress is still progress.','Good wealth habits rarely make exciting headlines. That is the point.'
 ],
 facts:[
  'Tiny fact: compound growth rewards time more than drama. 🧠','Tiny fact: tracking spending makes invisible habits visible.','Tiny fact: a budget is a plan, not a punishment.','Tiny fact: liquidity matters even when returns look pretty.','Tiny fact: net worth is a snapshot, not a personality test.','Tiny fact: consistency usually beats heroic bursts of effort.','Tiny fact: diversification reduces dependence on one asset.','Tiny fact: knowing your cash flow is financial superpower territory.'
 ],
 morning:[
  'Morning, Abhishek. Let’s keep the rupees behaved. ☀️','New day. Same wallet. Better decisions.','Good morning. Your money has survived the night.','Morning check: future-you approves of boring discipline.','Coffee first. Financial chaos second. ☕'
 ],
 evening:[
  'Evening report: what happened to the money today? 🌙','Day nearly done. Time to inspect the financial evidence.','Good evening. The wallet has submitted its report.','Today is almost over. The numbers are not.','End-of-day audit, minus the courtroom drama.'
 ],
 event:[
  'Milestone unlocked. Future-you just got a little happier. 🎉','That deserves a tiny victory lap.','Progress detected. Do not become unbearable about it. 😂','A financial win is still a win.','The graph has something nice to say for once.','That number moved in the right direction. Keep it boring.','Achievement logged. Carry on, responsible human.'
 ]
};
function ensurePersonal(){state.personalization??={enabled:true,funny:true,facts:true,recent:[],lastMessage:'',lastAt:0};state.personalization.recent??=[];return state.personalization}
function ctx(){const now=new Date(),h=now.getHours(),m=state.money?.tx||[],w=state.wealth||{},spent=m.filter(x=>x.type==='expense').reduce((a,x)=>a+Number(x.amount||0),0),inc=m.filter(x=>x.type==='income').reduce((a,x)=>a+Number(x.amount||0),0),wc=typeof wealthCalc==='function'?wealthCalc():{net:0};return {hour:h,mode:app.mode,screen:app.mode==='money'?app.moneyPage:app.wealthPage,spent,inc,net:Number(wc.net||0),tx:m.length,goals:w.milestones?.length||0};}
function candidates(c){const p=ensurePersonal(),base=[];if(c.mode==='wealth')base.push(...lib.wealth);else base.push(...lib.money);if(c.hour<11)base.push(...lib.morning);if(c.hour>=18)base.push(...lib.evening);if(p.funny)base.push(...lib.funny);if(p.facts)base.push(...lib.facts);if(c.goals)base.push(...lib.event);return base;}
function pick(){const p=ensurePersonal();if(!p.enabled)return '';const c=ctx(),arr=candidates(c),recent=new Set(p.recent||[]),fresh=arr.filter(x=>!recent.has(x));let pool=fresh.length?fresh:arr;let msg=pool[Math.floor(Math.random()*pool.length)]||'Your money. Your rules.';p.recent=[...(p.recent||[]).filter(x=>x!==msg),msg].slice(-18);p.lastMessage=msg;p.lastAt=Date.now();return msg;}
function applyMessage(force=false){const p=ensurePersonal();if(!p.enabled){document.querySelectorAll('.global-message,.surprise-preview').forEach(e=>e.textContent='');return ''}if(!force&&p.lastMessage)return p.lastMessage;return pick();}
let lastHeaderContext='',lastDataFingerprint='';function header(force=false){const c=ctx(),name=getProfileName()||'Abhishek',title=document.getElementById('appTitle'),sub=document.getElementById('appSubtitle');if(!title||!sub)return;const key=`${c.mode}:${c.screen}`,fp=`${key}|${c.spent}|${c.inc}|${c.net}|${c.tx}|${c.goals}`;if(force||key!==lastHeaderContext||fp!==lastDataFingerprint){lastHeaderContext=key;lastDataFingerprint=fp;pick()}const moneyTitles=[`${name}'s Money 💸`,`Money HQ 💰`,`${name}'s Wallet HQ 🧾`],wealthTitles=[`${name}'s Wealth 📈`,`Future-You Fund 📊`,`${name}'s Wealth Desk 🧠`],titles=c.mode==='wealth'?wealthTitles:moneyTitles;title.textContent=titles[Math.floor(Math.random()*titles.length)];sub.textContent=c.mode==='wealth'?(c.net>0?'Building the long game. Quietly.':'Let’s build the first brick. 🧱'):(c.spent>0?'Keeping the money mess measurable. 😌':'Ready when the first rupee moves. 👀');document.getElementById('globalMessage').textContent=ensurePersonal().enabled?ensurePersonal().lastMessage:'';const more=document.getElementById('moreMessage');if(more)more.textContent=c.mode==='wealth'?'Your wealth corner. 📈':'Your financial command center. 🎛️';const wp=document.getElementById('wealthMoreMessage');if(wp)wp.textContent=c.mode==='wealth'?'Your wealth corner. 📈':'Your financial command center. 🎛️';const id=document.getElementById('identitySub');if(id)id.textContent=c.mode==='wealth'?'Building future-you money. 🧠':'Your tracker. Your rules. ✨';const sp=document.getElementById('surprisePreview');if(sp&&!sp.textContent.trim())sp.textContent='🎲 Tap for something unexpected.';const wsp=document.getElementById('wealthSurprisePreview');if(wsp&&!wsp.textContent.trim())wsp.textContent='🎲 Tap for something unexpected.';}
window.showSurpriseMessage=function(){const msg=pick();['globalMessage','surprisePreview','wealthSurprisePreview'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=msg});};
window.setPersonalization=function(k,v){const p=ensurePersonal();p[k]=!!v;save();renderMore();header();};
window.openSettingsPanel=function(){const details=document.querySelector('#mmore details')||document.querySelector('#wmore details');if(details){details.open=true;details.scrollIntoView({behavior:'smooth',block:'center'})}};
window.triggerProfilePhoto=function(){const i=document.getElementById('profilePhotoInput')||document.getElementById('wealthProfilePhotoInput');i?.click()};
window.setProfilePhoto=function(input){const f=input?.files?.[0];if(!f)return;if(!f.type.startsWith('image/'))return alert('Choose an image.');const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const max=512,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);localStorage.setItem(PHOTO_KEY,c.toDataURL('image/jpeg',.86));renderProfile();renderMore()};img.src=r.result};r.readAsDataURL(f)};
window.removeProfilePhoto=function(){localStorage.removeItem(PHOTO_KEY);renderProfile();renderMore()};
window.renderProfile=function(){const name=getProfileName(),email=getProfileEmail(),photo=localStorage.getItem(PHOTO_KEY);['profileNameInput','wealthProfileNameInput'].forEach(id=>{const e=$(id);if(e)e.value=name==='Default'?'':name});['profileEmailInput','wealthProfileEmailInput'].forEach(id=>{const e=$(id);if(e)e.value=email});['profileNameLabel','wealthProfileNameLabel'].forEach(id=>{const e=$(id);if(e)e.textContent=name});['profileAvatar','wealthProfileAvatar'].forEach(id=>{const e=$(id);if(e){e.innerHTML='';if(photo){e.style.backgroundImage=`url(${photo})`;e.style.backgroundSize='cover';e.style.backgroundPosition='center'}else{e.style.backgroundImage='';e.textContent=profileInitials(name)}}})};
window.saveProfile=function(){const n=(document.getElementById('profileNameInput')?.value||document.getElementById('wealthProfileNameInput')?.value||'').trim(),e=(document.getElementById('profileEmailInput')?.value||document.getElementById('wealthProfileEmailInput')?.value||'').trim();if(!n)return alert('Enter your name.');if(e&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e))return alert('Enter a valid email address.');localStorage.setItem(PROFILE_KEY+'_name',n);localStorage.setItem(PROFILE_KEY+'_email',e);renderProfile();renderMore();header()};
window.renderMore=function(){renderProfile();const p=ensurePersonal();['personalEnabled','wealthPersonalEnabled'].forEach(id=>{const e=document.getElementById(id);if(e)e.checked=p.enabled!==false});['personalFunny','wealthPersonalFunny'].forEach(id=>{const e=document.getElementById(id);if(e)e.checked=p.funny!==false});['personalFacts','wealthPersonalFacts'].forEach(id=>{const e=document.getElementById(id);if(e)e.checked=p.facts!==false});const cm=document.getElementById('mCatsManage');if(cm)cm.innerHTML=state.money.cats.map(c=>`<div class="manage-row"><b>${esc(c.icon+' '+c.name)}</b><span></span><button class="mini" onclick="openCategory('${c.id}')">Edit</button><button class="mini danger" onclick="deleteCategory('${c.id}')">Delete</button></div>`).join('')||'<div class="empty">No categories.</div>';const mm=document.getElementById('mMethodsManage');if(mm)mm.innerHTML=state.money.methods.map(m=>`<div class="manage-row"><b>💳 ${esc(m.name)}</b><span>${esc(m.type)}</span><button class="mini" onclick="openMethod('${m.id}')">Edit</button><button class="mini danger" onclick="deleteMethod('${m.id}')">Delete</button></div>`).join('')||'<div class="empty">No payment methods.</div>';const im=document.getElementById('mIncomeManage');if(im)im.innerHTML=state.money.incomeAccounts.map(a=>`<div class="manage-row"><b>🏦 ${esc(a.name)}</b><span></span><button class="mini" onclick="openIncomeAccount('${a.id}')">Edit</button><button class="mini danger" onclick="deleteIncomeAccount('${a.id}')">Delete</button></div>`).join('')||'<div class="empty">No income accounts.</div>';};
window.backupPayload=function(){return {format:'Spend Tracker Backup',version:'19.02',schema:'spend-tracker-v20',exportedAt:new Date().toISOString(),profile:{name:getProfileName(),email:getProfileEmail(),photo:(getProfile().photo||localStorage.getItem(PHOTO_KEY)||'')},personalization:ensurePersonal(),data:state}};
const oldRefresh=window.refresh;window.refresh=function(){oldRefresh();header()};
const oldSwitch=window.switchApp;window.switchApp=function(mode){oldSwitch(mode);header()};
const oldNavigate=window.navigate;window.navigate=function(section){oldNavigate(section);header()};
const oldOpenMore=window.openMore;window.openMore=function(){oldOpenMore();header()};
window.importData=function(){readBackup((x,raw)=>{if(!confirm('Restore this backup and replace the current Money + Wealth data?'))return;state=x;state.money??={tx:[],cats:[],incomeCats:[],methods:[],incomeAccounts:[],budgets:{overall:0,categories:{}}};state.money.budgets??={overall:0,categories:{}};state.wealth??={debts:[],assets:[],mfs:[],fds:[],stocks:[],loans:[],epfo:{balance:0,contribution:0,date:today()},history:[],milestones:[]};state.wealth.epfo??={balance:0,contribution:0,date:today()};state.wealth.history??=[];state.wealth.milestones??=[];state.themeMode??='manual';state.textScale??='normal';if(raw?.profile){const pn=typeof raw.profile==='object'?raw.profile.name:raw.profile;const pe=typeof raw.profile==='object'?(raw.profile.email||''):'';if(pn)localStorage.setItem(PROFILE_KEY+'_name',String(pn));if(pe)localStorage.setItem(PROFILE_KEY+'_email',String(pe));if(typeof raw.profile==='object'&&raw.profile.photo)localStorage.setItem(PHOTO_KEY,raw.profile.photo)}if(raw?.personalization)state.personalization=raw.personalization;save();refresh();alert('Backup restored successfully.')})};
window.resetProfile=function(){if(!confirm('Delete all current Money and Wealth data? This cannot be undone from the app.'))return;localStorage.removeItem(KEY);localStorage.removeItem(PROFILE_KEY+'_name');localStorage.removeItem(PROFILE_KEY+'_email');localStorage.removeItem(PHOTO_KEY);location.reload()};
function init(){ensurePersonal();renderProfile();renderMore();header(true);setInterval(()=>{if(document.visibilityState==='visible')showSurpriseMessage()},45000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')header(true)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();



(function(){
  const $v=id=>document.getElementById(id);
  function setupOverhaul(){
    // Move all configuration controls behind the single Settings button.
    const source=document.querySelector('#mmore > .settings-list-card');
    const oldWealth=document.querySelector('#wmore > .settings-list-card');
    if(oldWealth) oldWealth.remove();
    if(source && !$v('settingsPanel')){
      const panel=document.createElement('div');
      panel.id='settingsPanel'; panel.className='settings-panel';
      panel.innerHTML=`<div class="sheet"><div class="handle"></div><div class="sheet-head"><div><h2>Settings</h2><div class="small">Set it once. Get back to tracking.</div></div><button class="close" onclick="closeSettingsPanel()">✕</button></div></div>`;
      document.body.appendChild(panel);
      panel.querySelector('.sheet').appendChild(source);
      const card=panel.querySelector('.settings-list-card');
      const personal=card?.querySelector('details:has(#personalEnabled)');
      const wealth=document.createElement('details');
      wealth.className='wealth-setup';
      wealth.innerHTML=`<summary>📈 Wealth setup</summary><div class="settings-body"><div class="quick-setting"><div><b>Net worth</b><span>Assets, liabilities and allocation</span></div><button class="secondary" onclick="closeSettingsPanel();openWealthPage('networth')">Open</button></div><div class="quick-setting"><div><b>Investments</b><span>MFs, FDs and Stocks / ETFs</span></div><button class="secondary" onclick="closeSettingsPanel();openWealthPage('investments')">Open</button></div><div class="quick-setting"><div><b>Money owed</b><span>Lent and borrowed money</span></div><button class="secondary" onclick="closeSettingsPanel();openWealthPage('debts')">Open</button></div><div class="quick-setting"><div><b>Milestones</b><span>Track future goals</span></div><button class="secondary" onclick="closeSettingsPanel();openWealthPage('more')">Open</button></div></div>`;
      if(card){
        const first=card.querySelector('details');
        first?.before(wealth);
      }
    }
    // More stays clean: identity + Brain Food only. Settings controls are now in the panel.
    document.querySelectorAll('#mmore > .settings-list-card,#wmore > .settings-list-card').forEach(e=>e.remove());
    // Add a real Brain Food panel once.
    if(!$v('brainFoodPanel')){
      const p=document.createElement('div'); p.id='brainFoodPanel'; p.className='modal brain-food-panel';
      p.innerHTML=`<div class="sheet"><div class="handle"></div><div class="sheet-head"><div><h2>🎲 Brain Food</h2><div class="small">Random wisdom, finance facts and nonsense.</div></div><button class="close" onclick="closeBrainFood()">✕</button></div><div class="brain-card"><div id="brainFoodIcon" class="brain-icon">🧠</div><div id="brainFoodText" class="brain-text">Something worth reading</div><div id="brainFoodTag" class="brain-tag">BRAIN FOOD</div></div><button class="primary full" style="margin-top:14px" onclick="showSurpriseMessage()">🎲 Give me another</button></div>`;
      document.body.appendChild(p);
    }
  }
  window.openSettingsPanel=function(){setupOverhaul();$v('settingsPanel')?.classList.add('show')};
  window.closeSettingsPanel=function(){$v('settingsPanel')?.classList.remove('show')};
  window.closeBrainFood=function(){$v('brainFoodPanel')?.classList.remove('show')};
  const oldShow=window.showSurpriseMessage;
  window.showSurpriseMessage=function(){
    const msg=typeof pick==='function'?pick():'';
    const text=msg||'Your money deserves a little attention today.';
    ['globalMessage','surprisePreview','wealthSurprisePreview'].forEach(id=>{const e=$v(id);if(e)e.textContent=text});
    const bf=$v('brainFoodText'); if(bf)bf.textContent=text;
    const tag=$v('brainFoodTag'); if(tag)tag.textContent=(typeof ctx==='function'&&ctx().mode==='wealth')?'WEALTH BRAIN FOOD':'MONEY BRAIN FOOD';
    $v('brainFoodPanel')?.classList.add('show');
  };
  // Keep the profile as one shared source, including photo restoration from backups.
  const oldRenderProfile=window.renderProfile;
  window.renderProfile=function(){if(oldRenderProfile)oldRenderProfile();const photo=localStorage.getItem(typeof PHOTO_KEY!=='undefined'?PHOTO_KEY:'spend_tracker_profile_photo');document.querySelectorAll('.profile-avatar').forEach(e=>{if(photo){e.style.backgroundImage=`url(${photo})`;e.style.backgroundSize='cover';e.style.backgroundPosition='center';e.textContent=''} });};
  // Upgrade the More teaser whenever the app refreshes, without making it noisy.
  const oldHeader=window.header;
  window.header=function(force){if(oldHeader)oldHeader(force);const p=typeof ensurePersonal==='function'?ensurePersonal():null;const msg=p?.lastMessage;if(msg){['surprisePreview','wealthSurprisePreview'].forEach(id=>{const e=$v(id);if(e)e.textContent=msg})} };
  // Fix backup restore so profile photo is truly part of the shared profile.
  const oldImport=window.importData;
  window.importData=function(){
    const input=document.createElement('input'); input.type='file'; input.accept='.json,application/json';
    input.onchange=()=>{const f=input.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result),x=raw?.data||raw;if(!x?.money||!x?.wealth)throw new Error('shape');if(!confirm('Restore this backup and replace the current Money + Wealth data?'))return;state=x;if(raw?.profile){const pn=typeof raw.profile==='object'?raw.profile.name:raw.profile;const pe=typeof raw.profile==='object'?(raw.profile.email||''):'';const ph=typeof raw.profile==='object'?(raw.profile.photo||''):'';if(pn)localStorage.setItem(PROFILE_KEY+'_name',String(pn));if(pe)localStorage.setItem(PROFILE_KEY+'_email',String(pe));if(ph)localStorage.setItem(PHOTO_KEY,String(ph));}save();refresh();renderProfile();header(true);alert('Backup restored successfully.')}catch(e){alert('Invalid Spend Tracker backup file.')}};r.readAsText(f)}; input.click();
  };
  // Re-run setup after the initial app render.
  setupOverhaul();
})();



(function(){
  const V20_KEY='spend_tracker_v20_arch';
  const $=id=>document.getElementById(id);
  const safe=(fn, fallback)=>{try{return fn()}catch(e){return fallback}};

  /* ---------- One source of truth for profile ---------- */
  const profileKey={name:'spend_tracker_profile_name',email:'spend_tracker_profile_email',photo:'spend_tracker_profile_photo'};
  function getProfile(){
    return {name:localStorage.getItem(profileKey.name)||'Abhishek',email:localStorage.getItem(profileKey.email)||'',photo:localStorage.getItem(profileKey.photo)||localStorage.getItem(typeof PHOTO_KEY!=='undefined'?PHOTO_KEY:'spend_tracker_profile_photo_v1')||''};
  }
  window.V20Profile={
    get:getProfile,
    set(p){
      p=p||{};
      if(p.name!=null)localStorage.setItem(profileKey.name,String(p.name).trim()||'Abhishek');
      if(p.email!=null)localStorage.setItem(profileKey.email,String(p.email).trim());
      if(p.photo!=null){const v=String(p.photo||'');if(v){localStorage.setItem(profileKey.photo,v);try{localStorage.setItem(PHOTO_KEY,v)}catch(e){}}else{localStorage.removeItem(profileKey.photo);try{localStorage.removeItem(PHOTO_KEY)}catch(e){}}}
      syncProfileUI();
      safe(()=>header(true));
    }
  };
  function applyAvatar(el,p){
    if(!el)return;
    if(p.photo){el.style.backgroundImage=`url(${p.photo})`;el.style.backgroundSize='cover';el.style.backgroundPosition='center';el.textContent='';}
    else{el.style.backgroundImage='';el.textContent=(p.name||'A').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'A';}
  }
  function syncProfileUI(){
    const p=getProfile();
    document.querySelectorAll('.profile-avatar').forEach(e=>applyAvatar(e,p)); document.querySelectorAll('[data-v20-shared-avatar]').forEach(e=>applyAvatar(e,p));
    ['profileNameLabel','wealthProfileNameLabel'].forEach(id=>{const e=$(id);if(e)e.textContent=p.name});
    ['profileNameInput','wealthProfileNameInput'].forEach(id=>{const e=$(id);if(e&&document.activeElement!==e)e.value=p.name});
    ['profileEmailInput','wealthProfileEmailInput'].forEach(id=>{const e=$(id);if(e&&document.activeElement!==e)e.value=p.email});
    document.querySelectorAll('[data-v20-profile-name]').forEach(e=>e.textContent=p.name);
  }
  window.syncProfileUI=syncProfileUI;

  /* ---------- Root theme ---------- */
  function syncTheme(){
    const dark=!!state?.dark;
    document.documentElement.style.setProperty('color-scheme',dark?'dark':'light');
    document.body.classList.toggle('dark',dark);
    const themeBtn=$('themeBtn');
    if(themeBtn)themeBtn.textContent=dark?'☀':'☾';
  }
  window.V20Theme={sync:syncTheme};

  /* ---------- Global personalization engine ---------- */
  const library={
    money:[
      'Money is behaving today. Suspicious. 👀','Your wallet has entered the chat. 💸','Numbers first. Excuses later. 😌','Tracking money: cheaper than therapy. 😂','Every rupee now has a witness.','Small spends add up. Annoying, but true.','Your future self is keeping receipts. 🧾','Money moved. At least we know where.','Financial chaos, but organised. ✨','The wallet report has arrived.','Your bank balance requested adult supervision. 😭','One tap closer to knowing where it all went.','Spending visible. Panic optional.','Today’s numbers look less mysterious already.','Your money deserves better records.','A rupee tracked is a rupee understood.','Budgeting: telling money where to go before it runs away.','Good records beat good guesses.','Your wallet would like some boundaries. 😂','No judgement. Just numbers. Mostly.','Money in, money out, story documented.','The spreadsheet spirit approves. 🧠','Your spending has receipts now.','Tiny expenses are tiny until they form a committee.','Less guessing. More knowing.','Your money mess is measurable.','The numbers are innocent. Probably.','Keep tracking. Future Abhishek is watching. 👀','Another day, another financial plot twist.','At least the chaos has timestamps. 😂'
    ],
    wealth:[
      'Slowly building the boring kind of rich. 📈','Future-you appreciates this screen.','Assets are doing some of the talking now.','Net worth grows one record at a time.','Quiet progress still counts.','Your money is finally wearing a long-term hat. 🎩','FDs, funds, stocks. A small financial squad.','Wealth is patience with better spreadsheets.','Compounding likes consistency.','Future Abhishek is taking notes. 👀','The portfolio report has entered the room.','Build first. Flex later. 😌','A little allocation beats a lot of confusion.','Long-term thinking looks good here.','Your assets have responsibilities now. 😂','Net worth: the scoreboard nobody sees until they do.','Diversification: because one idea should not run the whole show.','Good wealth tracking is gloriously boring.','Investing is patience with paperwork.','Your future balance sheet says thanks.','Money sleeping? Not all of it. 📊','Build quietly. Let the numbers make noise.','The empire is small. The spreadsheet is ambitious. 😂','One more record for future-you.','A clean wealth ledger beats a heroic memory.'
    ],
    action:[
      'Saved. Future-you has the receipt. ✅','Locked in. The numbers now have paperwork.','Done. Tiny admin victory. 🏆','Recorded. No archaeology required later.','Saved successfully. Your wallet may relax now.','Noted. The chaos is officially documented.','Added. Another financial breadcrumb.','Updated. The numbers got the memo.','Done. Very responsible of you. 😌','Saved. This is what organised chaos looks like.'
    ],
    backup:[
      'Backup done. Future-you says thanks. ☁️','Your data now has an escape plan.','Backup saved. Disaster has been mildly inconvenienced. 😂','One backup closer to sleeping peacefully.','Future Abhishek just got a favour.','Data packed. Ready for the next phone.'
    ],
    empty:[
      'Nothing here yet. Peaceful. Suspicious. 🫠','A rare moment when your wallet is quiet.','No records yet. The spreadsheet is judging nobody.','Blank slate. Dangerous amount of optimism. 😂'
    ],
    budget:[
      'Budget mode: give every rupee a job.','Numbers do not negotiate. Budgets try. 😂','A limit is just a plan wearing a seatbelt.','Your budget has entered the building.','Spend smart. The app is keeping receipts. 👀'
    ],
    analytics:[
      'Numbers do not lie. They merely expose our decisions.','Here lies the evidence. 🧾','Charts: because tables needed better lighting.','Your spending has a storyline. We are reading it.'
    ],
    transactions:[
      'Recent financial events, neatly documented.','The receipt museum is open. 🧾','Every transaction tells a tiny story.','Money moved. Here is the paper trail.'
    ],
    more:[
      'Your money deserves a little attention today.','Welcome to the control room. 🚀','Settings are hiding because you only need them sometimes.','A clean tracker for a messy world.','One place for the money mess. 😅','Numbers behaving themselves for once. 🎲'
    ]
  };
  const recently=[];
  function choose(arr){
    if(!arr?.length)return '';
    const options=arr.filter(x=>!recently.slice(-5).includes(x));
    const pick=(options.length?options:arr)[Math.floor(Math.random()*(options.length?options.length:arr.length))];
    recently.push(pick);if(recently.length>12)recently.shift();
    return pick;
  }
  function currentContext(){
    const mode=app?.mode||'money';
    const page=mode==='wealth'?(app?.wealthPage||'home'):(app?.moneyPage||'home');
    let bucket=mode==='wealth'?'wealth':page;
    if(page==='more')bucket='more';
    if(['transactions','analytics','budgets'].includes(page))bucket=page;
    const tx=state?.money?.tx||[];
    const today=(typeof window.today==='function'?today():new Date().toISOString().slice(0,10));
    const todays=tx.filter(t=>t.date===today);
    const spend=todays.filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount||0),0);
    return {mode,page,bucket,spendToday:spend,txCount:tx.length,name:getProfile().name};
  }
  function contextMessage(kind){
    if(kind==='action')return choose(library.action);
    if(kind==='backup')return choose(library.backup);
    const c=currentContext();
    if(kind==='empty')return choose(library.empty);
    if(c.bucket==='more')return choose(library.more);
    if(c.bucket==='transactions')return choose(library.transactions);
    if(c.bucket==='analytics')return choose(library.analytics);
    if(c.bucket==='budgets')return choose(library.budget);
    return choose(library[c.mode]||library.money);
  }
  window.PersonalizationEngine={message:contextMessage,context:currentContext,library};

  function refreshHeaderText(){
    const p=getProfile(), c=currentContext();
    const brandH=document.querySelector('.brand h1'), brandP=document.querySelector('.brand p');
    if(brandH){brandH.textContent=c.mode==='wealth' ? `${p.name}'s Wealth 📈` : `${p.name}'s Money 💸`;}
    if(brandP){brandP.textContent=c.mode==='wealth' ? 'Building future-you money, one record at a time.' : 'Keeping the money mess measurable. 😌';}
    document.querySelectorAll('[data-v20-global-message]').forEach(e=>e.textContent=contextMessage());
  }
  window.refreshHeaderText=refreshHeaderText;

  /* ---------- Clean More page ---------- */
  function rewriteMore(sectionId,wealth=false){
    const root=$(sectionId); if(!root)return;
    // Keep More intentionally small. Remove all legacy/previously generated children.
    root.innerHTML='';
    const p=getProfile(), name=esc(p.name||'Abhishek');
    const msg=esc(contextMessage());
    root.insertAdjacentHTML('beforeend',`<div class="v20-more-wrap" id="v20MoreWrap-${wealth?'w':'m'}">
      <div class="v20-more-intro"><div><h2 style="margin:0">More</h2><div class="small">${wealth?'The wealth control room. 📈':'The money control room. 💸'}</div></div><div style="font-size:18px;font-weight:900">${wealth?'📊':'🧩'}</div></div>
      <div class="card"><div class="v20-profile-row"><div class="profile-avatar large" data-v20-shared-avatar="true"></div><div><div style="font-size:20px;font-weight:900" data-v20-profile-name>${name}</div><div class="small">${wealth?'Building future-you money.':'Your tracker. Your rules. ✨'}</div></div></div><button class="v20-settings-btn" style="margin-top:15px" onclick="openSettingsPanel()">⚙️ Settings</button></div>
      <div class="v20-brain-teaser" onclick="openBrainFood()"><div class="teaser-copy"><b>🧠 Today’s thought</b><p id="v20BrainTeaser-${wealth?'w':'m'}">${msg}</p></div><button type="button" class="v20-brain-dice" onclick="event.stopPropagation();openBrainFood();" aria-label="Open Brain Food">🎲</button></div>
      <div class="card"><div class="more-card-head"><b>Quick links</b><span>${wealth?'Wealth':'Daily use'}</span></div><div class="more-grid" style="margin-top:10px">${wealth?`<button class="more-action" onclick="openWealthPage('networth')">📈 Net worth<span>See the big picture</span></button><button class="more-action" onclick="openWealthPage('investments')">💼 Investments<span>FDs, funds, stocks</span></button>`:`<button class="more-action" onclick="openMoneyPage('transactions')">🧾 Transactions<span>See recent money</span></button><button class="more-action" onclick="openMoneyPage('budgets')">🎯 Budgets<span>Check your limits</span></button>`}</div></div>
    </div>`);
    syncProfileUI();
  }

  /* ---------- Settings panel: single layer, exclusive accordions ---------- */
  function buildSettings(){
    let panel=$('settingsPanel');
    // Preserve the original settings content once, even though the More page itself stays clean.
    if(!window.__v20SettingsTemplate){
      const existing=document.querySelector('#settingsPanel .settings-list-card')||document.querySelector('#mmore > .settings-list-card')||document.querySelector('#wmore > .settings-list-card');
      if(existing)window.__v20SettingsTemplate=existing.cloneNode(true);
    }
    if(!panel){
      panel=document.createElement('div');panel.id='settingsPanel';document.body.appendChild(panel);
    }
    panel.className='settings-panel v20-settings-root';
    panel.innerHTML=`<div class="sheet"><div class="handle"></div><div class="sheet-head"><div><h2>Settings</h2><div class="small">Set it once. Get back to tracking.</div></div><button class="close" onclick="closeSettingsPanel()">✕</button></div><div id="v20SettingsBody"></div></div>`;
    const body=$('v20SettingsBody');
    const old=document.querySelector('#mmore > .settings-list-card')||document.querySelector('.settings-list-card');
    const template=old||window.__v20SettingsTemplate;
    if(template){
      const node=(template===old?template:template.cloneNode(true));
      body.appendChild(node);node.style.display='block';window.__v20SettingsTemplate=node.cloneNode(true);
    }
    // Insert wealth setup if not already represented.
    if(!body.querySelector('.wealth-setup')){
      const d=document.createElement('details');d.className='wealth-setup';d.innerHTML=`<summary>📈 Wealth setup</summary><div class="settings-body"><div class="quick-setting"><div><b>Wealth records</b><span>FD, mutual funds, money owed, EPFO, loans, stocks/ETFs and other assets.</span></div><button class="secondary" onclick="closeSettingsPanel();openWealthPage('more')">Open</button></div><div class="quick-setting"><div><b>Milestones</b><span>Track targets and progress.</span></div><button class="secondary" onclick="closeSettingsPanel();openWealthPage('more')">Open</button></div></div>`;
      body.prepend(d);
    }
    // Clean copy of labels and turn old list into grouped settings.
    body.querySelectorAll('details').forEach(d=>{
      d.addEventListener('toggle',()=>{
        if(!d.open)return;
        body.querySelectorAll('details').forEach(o=>{if(o!==d)o.open=false;});
      });
    });
    panel.addEventListener('click',e=>{if(e.target===panel)closeSettingsPanel();});
  }
  window.openSettingsPanel=function(){buildSettings();$('settingsPanel')?.classList.add('show');};
  window.closeSettingsPanel=function(){$('settingsPanel')?.classList.remove('show');};

  /* ---------- Brain Food: one overlay ---------- */
  function buildBrain(){
    let p=$('brainFoodPanel');
    if(!p){
      p=document.createElement('div');p.id='brainFoodPanel';document.body.appendChild(p);
    }
    p.className='modal brain-food-panel v20-brain-root';
    p.innerHTML=`<div class="sheet"><div class="handle"></div><div class="sheet-head"><div><h2>🎲 Brain Food</h2><div class="small">A little wisdom. A little nonsense. No subscription.</div></div><button class="close" onclick="closeBrainFood()">✕</button></div><div class="brain-card"><div id="brainFoodIcon" class="brain-icon">🧠</div><div id="brainFoodText" class="brain-text">Something worth reading</div><div id="brainFoodTag" class="brain-tag">BRAIN FOOD</div></div><button class="primary full" style="margin-top:14px" onclick="showSurpriseMessage()">🎲 Give me another</button><div class="v20-brain-close-hint">Tap outside or scroll to close.</div></div>`;
    p.addEventListener('click',e=>{if(e.target===p)closeBrainFood()});
    p.querySelector('.sheet').addEventListener('click',e=>e.stopPropagation());
    p.querySelector('.sheet').addEventListener('touchstart',()=>{}, {passive:true});
  }
  window.openBrainFood=function(){
    buildBrain();
    window.__v20PreviewOpen=true;
    if($('settingsPanel')?.classList.contains('show'))closeSettingsPanel();
    $('brainFoodPanel')?.classList.add('show');
    showSurpriseMessage();
  };
  window.closeBrainFood=function(){window.__v20PreviewOpen=false;$('brainFoodPanel')?.classList.remove('show')};
  window.showSurpriseMessage=function(){
    const msg=contextMessage();
    const icon=currentContext().mode==='wealth'?'📈':'🧠';
    ['globalMessage','surprisePreview','wealthSurprisePreview','v20BrainTeaser-m','v20BrainTeaser-w'].forEach(id=>{const e=$(id);if(e)e.textContent=msg});
    const bf=$('brainFoodText');if(bf)bf.textContent=msg;
    const bi=$('brainFoodIcon');if(bi)bi.textContent=icon;
    const bt=$('brainFoodTag');if(bt)bt.textContent=currentContext().mode==='wealth'?'WEALTH BRAIN FOOD':'MONEY BRAIN FOOD';
    const active=currentContext().mode==='wealth'?'v20BrainTeaser-w':'v20BrainTeaser-m';if($(active))$(active).textContent=msg;
  };
  // close preview on scroll/back/outside
  window.addEventListener('scroll',()=>{if(window.__v20PreviewOpen)closeBrainFood()},{passive:true});
  window.addEventListener('popstate',()=>{closeBrainFood();closeSettingsPanel()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeBrainFood();closeSettingsPanel()}});

  /* ---------- Navigation: Home belongs to current mode ---------- */
  function patchNavigation(){
    const home=$('navHome'); if(home){home.onclick=()=>{goHome();return false};}
    const btns=[['navHome','home'],['navTx','transactions'],['navAnalytics','analytics'],['navBudget','budgets'],['navMore','more']];
    btns.forEach(([id,p])=>{
      const b=$(id);if(!b)return;
      b.classList.remove('selected','money-selected','wealth-selected');
      const active=app.mode==='wealth'?app.wealthPage===p:app.moneyPage===p;
      if(active)b.classList.add(app.mode==='wealth'?'wealth-selected':'money-selected','selected');
    });
  }
  window.V20Navigation={sync:patchNavigation};

  /* ---------- Hook refresh without creating recursive refresh loops ---------- */
  const originalRefresh=window.refresh;
  window.refresh=function(){
    originalRefresh();
    safe(syncTheme);
    safe(syncProfileUI);
    safe(refreshHeaderText);
    safe(patchNavigation);
    safe(()=>rewriteMore('mmore',false));
    safe(()=>rewriteMore('wmore',true));
  };

  // Patch profile save/restore to always sync globally.
  const originalSaveProfile=window.saveProfile;
  window.saveProfile=function(){
    if(originalSaveProfile)originalSaveProfile();
    const n=($('profileNameInput')?.value||$('wealthProfileNameInput')?.value||getProfile().name).trim();
    const e=($('profileEmailInput')?.value||$('wealthProfileEmailInput')?.value||getProfile().email).trim();
    V20Profile.set({name:n,email:e});
    safe(()=>header(true));
  };
  const originalTriggerPhoto=window.triggerProfilePhoto;
  window.triggerProfilePhoto=function(){
    if(originalTriggerPhoto)originalTriggerPhoto();
    setTimeout(syncProfileUI,120);
  };

  /* ---------- Global single-preview guard ---------- */
  function closeRegularModals(exceptId){
    document.querySelectorAll('.modal.show').forEach(m=>{if(m.id!==exceptId)m.classList.remove('show')});
    if($('settingsPanel') && exceptId!=='settingsPanel')$('settingsPanel').classList.remove('show');
  }
  function guardModalOpen(name){
    const original=window[name];
    if(typeof original!=='function' || original.__v20guarded)return;
    const wrapped=function(){
      closeRegularModals();
      return original.apply(this,arguments);
    };
    wrapped.__v20guarded=true;
    window[name]=wrapped;
  }
  [
    'openAction','openAsset','openBudget','openCategory','openDebt','openEpfo','openFd',
    'openIncomeAccount','openLoan','openMethod','openMf','openMilestone','openRepay',
    'openStock','openTrendDate','openTxMenu','openTransaction'
  ].forEach(guardModalOpen);
  const originalOpenSettingsPanel=window.openSettingsPanel;
  if(typeof originalOpenSettingsPanel==='function'&&!originalOpenSettingsPanel.__v20guarded){
    const guardedSettings=function(){closeRegularModals('settingsPanel');buildSettings();$('settingsPanel')?.classList.add('show')};
    guardedSettings.__v20guarded=true;
    window.openSettingsPanel=guardedSettings;
  }
  const originalOpenBrainFood=window.openBrainFood;
  if(typeof originalOpenBrainFood==='function'&&!originalOpenBrainFood.__v20guarded){
    const guardedBrain=function(){closeRegularModals('brainFoodPanel');return originalOpenBrainFood.apply(this,arguments)};
    guardedBrain.__v20guarded=true;
    window.openBrainFood=guardedBrain;
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest('[onclick]');
    if(t){
      const code=t.getAttribute('onclick')||'';
      if(/open(Category|Method|IncomeAccount|Transaction|TxMenu|Action|Budget|Asset|Debt|Epfo|Fd|Loan|Mf|Milestone|Repay|Stock|TrendDate)\s*\(/.test(code)){
        closeRegularModals();
      }
    }
  },true);

  // Profile photo: save the same value used by the legacy profile renderer and V20 shared profile.
  window.setProfilePhoto=function(input){
    const f=input?.files?.[0]; if(!f)return;
    if(!f.type.startsWith('image/')){alert('Choose an image.');return}
    const r=new FileReader();
    r.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const max=512,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
        const ctx=c.getContext('2d');ctx.drawImage(img,0,0,c.width,c.height);
        const data=c.toDataURL('image/jpeg',.86);
        V20Profile.set({photo:data});
        if(typeof renderProfile==='function')renderProfile();
        if(typeof renderMore==='function')renderMore();
        if(typeof refresh==='function')refresh();
        alert('Profile photo updated.');
      };
      img.onerror=()=>alert('Could not read that image.');
      img.src=r.result;
    };
    r.onerror=()=>alert('Could not read that image.');
    r.readAsDataURL(f);
  };
  window.removeProfilePhoto=function(){
    V20Profile.set({photo:''});
    if(typeof renderProfile==='function')renderProfile();
    if(typeof renderMore==='function')renderMore();
    if(typeof refresh==='function')refresh();
    alert('Profile photo removed.');
  };

  function initV20(){
    if(!window.__v20SettingsTemplate){const t=document.querySelector('#settingsPanel .settings-list-card')||document.querySelector('#mmore > .settings-list-card')||document.querySelector('#wmore > .settings-list-card');if(t)window.__v20SettingsTemplate=t.cloneNode(true);}
    buildBrain();
    syncTheme();syncProfileUI();
    patchNavigation();
    rewriteMore('mmore',false);rewriteMore('wmore',true);
    refreshHeaderText();
    // Remove any leftover inline settings cards from More after the app has rendered.
    document.querySelectorAll('#mmore > .settings-list-card,#wmore > .settings-list-card').forEach(e=>e.remove());
    // Keep settings available only through the button.
    if($('settingsPanel'))$('settingsPanel').classList.remove('show');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initV20,60));else setTimeout(initV20,60);
})();



(function(){
  'use strict';
  const PKEY='spend_tracker_personalization_v202';
  const VISUALS={
    money:['💸','💰','🧾','👛','🪙','💳','😂','😅','🤨','🫠','🤦','👀','🤑','🧮','📊'],
    wealth:['📈','📊','🧠','🏦','💎','🌱','🧱','🤑','🎯','🚀','🧭','💼','🔭','🪴','🪙'],
    funny:['😂','😅','🤡','💀','🫠','🤦','👀','😎','🙃','🫡','😏','🧠'],
    fact:['🧠','🔎','📚','💡','🧮','📐','📊','⏳'],
    goal:['🎯','🏁','🚀','🏆','🧱','📈','✅'],
    backup:['☁️','💾','🛟','🧳','🔐','✅'],
    budget:['🎯','🧮','🚦','🧾','✂️','👀'],
    transaction:['🧾','💳','💸','🧮','🔎','📌'],
    default:['🧠','💡','👀','✨','🎲','📌']
  };
  const LIB={
    money:[
      ['Tracking money is cheaper than discovering where it vanished. 😂','funny'],['Your wallet has entered the meeting. Please be honest.','funny'],['Every rupee now has a paper trail. Tiny victory.','money'],['Money in, money out, story documented.','money'],['Small spends are only small when they happen alone.','fact'],['The numbers are innocent. The decisions are questionable. 😌','funny'],['A tracked rupee is a less mysterious rupee.','money'],['Your bank balance requested adult supervision. 👀','funny'],['Spending visible. Panic optional.','money'],['The wallet report has arrived.','transaction'],['Another financial plot twist, now with timestamps. 😂','funny'],['Good records beat good memory. Humans forget. Spreadsheets do not.','fact'],['Your money mess is officially measurable.','money'],['Tiny expenses are tiny until they form a committee.','funny'],['One tap closer to financial clarity.','money'],['A budget is just a plan with receipts.','budget'],['The wallet is speaking. We are taking minutes.','funny'],['Less guessing. More knowing.','money'],['Your future self is collecting receipts.','money'],['Money behaved today. Suspicious. 👀','funny'],['No judgement. Just numbers. Mostly.','funny'],['The spreadsheet spirit approves. 🧠','fact'],['The chaos has timestamps now. We are winning.','money'],['Your spending has witnesses.','transaction'],['One place for the money mess. 😅','funny'],['Financial housekeeping: glamorous in absolutely no universe.','funny'],['Every transaction is a tiny clue.','transaction'],['The numbers are telling on us again.','funny'],['Organised chaos is still chaos, just searchable.','funny'],['A clean ledger is a beautiful thing. Weird, but true.','money']
    ],
    wealth:[
      ['Slowly building the boring kind of rich. 📈','wealth'],['Future-you appreciates this screen.','wealth'],['Wealth is patience with better records.','fact'],['Compounding likes consistency, not drama.','fact'],['Assets are now doing some of the talking.','wealth'],['Build quietly. Let the numbers make noise.','wealth'],['Your portfolio is basically a long game with paperwork.','funny'],['A little allocation beats a lot of confusion.','wealth'],['The empire is small. The spreadsheet is ambitious. 😂','funny'],['Future Abhishek is taking notes. 👀','wealth'],['One more record for the future balance sheet.','wealth'],['Diversification: because one idea should not run the whole show.','fact'],['Good wealth tracking is gloriously boring.','wealth'],['Your money is wearing a long-term hat. 🎩','funny'],['Net worth is just a scoreboard with receipts.','fact'],['Build first. Flex later. 😌','wealth'],['A clean wealth ledger beats heroic memory.','wealth'],['Patience looks good on a portfolio.','wealth'],['Quiet progress still counts.','wealth'],['The boring parts are often the useful parts.','fact'],['Your assets have responsibilities now. 😂','funny'],['Small records become useful history.','wealth'],['The long game starts with boring consistency.','wealth'],['Future-you likes organised numbers.','wealth'],['One more brick in the balance sheet. 🧱','wealth'],['Your wealth page is basically future-you paperwork.','funny'],['Long-term thinking: less exciting, more effective.','fact'],['Money sleeping? Not all of it. 📊','wealth'],['The portfolio report has entered the room.','wealth'],['Your future balance sheet says thanks.','wealth']
    ],
    budgets:[
      ['Give every rupee a job before it gets creative.','budget'],['Your budget has entered the building. 👀','budget'],['A limit is just a plan wearing a seatbelt.','fact'],['Budgeting is deciding first so impulse does not decide later.','fact'],['The budget is not angry. The budget is evidence. 😂','funny'],['Your spending has boundaries now.','budget'],['A budget is a promise to future-you.','goal'],['Numbers negotiate badly. Rules work better.','budget'],['A little restraint now beats a lot of regret later.','fact'],['The month still has receipts left to write.','budget'],['Your budget deserves fewer plot twists.','funny'],['Track it, then decide. Not the other way around.','budget'],['The best budget is one you can actually follow.','fact'],['Budget first. Excuses later. 😌','budget'],['A category limit is not a personal attack.','funny']
    ],
    analytics:[
      ['Numbers do not lie. They merely expose our decisions.','fact'],['Here lies the evidence. 🧾','transaction'],['Charts: because tables needed better lighting. 😂','funny'],['Your spending has a storyline. We are reading it.','analytics'],['Patterns are where the useful stuff hides.','fact'],['One month is a snapshot. Trends tell the story.','fact'],['The chart is just your habits wearing graph paper.','funny'],['Averages are humble. Outliers are loud.','fact'],['Data is less scary when it is yours.','analytics'],['This is where guesses become numbers.','fact'],['Your past spending just submitted a report.','analytics'],['The graph has receipts. Convenient.','transaction'],['A trend is a pattern asking for attention.','fact'],['Numbers make excellent witnesses.','fact'],['Analytics: the polite way to investigate yourself. 😂','funny']
    ],
    transactions:[
      ['The receipt museum is open. 🧾','transaction'],['Every transaction tells a tiny story.','transaction'],['Money moved. Here is the paper trail.','transaction'],['Three taps and we know where the money went.','money'],['A recorded transaction is a future headache avoided.','fact'],['The ledger remembers what the brain forgets.','fact'],['Recent activity, less mystery.','transaction'],['Your wallet left clues. We collected them.','funny'],['Every line is one less "where did that go?"','money'],['The paper trail is suspiciously thorough. 👀','funny'],['Receipts: tiny documents with enormous opinions.','funny'],['History is useful when it has amounts attached.','fact'],['The transaction list never sleeps.','transaction'],['Money moved. At least it cannot deny it now. 😂','funny'],['Clean records make future-you faster.','fact']
    ],
    more:[
      ['Settings are hiding because you only need them sometimes.','money'],['Your money control room is open. 🚀','money'],['One place for the money mess. 😅','funny'],['Numbers behaving themselves for once. 🎲','funny'],['A clean tracker for a messy world.','money'],['The boring controls are safely out of sight.','funny'],['This is where the app gets configurable.','money'],['Rarely touched settings belong exactly here.','fact'],['Control without clutter.','money'],['The dashboard runs on receipts and mild optimism.','funny']
    ],
    action:[
      ['Saved. Future-you has the receipt. ✅','action'],['Locked in. The numbers got the memo.','action'],['Done. Tiny admin victory. 🏆','action'],['Recorded. No archaeology required later.','action'],['Saved. The chaos is officially documented.','action'],['Updated. The ledger noticed.','action'],['Added. Another financial breadcrumb.','action'],['Done. Very responsible of you. 😌','action'],['Noted. Your future self owes you one.','action'],['Saved. Your wallet may relax now.','action']
    ],
    backup:[
      ['Backup done. Future-you says thanks. ☁️','backup'],['Your data now has an escape plan.','backup'],['Backup saved. Disaster has been mildly inconvenienced. 😂','backup'],['One backup closer to sleeping peacefully.','backup'],['Data packed. Ready for the next phone.','backup'],['Your future restore button just got happier.','backup'],['One copy in the cloud beats one copy in your memory.','fact'],['Backups are boring right up until they are heroic.','funny'],['A backup you never test is still a little suspicious.','fact'],['Good backups are quiet insurance.','fact']
    ],
    empty:[
      ['Nothing here yet. Peaceful. Suspicious. 🫠','funny'],['A rare moment when your wallet is quiet.','funny'],['Blank slate. Dangerous amount of optimism. 😂','funny'],['No records yet. The ledger is waiting.','transaction'],['Nothing to analyse yet. A suspiciously clean start.','funny'],['Fresh screen. Fresh opportunity.','goal'],['Zero records. Zero excuses. 😌','funny']
    ],
    facts:[
      ['Compound growth rewards time more than excitement.','fact'],['Diversification reduces reliance on one outcome.','fact'],['Liquidity is useful because plans occasionally misbehave.','fact'],['A good emergency fund is designed for bad surprises.','fact'],['Tracking spending changes behaviour because visibility changes decisions.','fact'],['Net worth is assets minus liabilities, adjusted for what you are owed and owe.','fact'],['A budget is a forward-looking plan; a transaction is backward-looking evidence.','fact'],['Consistency usually beats occasional bursts of financial heroics.','fact'],['Fees are small until they repeat for years.','fact'],['Risk and return are roommates who argue constantly.','funny'],['A long horizon can make short-term noise less important.','fact'],['Cash has a job too: liquidity.','fact'],['An investment record is more useful when its date is clear.','fact'],['Past performance is history, not a promise.','fact'],['The best system is the one you actually keep updated.','fact']
    ]
  };
  const flat=Object.fromEntries(Object.entries(LIB).map(([k,v])=>[k,v.map(x=>x[0])]));
  const getStore=()=>{try{return JSON.parse(localStorage.getItem(PKEY)||'{}')}catch{return {}}};
  const setStore=v=>{try{localStorage.setItem(PKEY,JSON.stringify(v))}catch{}};
  const recent=()=>{const s=getStore();return Array.isArray(s.recent)?s.recent:[]};
  const remember=(id)=>{const s=getStore();s.recent=Array.isArray(s.recent)?s.recent:[];s.recent.push(id);if(s.recent.length>24)s.recent=s.recent.slice(-24);s.last=id;s.updatedAt=Date.now();setStore(s)};
  const hashText=t=>{let h=0;for(let i=0;i<t.length;i++)h=((h<<5)-h+t.charCodeAt(i))|0;return Math.abs(h)};
  function select(list,kind){
    if(!list?.length)return {text:'',visual:'🧠',kind:kind||'default'};
    const seen=new Set(recent());
    const candidates=list.filter(x=>!seen.has(x[0]));
    const pool=candidates.length?candidates:list;
    const x=pool[Math.floor(Math.random()*pool.length)];
    remember(hashText(x[0]));
    const cat=x[1]||kind||'default';
    const visuals=VISUALS[cat]||VISUALS[kind]||VISUALS.default;
    return {text:x[0],visual:visuals[Math.floor(Math.random()*visuals.length)],kind:cat};
  }
  function ctx(){try{return window.PersonalizationEngine?.context?.()||{mode:'money',page:'home',bucket:'money',spendToday:0,txCount:0,name:'Abhishek'}}catch{return {mode:'money',page:'home',bucket:'money',spendToday:0,txCount:0,name:'Abhishek'}}}
  function contextualLibrary(c,reason){
    if(reason==='action') return LIB.action;
    if(reason==='backup') return LIB.backup;
    if(reason==='empty') return LIB.empty;
    if(reason==='facts') return LIB.facts;
    if(c.bucket==='budgets'||c.page==='budgets')return LIB.budgets;
    if(c.bucket==='analytics'||c.page==='analytics')return LIB.analytics;
    if(c.bucket==='transactions'||c.page==='transactions')return LIB.transactions;
    if(c.bucket==='more'||c.page==='more')return LIB.more;
    return c.mode==='wealth'?LIB.wealth:LIB.money;
  }
  function getCurrent(reason){
    const c=ctx(), key=[c.mode,c.page,c.spendToday,c.txCount,reason||'context'].join('|');
    const s=getStore();
    if(s.lastKey===key && s.lastText)return {text:s.lastText,visual:s.lastVisual||'🧠',kind:s.lastKind||'money',key};
    const x=select(contextualLibrary(c,reason),c.mode==='wealth'?'wealth':'money');
    s.lastKey=key;s.lastText=x.text;s.lastVisual=x.visual;s.lastKind=x.kind;setStore(s);
    return {...x,key};
  }
  function applyPreview(x){
    const ids=['globalMessage','surprisePreview','wealthSurprisePreview','v20BrainTeaser-m','v20BrainTeaser-w'];
    ids.forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=x.text});
    const text=document.getElementById('brainFoodText');if(text)text.textContent=x.text;
    const icon=document.getElementById('brainFoodIcon');if(icon)icon.textContent=x.visual;
    const tag=document.getElementById('brainFoodTag');if(tag){tag.textContent=ctx().mode==='wealth'?'WEALTH BRAIN FOOD':'MONEY BRAIN FOOD'}
    const big=document.getElementById('brainFoodIcon'); if(big){big.classList.add('v202-brain-visual');}
    const smalls=document.querySelectorAll('.v202-teaser-icon'); smalls.forEach(e=>e.textContent=x.visual);
  }
  function headerProfile(){try{return localStorage.getItem('spend_tracker_profile_name')||'Abhishek'}catch{return 'Abhishek'}}
  function updateHeader(){
    const c=ctx(), p=headerProfile();
    const title=document.getElementById('appTitle'), sub=document.getElementById('appSubtitle');
    const titlePool=c.mode==='wealth'?[`${p}'s Wealth 📈`,`Future-You Fund 📊`,`${p}'s Wealth Desk 🧠`]:[`${p}'s Money 💸`,`Money HQ 💰`,`${p}'s Wallet HQ 🧾`];
    const s=getStore(), hour=new Date().getHours();
    const titleChoice=titlePool[(hashText(String(hour)+c.mode+(c.page||'')))%titlePool.length];
    if(title)title.textContent=titleChoice;
    if(sub){
      if(c.mode==='wealth') sub.textContent=c.spendToday>0?'The long game is still the game. 📈':'Building future-you money, one record at a time.';
      else sub.textContent=c.spendToday>0?'Keeping the money mess measurable. 😌':'Ready when the next rupee moves. 👀';
    }
  }
  function updateSectionMicrocopy(x){
    const map={mhome:['.money-page #mhome .section .small'],mtransactions:['.money-page #mtransactions .section .small'],manalytics:['.money-page #manalytics .section .small'],mbudgets:['.money-page #mbudgets .section button'],whome:['.wealth-page #whome .wealth-section-note'],wtransactions:['.wealth-page #wtransactions .small'],wanalytics:['.wealth-page #wanalytics .small']};
    const c=ctx(); const key=c.mode==='wealth'?'w'+c.page:'m'+c.page; const sels=map[key]||[]; sels.forEach(sel=>document.querySelectorAll(sel).forEach(e=>{if(e.dataset.v202Keep==='1')return;e.dataset.v202Keep='1';}));
  }
  function renderTeaser(){
    document.querySelectorAll('.v20-brain-teaser').forEach(teaser=>{
      if(teaser.dataset.v202Done==='1')return;
      teaser.dataset.v202Done='1';
      const copy=teaser.querySelector('.teaser-copy');
      const dice=teaser.querySelector('.v20-brain-dice');
      if(copy){const oldP=copy.querySelector('p'); if(oldP)oldP.classList.add('v202-teaser-preview')}
      if(dice){dice.innerHTML='<span class="v202-teaser-icon">🎲</span>'}
    });
  }
  window.PersonalizationEngineV202={
    next:function(reason){const x=getCurrent(reason||'context');applyPreview(x);return x},
    context:ctx,
    library:flat,
    visualLibrary:VISUALS,
    getState:getStore
  };
  window.showSurpriseMessage=function(){
    const c=ctx();
    const x=select(contextualLibrary(c,'context'),c.mode==='wealth'?'wealth':'money');
    const s=getStore();s.lastKey='manual|'+Date.now();s.lastText=x.text;s.lastVisual=x.visual;s.lastKind=x.kind;setStore(s);
    applyPreview(x);
  };
  function v202Refresh(reason){
    renderTeaser();
    const x=getCurrent(reason||'context');
    applyPreview(x);
    updateHeader();
  }
  // Extend legacy refresh without replacing its financial work.
  const oldRefresh=window.refresh;
  if(oldRefresh&&!oldRefresh.__v202wrapped){
    const wrapped=function(){const r=oldRefresh.apply(this,arguments);setTimeout(()=>v202Refresh('refresh'),0);return r};
    wrapped.__v202wrapped=true;window.refresh=wrapped;
  }
  const oldSwitch=window.switchApp;
  if(oldSwitch&&!oldSwitch.__v202wrapped){
    const wrapped=function(){const r=oldSwitch.apply(this,arguments);setTimeout(()=>v202Refresh('switch'),20);return r};wrapped.__v202wrapped=true;window.switchApp=wrapped;
  }
  const oldOpenMoney=window.openMoneyPage;
  if(oldOpenMoney&&!oldOpenMoney.__v202wrapped){window.openMoneyPage=function(){const r=oldOpenMoney.apply(this,arguments);setTimeout(()=>v202Refresh('nav'),20);return r};window.openMoneyPage.__v202wrapped=true}
  const oldOpenWealth=window.openWealthPage;
  if(oldOpenWealth&&!oldOpenWealth.__v202wrapped){window.openWealthPage=function(){const r=oldOpenWealth.apply(this,arguments);setTimeout(()=>v202Refresh('nav'),20);return r};window.openWealthPage.__v202wrapped=true}
  // Keep Brain Food visuals local and mode-aware.
  const oldOpenBrain=window.openBrainFood;
  if(oldOpenBrain&&!oldOpenBrain.__v202wrapped){window.openBrainFood=function(){const r=oldOpenBrain.apply(this,arguments);setTimeout(()=>{const x=select(contextualLibrary(ctx(),'context'),ctx().mode==='wealth'?'wealth':'money');applyPreview(x)},10);return r};window.openBrainFood.__v202wrapped=true}
  // Initial + passive live refresh. Only changes when the contextual signature changes.
  let lastSig='';
  function live(){
    const c=ctx(),sig=[c.mode,c.page,c.spendToday,c.txCount].join('|');
    if(sig!==lastSig){lastSig=sig;v202Refresh('live')}
  }
  function init(){v202Refresh('open');setInterval(live,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
