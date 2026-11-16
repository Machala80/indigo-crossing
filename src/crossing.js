
/* The Crossing - app logic. Started by main.tsx once the member is signed in. */
export function startCrossing(api){
'use strict';

/* ---------- Reference data ---------- */
const ROOTS = {
  lineage:  {label:'Family line',        hint:'Passed down through the people who raised me'},
  teaching: {label:'Faith & teaching',   hint:'Learned from a church, a school or a doctrine'},
  culture:  {label:'Culture & society',  hint:'Absorbed from the world around me'},
  wound:    {label:'A wound or event',   hint:'Formed by something that happened to me'},
  survival: {label:'Survival strategy',  hint:'Something I did to get through'},
  unknown:  {label:'Not yet known',      hint:'I can feel it but can’t place it yet'}
};
const STAGES = [
  {name:'The Narrow Place', sub:'MITZRAYIM', emb:'narrow', desc:'Named, but not yet traced to its root.'},
  {name:'Recognition',      sub:'SEEN',      emb:'eye',    desc:'Traced. You know what it is and where it came from.'},
  {name:'Departure',        sub:'DAYS 1–6', emb:'gate', desc:'The first held days. Leaving is the hardest part.'},
  {name:'Wilderness',       sub:'DAYS 7–39', emb:'tent', desc:'Old cravings return. Each held day rewires the path.'},
  {name:'The Jordan',       sub:'DAY 40',    emb:'waters', desc:'Forty days held. Ready to be released.'},
  {name:'Promised Land',    sub:'RELEASED',  emb:'crown',  desc:'Released. This pattern no longer runs you.'}
];
/* Waymarks follow the route of Exodus, in order */
const STONES = [
  {d:1,  name:'Out of Egypt', emb:'gate',   line:'The first step out of the narrow place.'},
  {d:3,  name:'Marah',        emb:'tree',   line:'Three days in, the water tastes bitter. Keep walking: at Marah it was made sweet. (Exodus 15:22–25)'},
  {d:7,  name:'Sabbath',      emb:'lamp',   line:'Seven days held. Rest in what you have done.'},
  {d:12, name:'Elim',         emb:'palm',   line:'Twelve springs and seventy palms. A place to drink. (Exodus 15:27)'},
  {d:21, name:'Manna',        emb:'manna',  line:'Enough for today, every day. Freedom is gathered one day at a time. (Exodus 16)'},
  {d:30, name:'Sinai',        emb:'sinai',  line:'The covenant is written. You know who you are becoming. (Exodus 19–20)'},
  {d:40, name:'Jordan',       emb:'waters', line:'Forty days held. The crossing is open. (Joshua 3)'}
];
/* Ranks echo the Indigo Estate tiers */
const RANKS = [
  {n:'Initiate', m:0,    line:'You have stepped onto the road.'},
  {n:'Seeker',   m:40,   line:'You are asking the right questions.'},
  {n:'Pilgrim',  m:120,  line:'You keep walking, even when it’s hard.'},
  {n:'Steward',  m:250,  line:'You tend your inner ground with care.'},
  {n:'Sovereign',m:500,  line:'You govern yourself. The pattern no longer rules.'},
  {n:'Architect',m:1000, line:'You build freedom, for yourself and for others.'}
];
const EARN = [['Pledge',1],['Held day',3],['Noticed',2],['Urge ridden out',5],['Honest slip log',1],['Evening examen',2],['Belief questioned',8],['Daily dare',5],['Trial quest',10],['Trial complete',30],['Weekly step done',10],['Sunday review',5],['Season milestone',20]];
const TRIAL = [
  {t:'Say it aloud',          d:'Tell your witness the name of the pattern you are walking out of.', auto:null},
  {t:'Catch it once',         d:'Check in as Held or Noticed on any pattern.', auto:'check'},
  {t:'Ride one wave',         d:'When the pull comes, tap “The pull is here” and ride it out.', auto:'urge'},
  {t:'Question the voice',    d:'Complete one “Question the belief” inquiry.', auto:'inquiry'},
  {t:'Before noon',           d:'Do your practice once before midday.', auto:null},
  {t:'Write it on the mirror',d:'Write your truth where you’ll see it every day: a mirror, a door, your lock screen.', auto:null},
  {t:'Sabbath',               d:'Close the day with the evening examen (at least two answers).', auto:'examen'}
];
const DARES = [
  'Say no to one small thing today, kindly and without over-explaining.',
  'Notice the pattern in someone else today, and answer it with compassion instead of judgement.',
  'Speak your truth out loud three times, looking yourself in the eye in a mirror.',
  'Do the opposite of your pattern once today, even in the smallest way.',
  'Spend ten minutes in silence with your phone in another room.',
  'Write the old belief on paper. Underneath, in bigger letters, write your truth.',
  'Read “what it costs” out loud to yourself, slowly.',
  'Thank someone in your family line, living or not, for one thing they gave you.',
  'Catch the trigger before it fires and name it out loud: “There it is.”',
  'Tell one person something true you would normally keep hidden.',
  'Write three things your pattern protected you from, and thank it for its service.',
  'Fast from complaining for the whole day.',
  'Walk somewhere new for fifteen minutes and notice what you feel in your body.',
  'Forgive yourself, in writing, for one slip.',
  'Ask your witness one question about their own patterns, and just listen.',
  'Give away one thing that belongs to the old pattern.',
  'Go to bed at the time the person you are becoming would.',
  'Rest for one hour without doing anything useful, and without guilt.',
  'Do your practice before you check your phone.',
  'Write a short letter from your future self, forty days from now.',
  'Bless someone who once spoke the old belief over you. You don’t have to send it.'
];
const STEPS = [
  {title:'Name the pattern', q:'What do you keep doing that you have promised yourself you would stop?', hint:'Give it a short name you’ll recognise, then describe what actually happens.',
    fields:[{k:'name',label:'A short name',type:'input',ph:'e.g. Going quiet at 80%'},{k:'habit',label:'What I actually do',type:'area',ph:'Describe it plainly, as if to a friend.'}]},
  {title:'The trigger', q:'What usually happens just before it starts?', hint:'A feeling, a time of day, a person, a message, a place. Be specific.',
    fields:[{k:'trigger',label:'Just before, this happens',type:'area',ph:'e.g. Someone asks when it will be ready'}]},
  {title:'The belief beneath', q:'What would you have to believe for this pattern to make sense?', hint:'Try finishing the sentence: “If I … then …”',
    fields:[{k:'belief',label:'The belief',type:'area',ph:'If I … then …'}]},
  {title:'Whose voice is it?', q:'When you hear that belief, whose voice does it sound like?', hint:'Then choose where you think it came from. You can change this later.',
    fields:[{k:'voice',label:'It sounds like',type:'input',ph:'e.g. My grandmother, a pastor, a teacher, me at 12'},{k:'rootType',label:'Where it came from',type:'roots'}]},
  {title:'The first memory', q:'When do you first remember learning this?', hint:'You don’t need the whole story. One scene is enough.',
    fields:[{k:'rootStory',label:'The first time I remember',type:'area',ph:'Where were you? Who was there? What did you decide about yourself?'}]},
  {title:'What it protected', q:'What has this pattern been protecting you from?', hint:'Every pattern began as a solution. Honour what it did for you before you let it go.',
    fields:[{k:'payoff',label:'It kept me safe from',type:'area',ph:'e.g. Being judged, being left, being too much'}]},
  {title:'What it costs now', q:'What is it costing you, and the people around you, today?', hint:'Name the cost honestly. This is your reason for leaving, and you’ll see it again when the pull comes.',
    fields:[{k:'cost',label:'What it costs',type:'area',ph:'Time, money, trust, health, peace'}]},
  {title:'Who you are becoming', q:'Who are you becoming, now that you are walking out?', hint:'Say it as “I am someone who …”. Every held day is a vote for this person.',
    fields:[{k:'identity',label:'I am someone who',type:'input',ph:'e.g. finishes what I start'}]},
  {title:'The new covenant', q:'What do you choose to believe instead, and what will you do when the trigger comes?', hint:'Write the truth in the first person. Make the practice small enough to do on a hard day, and tie it to the trigger: “When …, I will …”.',
    fields:[{k:'truth',label:'The truth I choose',type:'area',ph:'e.g. My work can be imperfect and still be finished.'},{k:'practice',label:'When the trigger comes, I will',type:'area',ph:'e.g. Send one small piece to someone the same day.'}]}
];
const QSTEPS = [
  {title:'How true does it feel?', q:'Read the belief slowly. Right now, how true does it feel?', hint:'0 means not at all. 100 means completely, without question.'},
  {title:'Is it true?', q:'Is it true? And can you know, beyond all doubt, that it is true?', hint:'Answer from stillness, not from habit. A quick yes is often the old voice talking.'},
  {title:'Weigh the evidence', q:'What actually supports this belief, and what doesn’t?', hint:'Facts only: things a camera would have recorded, not interpretations.'},
  {title:'When you believe it', q:'What happens when you believe this thought?', hint:'In your body, in what you do next, in how you treat yourself and the people around you.'},
  {title:'Without it', q:'Who would you be in the same situation, without this thought?', hint:'Picture it. Same room, same people. Just without the belief.'},
  {title:'Turn it around', q:'Write the opposite, and find three real examples of it being true.', hint:'Turn it toward yourself, toward the other person, or to its opposite. Pick the one that rings truest.'},
  {title:'How true now?', q:'Read the original belief again. How true does it feel now?', hint:'There is no right number. Any movement is the narrow place widening.'}
];
const EXAMPLE = {
  id:'example', example:true,
  name:'Going quiet at 80%',
  habit:'I pour myself into a new project, then go silent just before it is finished and start something else.',
  trigger:'Someone asks when it will be ready, or I imagine people seeing it.',
  belief:'If I finish it, it can be judged, and so can I.',
  voice:'A teacher who marked everything in red',
  rootType:'wound',
  rootStory:'Age nine. A project I was proud of was held up in class as an example of what not to do.',
  payoff:'It kept me from being seen and found lacking.',
  cost:'Half-built work everywhere, lost income, and people who no longer expect me to deliver.',
  identity:'finishes what I start',
  truth:'My work can be imperfect and still be finished. Being seen is safe now.',
  practice:'When I feel the pull to go quiet, I send one small piece to someone that same day.',
  grid:'..........h.hhsh.hnhhhhs.hhhnhhhhhhhhhhh',
  inquiries:[{date:'', before:85, after:40, turn:'If I finish it, I can be judged, and I can survive that.'}],
  urges:[{trigger:'Client asked for a deadline',intensity:7,outcome:'rode',hour:16,dow:2},{trigger:'Imagining people seeing it',intensity:8,outcome:'won',hour:22,dow:0},{trigger:'Client asked for a deadline',intensity:5,outcome:'rode',hour:15,dow:4},{trigger:'Tired after school run',intensity:6,outcome:'rode',hour:21,dow:3}]
};
const CONSENT = 'I agree that Indigo Estate (Life and Soul Place Ltd) may email me one short daily reminder for The Crossing. I can stop at any time, here or from any reminder email.';

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const dkey = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const todayKey = () => dkey(new Date());
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const fromKey = k => { const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); };
const fmtShort = d => d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const fmtLong = d => d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
const fmtDay = d => d.toLocaleDateString('en-GB',{weekday:'long'});
const newId = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
const clone = o => JSON.parse(JSON.stringify(o));
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const emb = (id, cls) => `<svg class="emb${cls?' '+cls:''}" aria-hidden="true"><use href="#e-${id}"/></svg>`;
const dayIndex = () => Math.floor(fromKey(todayKey()).getTime() / 86400000);

/* ---------- State & saving ---------- */
function blank(){ return {v:3, patterns:[], checks:{}, slips:{}, intentions:{}, pledges:{}, examens:{}, urges:[], dares:{}, quest:{start:null, done:{}, complete:null, trials:0}, rankSeen:null, year:null, yearsCompleted:0, witness:{name:'',next:'',stake:'',rhythm:'weekly'}}; }
function normalise(s){
  const b = blank();
  if (!s || typeof s !== 'object') return b;
  for (const k in b) if (s[k] !== undefined && s[k] !== null) b[k] = s[k];
  if (!Array.isArray(b.patterns)) b.patterns = [];
  if (!Array.isArray(b.urges)) b.urges = [];
  b.witness = Object.assign({name:'',next:'',stake:'',rhythm:'weekly'}, typeof b.witness === 'object' ? b.witness : {});
  b.quest = Object.assign({start:null, done:{}, complete:null, trials:0}, typeof b.quest === 'object' ? b.quest : {});
  b.patterns.forEach(p => { if (!Array.isArray(p.inquiries)) p.inquiries = []; });
  if (b.year && typeof b.year === 'object'){ b.year.weeks = b.year.weeks || {}; b.year.milestones = b.year.milestones || {}; b.year.seasons = Array.isArray(b.year.seasons) ? b.year.seasons : ['','','','']; } else b.year = null;
  b.v = 3;
  return b;
}

let state = blank();
try { if (api.journal) state = normalise(JSON.parse(api.journal)); } catch(e){}
let mode = 'saved';
const mirrorOn = () => api.mirrorEnabled;
let rem = api.reminder || null, remSlot = (rem && rem.slot) || 'morning', remMsg = '', remErr = '', remBusy = false;
let remDraft = (rem && rem.email) || api.email || '', remConsent = false;
let delArmed = false, delBusy = false;

let saveTimer = null, inFlight = false, dirty = false, retryTimer = null;
function save(){ dirty = true; mode = 'pending'; setStatus(); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 700); }
async function flush(){
  if (!dirty || inFlight) return;
  dirty = false; inFlight = true; mode = 'saving'; setStatus();
  try { await api.save(JSON.stringify(state)); mode = dirty ? 'pending' : 'saved'; }
  catch(e){ dirty = true; mode = 'error'; clearTimeout(retryTimer); retryTimer = setTimeout(flush, 5000); }
  inFlight = false; setStatus();
  if (dirty && mode !== 'error') flush();
}
window.addEventListener('beforeunload', e => { if (dirty || inFlight){ flush(); e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

function setStatus(){
  const el = $('#status'); if (!el) return;
  el.dataset.mode = mode === 'saved' ? 'account' : mode === 'error' ? 'error' : 'local';
  el.textContent = mode === 'saved' ? 'Saved privately to your account'
                 : mode === 'error' ? 'Not saved yet · retrying'
                 : 'Saving…';
}
const errText = (e, fallback) => (e && typeof e.data === 'string') ? e.data : fallback;

/* ---------- Derived ---------- */
const realPatterns = () => state.patterns;
const showingExample = () => state.patterns.length === 0;
const checkOf = (k, id) => state.checks[k] && state.checks[k][id];
function stats(p){
  if (p.example){
    const g = p.grid; return {held:(g.match(/h/g)||[]).length, noticed:(g.match(/n/g)||[]).length, slipped:(g.match(/s/g)||[]).length, streak:11};
  }
  let held=0, noticed=0, slipped=0;
  for (const k in state.checks){ const v = checkOf(k, p.id);
    if (v==='held') held++; else if (v==='noticed') noticed++; else if (v==='slipped') slipped++; }
  let streak = 0, d = new Date();
  if (checkOf(dkey(d), p.id) !== 'held') d = addDays(d,-1);
  while (checkOf(dkey(d), p.id) === 'held'){ streak++; d = addDays(d,-1); }
  return {held, noticed, slipped, streak};
}
function strength(p){
  if (p.example) return 71;
  const M = 0.948; let s = 0;
  Object.keys(state.checks).sort().forEach(k => { const v = checkOf(k, p.id); if (!v) return;
    s = s*M + (v==='held' ? 1 : v==='noticed' ? .5 : 0) * (1-M); });
  return Math.round(s*100);
}
function stageOf(p){
  if (p.released) return 5;
  if (!p.belief || !p.rootType) return 0;
  const h = stats(p).held;
  return h >= 40 ? 4 : h >= 7 ? 3 : h >= 1 ? 2 : 1;
}
const nextStone = held => STONES.find(s => s.d > held);
function urgesFor(p){ return p.example ? p.urges : state.urges.filter(u => u.pid === p.id); }
const examenCount = e => e ? ['grateful','free','pulled','tomorrow'].filter(f => (e[f]||'').trim()).length : 0;

/* Manna: earned from real actions, never bought */
function manna(){
  let t = 0;
  for (const k in state.checks) for (const id in state.checks[k]){ const v = state.checks[k][id]; t += v==='held'?3 : v==='noticed'?2 : 0; }
  state.urges.forEach(u => t += u.outcome==='rode' ? 5 : 1);
  state.patterns.forEach(p => t += 8 * (p.inquiries||[]).length);
  for (const k in state.examens) if (examenCount(state.examens[k]) >= 2) t += 2;
  t += Object.keys(state.pledges).length;
  t += 5 * Object.keys(state.dares).length;
  t += 10 * Object.keys(state.quest.done||{}).length + 30 * (state.quest.trials||0);
  if (state.year){ for (const k in state.year.weeks){ const w = state.year.weeks[k]; t += w.done==='yes'?10 : w.done==='partly'?4 : 0; if (w.review) t += 5; } t += 20 * Object.keys(state.year.milestones||{}).length; }
  t += 100 * (state.yearsCompleted||0);
  return t;
}
function rankOf(m){ let i = 0; RANKS.forEach((r, j) => { if (m >= r.m) i = j; }); return i; }

/* Seven Days Out: one quest unlocks each day; some complete themselves from what you log */
function questUnlock(i){ return dkey(addDays(fromKey(state.quest.start), i)); }
function syncQuest(){
  const q = state.quest; if (!q.start || q.complete) return false;
  const tk = todayKey(); let changed = false;
  TRIAL.forEach((t, i) => {
    if (q.done[i] || !t.auto) return;
    const u = questUnlock(i); if (tk < u) return;
    let met = false;
    if (t.auto === 'check') met = Object.keys(state.checks).some(k => k >= u && Object.values(state.checks[k]).some(v => v==='held'||v==='noticed'));
    if (t.auto === 'urge') met = state.urges.some(x => x.date >= u && x.outcome === 'rode');
    if (t.auto === 'inquiry') met = state.patterns.some(p => (p.inquiries||[]).some(x => x.date >= u));
    if (t.auto === 'examen') met = Object.keys(state.examens).some(k => k >= u && examenCount(state.examens[k]) >= 2);
    if (met){ q.done[i] = tk; changed = true; }
  });
  if (TRIAL.every((t, i) => q.done[i])){ q.complete = tk; q.trials = (q.trials||0) + 1; changed = true;
    queueSeal({kicker:'Trial complete', name:'Seven Days Out', line:'Seven quests, seven days. You walked out on purpose. +30 manna.', emb:'seal'}); }
  if (changed) save();
  return changed;
}

/* ---------- Celebration seals ---------- */
const sealQueue = [];
function queueSeal(s){ sealQueue.push(s); if ($('#seal').hidden) nextSeal(); }
function nextSeal(){
  const s = sealQueue.shift(); const o = $('#seal');
  if (!s){ o.hidden = true; return; }
  $('#sealKicker').textContent = s.kicker; $('#sealName').textContent = s.name; $('#sealLine').textContent = s.line;
  $('#sealEmb').innerHTML = `<use href="#e-${s.emb}"/>`;
  o.hidden = false; o.classList.remove('play'); void o.offsetWidth; o.classList.add('play');
}
function checkRank(){
  if (showingExample()) return;
  const r = rankOf(manna());
  if (state.rankSeen === null || state.rankSeen === undefined){ state.rankSeen = r; save(); return; }
  if (r > state.rankSeen){ state.rankSeen = r; save(); queueSeal({kicker:'New rank', name:RANKS[r].n, line:RANKS[r].line, emb:'crown'}); }
}

/* ---------- UI bits ---------- */
function ring(n){
  const on = Math.min(n, 40); let s = '';
  for (let i = 0; i < 40; i++){
    const a = (i/40) * Math.PI*2 - Math.PI/2, r1 = 25, r2 = i < on ? 33 : 31;
    s += `<line class="tk${i<on?' on':''}" x1="${(38+Math.cos(a)*r1).toFixed(2)}" y1="${(38+Math.sin(a)*r1).toFixed(2)}" x2="${(38+Math.cos(a)*r2).toFixed(2)}" y2="${(38+Math.sin(a)*r2).toFixed(2)}"/>`;
  }
  return `<svg class="ring" viewBox="0 0 76 76" role="img" aria-label="${on} of 40 days held">${s}<text x="38" y="44" text-anchor="middle">${on}</text></svg>`;
}
function stonesRow(held){
  return `<div class="stones" aria-label="Waymarks">${STONES.map(s => `<div class="stone${held>=s.d?' on':''}" title="Day ${s.d}: ${esc(s.line)}"><span class="disc">${emb(s.emb)}</span><span>${s.name}<br>${s.d}</span></div>`).join('')}</div>`;
}
function strengthBar(p){
  const v = strength(p);
  return `<div class="strength" title="Rises with each held day and dips gently with a slip, so one bad day never wipes out your progress."><span>Hold strength</span><span class="track"><span class="fill" style="width:${v}%"></span></span><b>${v}%</b></div>`;
}
const stageChip = s => `<span class="chip stage" data-s="${s}">${emb(STAGES[s].emb)}${STAGES[s].name}</span>`;
function toast(msg, ms){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, ms || 2600); }
function bars(entries, warm){
  const max = Math.max(1, ...entries.map(e => e[1]));
  return `<div class="bars">${entries.map(([label,n]) => `<div class="bar"><span>${esc(label)}</span><span class="track"><span class="fill${warm?' warm':''}" style="width:${(n/max)*100}%"></span></span><span class="n">${n}</span></div>`).join('')}</div>`;
}
function jar(frac){
  const top = 30, bottom = 96, h = (bottom - top) * Math.max(0, Math.min(1, frac));
  let grains = '';
  for (let i = 0; i < 26; i++){ const gy = bottom - 3 - ((i * 37) % 60); if (gy < bottom - h) continue; grains += `<circle class="grain" cx="${16 + ((i*23)%52)}" cy="${gy}" r="2.4"/>`; }
  return `<svg class="jar" viewBox="0 0 84 104" aria-hidden="true"><defs><clipPath id="jarClip"><path d="M14 30 Q8 34 8 44 V90 Q8 98 18 98 H66 Q76 98 76 90 V44 Q76 34 70 30 Z"/></clipPath></defs>
    <g clip-path="url(#jarClip)"><rect x="0" y="${bottom-h+2}" width="84" height="${h+4}" fill="rgb(245 216 122 / .28)"/>${grains}</g>
    <path class="glass" d="M14 30 Q8 34 8 44 V90 Q8 98 18 98 H66 Q76 98 76 90 V44 Q76 34 70 30 Z"/>
    <rect class="lid" x="16" y="20" width="52" height="9" rx="3"/><path d="M24 20 V14 H60 V20" fill="none" stroke="#C9A96E" stroke-width="1.6"/></svg>`;
}

/* ---------- Views ---------- */
const VIEWS = ['today','quest','patterns','trace','future','yearsetup','journey','witness','question'];
const view = () => { const h = location.hash.slice(1); return VIEWS.includes(h) ? h : 'today'; };

let expanded = null, confirmDel = null, mirrorBusy = {}, mirrorErr = {};
let draft = null, editingId = null, step = 0, stepErr = '';
let inq = null, urge = null;
let weekBusy = false, weekErr = '', weekRead = null;
const todaysDare = () => DARES[dayIndex() % DARES.length];

function renderToday(){
  const k = todayKey();
  const now = new Date();
  const ex = showingExample();
  const list = ex ? [EXAMPLE] : realPatterns().filter(p => !p.released);
  const released = realPatterns().filter(p => p.released).length;
  const pledged = state.pledges[k];
  const yk = dkey(addDays(now,-1));
  const slippedYesterday = !ex ? list.filter(p => checkOf(yk, p.id) === 'slipped' && !checkOf(k, p.id)) : [];
  let cards = '';
  if (!ex && list.length === 0){
    cards = `<div class="empty">${emb('crown')}<h3>Every pattern you traced has been released.</h3><p class="muted">When you notice another narrow place, trace it here.</p><a class="btn" href="#trace" data-act="newTrace">Trace a pattern</a></div>`;
  }
  for (const p of list){
    const st = stats(p);
    const cur = p.example ? 'held' : checkOf(k, p.id);
    const slipNote = (!p.example && state.slips[k] && state.slips[k][p.id]) || '';
    const nx = nextStone(st.held);
    const btn = (v, label, sub) => `<button type="button" class="choice" data-act="check" data-id="${esc(p.id)}" data-v="${v}" aria-pressed="${cur===v}"${p.example?' disabled':''}>${label}<small>${sub}</small></button>`;
    cards += `<article class="pcard${p.example?' is-example':''}">
      <div class="ringwrap">${ring(st.held)}<span class="ringcap">of 40 held</span></div>
      <div class="pbody">
        <div class="row">${p.example?'<span class="chip example">Example</span>':''}${stageChip(stageOf(p))}</div>
        <h3>${esc(p.name)}</h3>
        ${p.identity?`<p class="identity">Each held day is a vote for: I am someone who ${esc(p.identity)}</p>`:''}
        ${p.truth?`<p class="truth">${esc(p.truth)}</p>`:''}
        ${p.practice?`<p class="practice">${esc(p.practice)}</p>`:''}
        <div class="choices" role="group" aria-label="How did today go with ${esc(p.name)}?">
          ${btn('held','Held','I kept my word')}${btn('noticed','Noticed','I caught it')}${btn('slipped','Slipped','It ran me')}
        </div>
        <div class="meta"><span>Hold strength <b>${strength(p)}%</b></span>${st.streak?`<span><b>${st.streak}</b> in a row</span>`:''}${nx?`<span>Next waymark: <b>${nx.name}</b> at ${nx.d}</span>`:''}</div>
        ${cur==='slipped' && !p.example ? `<div><label class="lbl" for="slip-${esc(p.id)}">What happened just before?</label><textarea id="slip-${esc(p.id)}" data-bind="slip" data-id="${esc(p.id)}" placeholder="No judgement. Where were you, what did you feel, what did you tell yourself?">${esc(slipNote)}</textarea></div>` : ''}
        <button type="button" class="pullbtn" data-act="urgeOpen" data-id="${esc(p.id)}"${p.example?' disabled':''}>The pull is here</button>
      </div>
    </article>`;
  }
  const ex_ = state.examens[k] || {};
  const exField = (f, label, ph) => `<div><label class="lbl" for="ex-${f}">${label}</label><textarea id="ex-${f}" data-bind="examen" data-k="${f}" placeholder="${ph}">${esc(ex_[f]||'')}</textarea></div>`;
  const dareDone = state.dares[k];
  return `<section class="stack-lg">
    <div class="stack">
      <p class="eyebrow">Today</p>
      <p class="date">${now.toLocaleDateString('en-GB',{weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
      ${!ex ? (pledged
        ? `<div class="pledge done">${emb('seal')}<p><em>Today I walk out. I will hold my covenant for this one day.</em></p><span class="seal">Pledged ${esc(pledged)}</span></div>`
        : `<div class="pledge"><p>Morning pledge: <em>Today I walk out. I will hold my covenant for this one day.</em></p><button class="btn gold small" type="button" data-act="pledge">Make my pledge</button></div>`) : ''}
      <div><label class="lbl" for="intention">Morning intention</label>
      <input type="text" id="intention" data-bind="intention" placeholder="Today I will walk as someone who…" value="${esc(state.intentions[k]||'')}"></div>
      <a class="dare-mini" href="#quest"><span class="emb-badge">${emb('flame')}</span><p><span class="eyebrow">Today’s dare${dareDone?' · done':''}</span><br>${esc(todaysDare())}</p></a>
    </div>
    ${slippedYesterday.length ? `<p class="notice"><b>Never twice.</b> Yesterday ${esc(slippedYesterday.map(p=>p.name).join(' and '))} ran you. One slip is a stumble; two in a row starts a road back. Today matters more than yesterday.</p>` : ''}
    ${ex ? `<div class="empty">${emb('gate')}<p class="eyebrow">Begin here</p><h3>You haven’t traced a pattern yet.</h3><p class="muted small">Below is an example of a traced pattern once you’re checking in each day. Trace your own and it takes the example’s place.</p><a class="btn gold" href="#trace" data-act="newTrace">Trace your first pattern</a></div>` : ''}
    <div class="stack">${cards}</div>
    ${!ex ? `<div class="examen">
      <div class="stack-sm"><p class="eyebrow">Evening examen</p><p class="muted small">Four questions to close the day, adapted from the Ignatian examen.</p></div>
      ${exField('grateful','I give thanks for','One gift from today, however small')}
      ${exField('free','Where I walked free','A moment the new covenant held')}
      ${exField('pulled','Where the old pattern pulled','When, where, and what you told yourself')}
      ${exField('tomorrow','For tomorrow, I ask for','Strength, patience, courage… whatever tomorrow needs')}
    </div>` : ''}
    ${released ? `<p class="muted small">${released} pattern${released>1?'s':''} crossed over into the Promised Land.</p>` : ''}
  </section>`;
}

function renderQuest(){
  const ex = showingExample();
  const m = manna(), r = rankOf(m), next = RANKS[r+1];
  const frac = next ? (m - RANKS[r].m) / (next.m - RANKS[r].m) : 1;
  const k = todayKey(), dareDone = state.dares[k];
  const q = state.quest;
  let trial = '';
  if (ex){
    trial = `<div class="empty">${emb('seal')}<h3>Trace a pattern to begin the trial.</h3><a class="btn" href="#trace" data-act="newTrace">Trace a pattern</a></div>`;
  } else if (!q.start || q.complete){
    trial = `<div class="panel">
      ${q.complete ? `<div class="row">${emb('seal')}<p><b>Completed on ${fmtLong(fromKey(q.complete))}.</b> ${q.trials>1?`You have walked this trial ${q.trials} times.`:''}</p></div>` : ''}
      <p>Seven quests over seven days. One opens each morning. Some complete themselves when you log the right thing; the others you mark yourself, on your honour.</p>
      <div class="row"><button class="btn gold" type="button" data-act="trialStart">${q.complete?'Walk it again':'Begin the trial'}</button><span class="muted small">+10 manna a quest, +30 when all seven are sealed</span></div>
    </div>`;
  } else {
    const tk = todayKey();
    const done = TRIAL.filter((t,i)=>q.done[i]).length;
    trial = `<div class="trial">
      <div class="row"><div class="seals" aria-label="${done} of 7 sealed">${TRIAL.map((t,i)=>`<i class="${q.done[i]?'on':''}"></i>`).join('')}</div><span class="muted small">${done} of 7 sealed · begun ${fmtShort(fromKey(q.start))}</span></div>
      ${TRIAL.map((t, i) => {
        const u = questUnlock(i), locked = tk < u, isDone = !!q.done[i];
        const st = isDone ? `<span class="qstate done">Sealed</span>` : locked ? `<span class="qstate">Opens ${fmtDay(fromKey(u))}</span>`
          : t.auto ? `<span class="qstate">Seals when you log it</span>` : `<button class="btn small" type="button" data-act="questDone" data-i="${i}">I did it</button>`;
        return `<div class="quest ${isDone?'done':locked?'locked':'open'}"><span class="num">${isDone?emb('seal'):i+1}</span><div><h3>${t.t}</h3><p>${t.d}</p></div><div class="qside">${st}</div></div>`;
      }).join('')}
      <button class="btn text" type="button" data-act="trialAbandon">Start the trial over</button>
    </div>`;
  }
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Quest</p><h2>Gather manna. Rise in rank.</h2></div>
    <div class="rank">
      ${jar(frac)}
      <div class="stack-sm">
        <p class="eyebrow">Your rank</p>
        <p class="title">${RANKS[r].n}</p>
        <p class="muted small">${RANKS[r].line}</p>
        <span class="track"><span class="fill" style="width:${Math.round(frac*100)}%"></span></span>
        <p class="small">${m} manna${next?` · ${next.m - m} more to <b>${next.n}</b>`:' · the highest rank'}</p>
      </div>
    </div>
    ${ex?'<p class="muted small">Manna starts gathering once you trace your first pattern.</p>':''}
    <div class="dare">
      <div class="row"><span class="emb-badge">${emb('flame')}</span><div class="stack-sm" style="gap:2px"><p class="eyebrow">Today’s dare</p><p class="muted small">A new one every day · +5 manna</p></div></div>
      <p class="text">${esc(todaysDare())}</p>
      <div>${dareDone ? `<span class="ok">Done today. Well walked.</span>` : `<button class="btn gold" type="button" data-act="dare"${ex?' disabled':''}>I did it</button>`}</div>
    </div>
    <div class="stack">
      <div class="section-head"><div class="stack-sm" style="gap:2px"><p class="eyebrow">The trial</p><h2>Seven Days Out</h2></div></div>
      ${trial}
    </div>
    <div class="stack-sm"><p class="eyebrow">How manna is gathered</p><div class="earn">${EARN.map(([l,n])=>`<div><span>${l}</span><b>+${n}</b></div>`).join('')}</div>
      <p class="muted small">Ranks: ${RANKS.map(x=>`${x.n} (${x.m})`).join(' · ')}</p></div>
  </section>`;
}

function mapList(p){
  const row = (k, v, cls='') => v ? `<li class="${cls}"><span class="k">${k}</span><span class="v">${esc(v)}</span></li>` : '';
  return `<ol class="map" aria-label="The pattern traced from root to fruit">
    ${row('Root', p.rootType ? ROOTS[p.rootType].label : '')}
    ${row('First memory', p.rootStory)}
    ${row('The voice', p.voice)}
    ${row('The belief', p.belief)}
    ${row('The trigger', p.trigger)}
    ${row('What I do', p.habit)}
    ${row('What it protected', p.payoff)}
    ${row('What it costs', p.cost)}
    ${(p.truth||p.practice||p.identity) ? `<li class="divider">The New Covenant</li>` : ''}
    ${row('I am someone who', p.identity, 'cov')}
    ${row('The truth I choose', p.truth, 'cov')}
    ${row('When the trigger comes', p.practice, 'cov')}
  </ol>`;
}
function dropLine(a, b){
  const y = v => (4 + (1 - v/100) * 12).toFixed(1);
  return `<span class="drop"><span class="from">${a}%</span><svg viewBox="0 0 80 20" aria-hidden="true"><line x1="4" y1="${y(a)}" x2="76" y2="${y(b)}" stroke="#C47CD6" stroke-width="1.5"/><circle cx="4" cy="${y(a)}" r="3" fill="#A4536A"/><circle cx="76" cy="${y(b)}" r="3" fill="#C9A96E"/></svg><span class="to">${b}%</span></span>`;
}
function renderInquiries(p){
  const list = p.inquiries || [];
  if (!list.length) return '';
  const last = list[list.length-1];
  return `<div class="inq">
    <span class="k">Questioning the belief · ${list.length} time${list.length>1?'s':''}</span>
    <p class="small">How true “${esc(p.belief)}” felt, before and after the last inquiry:</p>
    ${dropLine(last.before, last.after)}
    ${last.turn ? `<p class="small"><em>Turned around: ${esc(last.turn)}</em></p>` : ''}
  </div>`;
}
function renderMirror(p){
  if (p.example) return '';
  const busy = mirrorBusy[p.id], err = mirrorErr[p.id], m = p.mirror;
  let h = '';
  if (busy) h += `<div class="mirror"><span class="k">The Mirror</span><p class="muted">Looking closely… this can take up to a minute.</p></div>`;
  else if (m) h += `<div class="mirror">
      <span class="k">The Mirror</span>
      ${m.seen?`<p>${esc(m.seen)}</p>`:''}
      ${Array.isArray(m.questions)&&m.questions.length?`<span class="k">Sit with these</span><ol>${m.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol>`:''}
      ${m.truth?`<span class="k">A sharper truth</span><p><em>${esc(m.truth)}</em></p>`:''}
      ${m.practice?`<span class="k">For the next seven days</span><p>${esc(m.practice)}</p>`:''}
      <div class="row">${m.truth && m.truth!==p.truth?`<button class="btn ghost small" type="button" data-act="useTruth" data-id="${esc(p.id)}">Make this my truth</button>`:''}</div>
    </div>`;
  if (err) h += `<p class="err">${esc(err)}</p>`;
  return h;
}

function renderPatterns(){
  const ex = showingExample();
  const list = ex ? [EXAMPLE] : realPatterns().slice().sort((a,b)=>(a.released?1:0)-(b.released?1:0));
  if (expanded === null && list.length) expanded = list[0].id;
  let h = '';
  for (const p of list){
    const s = stageOf(p), st = stats(p), open = expanded === p.id;
    h += `<article class="pat${p.example?' is-example':''}${p.released?' is-released':''}">
      <div class="pat-top">
        <div class="row">${p.example?'<span class="chip example">Example</span>':''}${stageChip(s)}${p.rootType?`<span class="chip root">${ROOTS[p.rootType].label}</span>`:''}</div>
        <h3>${esc(p.name)}</h3>
        <p class="muted small">${p.released ? `Released on ${fmtLong(fromKey(p.releasedAt))}` : `${st.held} of 40 days held · ${st.noticed} noticed · ${st.slipped} slipped · ${urgesFor(p).filter(u=>u.outcome==='rode').length} urges ridden out`}</p>
      </div>
      ${!p.released ? strengthBar(p) + stonesRow(st.held) : ''}
      ${open ? mapList(p) + renderInquiries(p) + renderMirror(p) : ''}
      <div class="pat-actions">
        <button class="btn ghost small" type="button" data-act="toggle" data-id="${esc(p.id)}" aria-expanded="${open}">${open?'Close the map':'Open the map'}</button>
        ${p.example ? `<a class="btn small" href="#trace" data-act="newTrace">Trace my own</a>` : `
          ${p.belief && !p.released ? `<button class="btn small" type="button" data-act="inqStart" data-id="${esc(p.id)}">Question the belief</button>` : ''}
          ${s===4 ? `<button class="btn gold small" type="button" data-act="release" data-id="${esc(p.id)}">Release this pattern</button>` : ''}
          <button class="btn text" type="button" data-act="edit" data-id="${esc(p.id)}">Edit</button>
          ${mirrorOn() && !p.released ? `<button class="btn text" type="button" data-act="mirror" data-id="${esc(p.id)}"${mirrorBusy[p.id]?' disabled':''}>Ask the Mirror</button>` : ''}
          ${confirmDel===p.id ? `<span class="confirm">Delete this pattern and its check-ins?<button class="btn danger small" type="button" data-act="delYes" data-id="${esc(p.id)}">Delete</button><button class="btn text" type="button" data-act="delNo">Keep it</button></span>`
            : `<button class="btn text" type="button" data-act="delAsk" data-id="${esc(p.id)}">Delete</button>`}`}
      </div>
    </article>`;
  }
  return `<section class="stack-lg">
    <div class="section-head"><div class="stack-sm"><p class="eyebrow">Your patterns</p><h2>Every pattern has a root</h2></div>
    <a class="btn gold" href="#trace" data-act="newTrace">Trace a pattern</a></div>
    <p class="muted">Each map reads from the root to the fruit: where the pattern came from, the belief it planted, and what grows from it now. Below the gold line is the covenant replacing it. The waymarks follow the route out of Egypt.</p>
    <div class="stack">${h}</div>
  </section>`;
}

function blankDraft(){ return {name:'',habit:'',trigger:'',belief:'',voice:'',rootType:'',rootStory:'',payoff:'',cost:'',identity:'',truth:'',practice:''}; }

function renderTrace(){
  if (!draft){ draft = blankDraft(); editingId = null; step = 0; }
  const S = STEPS[step];
  let prog = '';
  for (let i = 0; i < STEPS.length; i++) prog += `<button type="button" data-act="goto" data-i="${i}" class="${i<step?'done':i===step?'here':''}" aria-label="Step ${i+1}: ${STEPS[i].title}"${i===step?' aria-current="step"':''}></button>`;
  let fields = '';
  for (const f of S.fields){
    if (f.type === 'roots'){
      fields += `<div><span class="lbl">${f.label}</span><div class="roots" role="group" aria-label="${f.label}">${Object.entries(ROOTS).map(([k,r]) =>
        `<button type="button" class="rootbtn" data-act="pickRoot" data-k="${k}" aria-pressed="${draft.rootType===k}"><b>${r.label}</b><span>${r.hint}</span></button>`).join('')}</div></div>`;
    } else if (f.type === 'input'){
      fields += `<div><label class="lbl" for="f-${f.k}">${f.label}</label><input type="text" id="f-${f.k}" data-bind="draft" data-k="${f.k}" placeholder="${esc(f.ph)}" value="${esc(draft[f.k])}"></div>`;
    } else {
      fields += `<div><label class="lbl" for="f-${f.k}">${f.label}</label><textarea id="f-${f.k}" data-bind="draft" data-k="${f.k}" placeholder="${esc(f.ph)}">${esc(draft[f.k])}</textarea></div>`;
    }
  }
  const exAns = S.fields.filter(f=>f.type!=='roots').map(f => (f.k==='identity'?'I am someone who ':'') + EXAMPLE[f.k]).filter(Boolean).join(' — ');
  const last = step === STEPS.length-1;
  return `<section class="stack-lg">
    <div class="stack-sm">
      <p class="eyebrow">${editingId?'Editing':'Trace a pattern'} · Step ${step+1} of ${STEPS.length} · ${S.title}</p>
      <div class="progress" style="--n:${STEPS.length}">${prog}</div>
    </div>
    <div class="stack">
      <h2 class="q">${S.q}</h2>
      <p class="hint">${S.hint}</p>
      ${fields}
      ${exAns ? `<p class="example-ans">For example: ${esc(exAns)}</p>` : ''}
      ${stepErr ? `<p class="err" role="alert">${esc(stepErr)}</p>` : ''}
    </div>
    <div class="step-nav">
      ${step>0 ? `<button class="btn ghost" type="button" data-act="back">Back</button>` : `<button class="btn text" type="button" data-act="cancelTrace">Cancel</button>`}
      ${last ? `<button class="btn gold" type="button" data-act="saveTrace">${editingId?'Save changes':'Seal the covenant'}</button>` : `<button class="btn" type="button" data-act="next">Next</button>`}
    </div>
  </section>`;
}

function renderQuestion(){
  const p = inq && realPatterns().find(x => x.id === inq.pid);
  if (!p) return `<section class="empty"><h3>Choose a belief to question.</h3><a class="btn" href="#patterns">Go to my patterns</a></section>`;
  const S = QSTEPS[inq.step], d = inq.data;
  let prog = ''; for (let i = 0; i < QSTEPS.length; i++) prog += `<span class="${i<inq.step?'done':i===inq.step?'here':''}"></span>`;
  const ta = (k, label, ph) => `<div><label class="lbl" for="q-${k}">${label}</label><textarea id="q-${k}" data-bind="inq" data-k="${k}" placeholder="${esc(ph)}">${esc(d[k]||'')}</textarea></div>`;
  const yn = (k, opts) => `<div class="yn" role="group">${opts.map(o => `<button type="button" class="choice" data-act="inqPick" data-k="${k}" data-v="${o}" aria-pressed="${d[k]===o}">${o}</button>`).join('')}</div>`;
  let body = '';
  switch (inq.step){
    case 0: body = `<div class="stack-sm"><span class="rangeval" id="rv-before">${d.before}%</span><input type="range" min="0" max="100" step="5" id="q-before" data-bind="inqRange" data-k="before" value="${d.before}" aria-label="How true it feels"></div>`; break;
    case 1: body = `<div><span class="lbl">Is it true?</span>${yn('isTrue',['Yes','No','Not sure'])}</div><div><span class="lbl">Can you know it for certain?</span>${yn('certain',['Yes','No','Not sure'])}</div>`; break;
    case 2: body = `<div class="two">${ta('forEv','What supports it','Facts, not feelings')}${ta('againstEv','What doesn’t','Times it wasn’t true')}</div>`; break;
    case 3: body = ta('react','When I believe it','My body tightens, I…'); break;
    case 4: body = ta('without','Without this thought, I would','…'); break;
    case 5: body = ta('turn','The turnaround','e.g. If I finish it, I can be judged, and I can survive that.') + ta('examples','Three real examples','1.\n2.\n3.'); break;
    case 6: body = `<div class="stack-sm"><span class="rangeval" id="rv-after">${d.after}%</span><input type="range" min="0" max="100" step="5" id="q-after" data-bind="inqRange" data-k="after" value="${d.after}" aria-label="How true it feels now"></div><p class="small muted">Before, it felt ${d.before}% true.</p>`; break;
  }
  const last = inq.step === QSTEPS.length-1;
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Question the belief · Step ${inq.step+1} of ${QSTEPS.length} · ${S.title}</p><div class="progress" style="--n:${QSTEPS.length}">${prog}</div></div>
    <p class="quote">“${esc(p.belief)}”</p>
    <div class="stack"><h2 class="q">${S.q}</h2><p class="hint">${S.hint}</p>${body}</div>
    <div class="step-nav">
      ${inq.step>0 ? `<button class="btn ghost" type="button" data-act="inqBack">Back</button>` : `<button class="btn text" type="button" data-act="inqCancel">Cancel</button>`}
      ${last ? `<button class="btn gold" type="button" data-act="inqSave">Keep this inquiry</button>` : `<button class="btn" type="button" data-act="inqNext">Next</button>`}
    </div>
    <p class="muted small">This inquiry combines the evidence check used in CBT thought records with the four questions and turnaround of self-inquiry.</p>
  </section>`;
}

function renderJourney(){
  const ex = showingExample();
  const list = ex ? [EXAMPLE] : realPatterns();
  const pts = [[48,150],[170,96],[292,124],[414,142],[548,86],[676,58]];
  const counts = [0,0,0,0,0,0]; const byStage = [[],[],[],[],[],[]];
  list.forEach(p => { const s = stageOf(p); counts[s]++; byStage[s].push(p); });
  let marks = '';
  byStage.forEach((ps, s) => {
    ps.slice(0,3).forEach((p, i) => {
      marks += `<circle class="mk${p.example?' ex':''}" cx="${pts[s][0]+26}" cy="${pts[s][1]-8-i*13}" r="5"><title>${esc(p.name)}</title></circle>`;
    });
    if (ps.length > 3) marks += `<text class="cnt" x="${pts[s][0]+34}" y="${pts[s][1]-44}">+${ps.length-3}</text>`;
  });
  let stars = ''; for (let i = 0; i < 40; i++){ stars += `<circle class="star" cx="${(i*97)%760-28}" cy="${(i*53)%60+4}" r="${(i%3)*.4+.6}"/>`; }
  const labels = STAGES.map((s,i) => `<svg class="sym" x="${pts[i][0]-15}" y="${pts[i][1]-48}" width="30" height="30" viewBox="0 0 48 48"><use href="#e-${s.emb}"/></svg>
    <circle class="st${i===5?' final':''}" cx="${pts[i][0]}" cy="${pts[i][1]}" r="6"/>
    <text class="lbl" x="${pts[i][0]}" y="${pts[i][1]+24}" text-anchor="middle">${s.name}</text>
    <text class="sub" x="${pts[i][0]}" y="${pts[i][1]+38}" text-anchor="middle">${s.sub}</text>`).join('');
  const svg = `<svg viewBox="-28 0 776 200" role="img" aria-label="Map of the journey from the narrow place to the promised land, with your patterns placed at each stage">
    ${stars}
    <path class="strait" d="M14 132 Q34 140 60 146"/><path class="strait" d="M14 168 Q34 160 60 154"/>
    <path class="road" d="M48 150 C100 150 120 96 170 96 S246 124 292 124 S370 142 414 142 S500 86 548 86 S632 58 676 58"/>
    <path class="water" d="M604 40 q5 8 0 16 q-5 8 0 16 q5 8 0 16 q-5 8 0 16"/>
    <path class="water" d="M614 40 q5 8 0 16 q-5 8 0 16 q5 8 0 16 q-5 8 0 16"/>
    ${labels}${marks}</svg>`;

  const urges = ex ? EXAMPLE.urges : state.urges;
  const rode = urges.filter(u => u.outcome === 'rode').length;
  const tcount = {};
  urges.forEach(u => { const t = (u.trigger||'').trim(); if (!t) return; const key = t.toLowerCase(); tcount[key] = tcount[key] || {label:t, n:0}; tcount[key].n++; });
  const topT = Object.values(tcount).sort((a,b)=>b.n-a.n).slice(0,3);
  const tod = [['Morning',0],['Afternoon',0],['Evening',0],['Night',0]];
  urges.forEach(u => { const h = u.hour; const i = h>=5&&h<12?0:h>=12&&h<17?1:h>=17&&h<22?2:3; tod[i][1]++; });
  const dow = DOW.map(d => [d,0]);
  if (ex){ EXAMPLE.urges.filter(u=>u.outcome==='won').forEach(u => dow[u.dow][1]++); dow[3][1]+=1; }
  else { for (const k in state.checks) for (const id in state.checks[k]) if (state.checks[k][id]==='slipped') dow[fromKey(k).getDay()][1]++; }
  const dowMon = dow.slice(1).concat([dow[0]]);
  const anySlips = dowMon.some(d => d[1] > 0);
  const rootCounts = {}; list.forEach(p => { if (p.rootType) rootCounts[p.rootType] = (rootCounts[p.rootType]||0) + 1; });
  const today = new Date();
  const grids = list.filter(p => !p.released).map(p => {
    let cells = '';
    for (let i = 39; i >= 0; i--){
      let v = '';
      if (p.example){ const c = p.grid[39-i]; v = c==='h'?'held':c==='n'?'noticed':c==='s'?'slipped':''; }
      else v = checkOf(dkey(addDays(today,-i)), p.id) || '';
      cells += `<i class="${v}${i===0?' today':''}" title="${fmtShort(addDays(today,-i))}${v?': '+v:''}"></i>`;
    }
    return `<div class="gridrow"><div class="row">${p.example?'<span class="chip example">Example</span>':''}<h3>${esc(p.name)}</h3></div><div class="grid40" aria-label="Last 40 days for ${esc(p.name)}">${cells}</div></div>`;
  }).join('');
  const totalHeld = list.reduce((a,p)=>a+stats(p).held,0);

  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Journey</p><h2>From the narrow place to the promised land</h2></div>
    ${!ex ? `<div class="ppf">
      <a href="#patterns"><svg class="emb" aria-hidden="true"><use href="#e-narrow"/></svg><b>Past</b><span>${realPatterns().length} pattern${realPatterns().length===1?'':'s'} traced to the root</span></a>
      <a href="#today"><svg class="emb" aria-hidden="true"><use href="#e-tent"/></svg><b>Present</b><span>${list.reduce((a,p)=>a+stats(p).held,0)} days held</span></a>
      <a href="#future" class="now"><svg class="emb" aria-hidden="true"><use href="#e-sunrise"/></svg><b>Future</b><span>${state.year ? `Week ${yearWeek()} of 52: ${esc(state.year.goal)}` : 'Your Sovereign Year is waiting'}</span></a>
    </div>` : ''}
    ${ex?'<p class="muted small"><span class="chip example">Example</span> These figures show the example pattern until you trace your own.</p>':''}
    <div class="pathbox">${svg}</div>
    <div class="stats">
      <div class="stat"><b>${totalHeld}</b><span>Days held</span></div>
      <div class="stat"><b>${rode}<span class="muted" style="font-size:1rem"> / ${urges.length}</span></b><span>Urges ridden out</span></div>
      <div class="stat"><b>${list.filter(p=>p.released).length}</b><span>Released</span></div>
    </div>
    ${mirrorOn() && !ex ? `<div class="insight">
      <div class="section-head"><p class="eyebrow">The Mirror reads your week</p><button class="btn ghost small" type="button" data-act="week"${weekBusy?' disabled':''}>${weekRead?'Read it again':'Read my week'}</button></div>
      ${weekBusy?'<p class="muted">Reading your week… this can take up to a minute.</p>':''}
      ${weekErr?`<p class="err">${esc(weekErr)}</p>`:''}
      ${weekRead && !weekBusy ? `<div class="mirror">
        ${weekRead.theme?`<span class="k">The thread this week</span><p>${esc(weekRead.theme)}</p>`:''}
        ${weekRead.held?`<span class="k">Where you held</span><p>${esc(weekRead.held)}</p>`:''}
        ${weekRead.watch?`<span class="k">What to watch</span><p>${esc(weekRead.watch)}</p>`:''}
        ${weekRead.question?`<span class="k">A question for the week ahead</span><p><em>${esc(weekRead.question)}</em></p>`:''}
      </div>` : ''}
    </div>` : ''}
    <div class="insight">
      <p class="eyebrow">What sets it off</p>
      ${topT.length ? `<ol class="toplist">${topT.map(t => `<li>${esc(t.label)} <span class="muted small">· ${t.n} time${t.n>1?'s':''}</span></li>`).join('')}</ol>` : '<p class="muted small">Log an urge with “The pull is here” and your triggers will gather here.</p>'}
      <p class="lbl" style="margin:8px 0 0">When the pull comes</p>
      ${bars(tod, true)}
      <p class="lbl" style="margin:8px 0 0">Slips by day of the week</p>
      ${anySlips ? bars(dowMon, true) : '<p class="muted small">No slips logged yet.</p>'}
    </div>
    <ol class="stagelist">${STAGES.map((s,i)=>`<li>${emb(s.emb)}<b>${s.name}</b><span class="muted small">${s.desc}</span><span class="meta">${counts[i]} pattern${counts[i]===1?'':'s'}</span></li>`).join('')}</ol>
    <div class="etym">
      <span class="heb" lang="he">מִצְרַיִם</span>
      <span class="t">Mitzrayim · Egypt</span>
      <span class="muted small">Read in Hebrew tradition through <em>tsar</em>, “narrow, constricted”: Egypt as the narrow place. Every pattern is a narrow place you learned to live in. Israel walked out of it and spent forty years in the wilderness, learning to live free. Here, forty held days mark the same passage.</span>
    </div>
    <div class="stack"><p class="eyebrow">The last forty days</p>
      <div class="legend"><span><i class="held"></i>Held</span><span><i class="noticed"></i>Noticed</span><span><i class="slipped"></i>Slipped</span><span><i></i>No check-in</span></div>
      ${grids || '<p class="muted">No patterns in the wilderness right now.</p>'}
    </div>
    <div class="stack"><p class="eyebrow">Where your patterns come from</p>${bars(Object.entries(ROOTS).map(([k,r]) => [r.label, rootCounts[k]||0]))}
      <p class="muted small">When one root keeps appearing, the work is often with that root, not each branch.</p></div>
  </section>`;
}

/* ---------- Future: the Sovereign Year ---------- */
/* Past is traced, present is held, future is built: one goal, 52 weekly steps, four seasons. */
const SEASONS = [
  {name:'Seedtime', from:1,  to:13, emb:'sprout', line:'Plant the first seeds. Small, steady, every week.'},
  {name:'Rain',     from:14, to:26, emb:'waters', line:'Keep watering through the dry weeks. This is where most people stop.'},
  {name:'Harvest',  from:27, to:39, emb:'palm',   line:'Gather what is growing, and let it be seen.'},
  {name:'Sabbath',  from:40, to:52, emb:'lamp',   line:'Finish well, rest, and give thanks for the year.'}
];
const YSTEPS = [
  {title:'Who you are becoming', q:'Who are you becoming this year?', hint:'Carry forward an “I am someone who…” from a pattern you’ve traced, or write a new one. The whole year is built for this person.'},
  {title:'One goal', q:'What is the one thing you will build in the next 52 weeks?', hint:'One goal, not five. Make it something you’ll clearly know you’ve done: “Publish my book”, not “write more”.'},
  {title:'Why it matters', q:'Why does this matter, and what are you walking out of to get there?', hint:'The future grows from the past. Link it to a pattern you’re leaving behind, if one fits.'},
  {title:'Four seasons', q:'What will be true at the end of each season?', hint:'A milestone every 13 weeks. Rough is fine; you can change these later.'},
  {title:'Week one', q:'Write a letter from your future self, and choose this week’s first step.', hint:'Your future self has already done it. What do they want you to know? Then name one step small enough to finish in the next seven days.'}
];
const yearWeek = () => { const y = state.year; if (!y) return 0; const days = Math.floor((fromKey(todayKey()) - fromKey(y.start)) / 86400000); return Math.min(52, Math.max(1, Math.floor(days / 7) + 1)); };
const seasonOf = w => SEASONS.findIndex(s => w >= s.from && w <= s.to);
const weekRec = n => (state.year.weeks[n] || (state.year.weeks[n] = {}));
const weekStart = n => addDays(fromKey(state.year.start), (n - 1) * 7);
const isSunday = () => new Date().getDay() === 0;
function yearDone(){ return state.year ? Object.values(state.year.weeks).filter(w => w.done === 'yes').length : 0; }

let ydraft = null, ystep = 0, yErr = '', yearBusy = false, yearMirrorErr = '', yearMirror = null, reviewOpen = false, yearEndArmed = false, blockedPrompt = null;

function blankYear(){ return {identity:'', goal:'', why:'', fromPattern:'', seasons:['','','',''], letter:'', firstStep:''}; }

function ring52(done, current){
  let s = '';
  for (let i = 0; i < 52; i++){
    const a = (i/52) * Math.PI*2 - Math.PI/2, r1 = 25, on = i < done, here = i === current - 1;
    const r2 = on ? 33 : here ? 34 : 31;
    s += `<line class="tk${on?' on':''}${here?' here':''}" x1="${(38+Math.cos(a)*r1).toFixed(2)}" y1="${(38+Math.sin(a)*r1).toFixed(2)}" x2="${(38+Math.cos(a)*r2).toFixed(2)}" y2="${(38+Math.sin(a)*r2).toFixed(2)}"/>`;
  }
  return `<svg class="ring ring52" viewBox="0 0 76 76" role="img" aria-label="Week ${current} of 52">${s}<text x="38" y="44" text-anchor="middle">${current}</text></svg>`;
}

function renderYearSetup(){
  if (!ydraft) ydraft = blankYear();
  const d = ydraft, S = YSTEPS[ystep];
  let prog = ''; for (let i = 0; i < YSTEPS.length; i++) prog += `<span class="${i<ystep?'done':i===ystep?'here':''}"></span>`;
  const ids = [...new Set(realPatterns().map(p => (p.identity||'').trim()).filter(Boolean))];
  let body = '';
  if (ystep === 0) body = `${ids.length ? `<div class="row">${ids.map(t => `<button type="button" class="pick" data-act="yPickId" data-v="${esc(t)}">I am someone who ${esc(t)}</button>`).join('')}</div>` : ''}
    <div><label class="lbl" for="y-identity">I am someone who</label><input type="text" id="y-identity" data-bind="ydraft" data-k="identity" placeholder="e.g. finishes what I start" value="${esc(d.identity)}"></div>`;
  if (ystep === 1) body = `<div><label class="lbl" for="y-goal">My goal for the next 52 weeks</label><input type="text" id="y-goal" data-bind="ydraft" data-k="goal" placeholder="e.g. Publish my first book" value="${esc(d.goal)}"></div>`;
  if (ystep === 2) body = `<div><label class="lbl" for="y-why">Why it matters</label><textarea id="y-why" data-bind="ydraft" data-k="why" placeholder="Who benefits? What changes when it’s done?">${esc(d.why)}</textarea></div>
    ${realPatterns().length ? `<div><span class="lbl">It grows from walking out of</span><div class="row">${realPatterns().map(p => `<button type="button" class="pick${d.fromPattern===p.id?' on':''}" data-act="yPickPattern" data-v="${esc(p.id)}" aria-pressed="${d.fromPattern===p.id}">${esc(p.name)}</button>`).join('')}</div></div>` : ''}`;
  if (ystep === 3) body = SEASONS.map((s, i) => `<div><label class="lbl" for="y-s${i}">${s.name} · by week ${s.to}</label><input type="text" id="y-s${i}" data-bind="yseason" data-i="${i}" placeholder="${['e.g. First three chapters drafted','e.g. Full first draft finished','e.g. Edited and cover designed','e.g. Published and launched'][i]}" value="${esc(d.seasons[i])}"></div>`).join('');
  if (ystep === 4) body = `<div><label class="lbl" for="y-letter">A letter from your future self (optional)</label><textarea id="y-letter" data-bind="ydraft" data-k="letter" placeholder="Dear me, a year ago today…">${esc(d.letter)}</textarea></div>
    <div><label class="lbl" for="y-first">This week’s first step</label><input type="text" id="y-first" data-bind="ydraft" data-k="firstStep" placeholder="One thing you can finish in seven days" value="${esc(d.firstStep)}"></div>`;
  const last = ystep === YSTEPS.length - 1;
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">${state.year ? 'Editing your' : 'Begin your'} Sovereign Year · Step ${ystep+1} of ${YSTEPS.length} · ${S.title}</p><div class="progress" style="--n:${YSTEPS.length}">${prog}</div></div>
    <div class="stack"><h2 class="q">${S.q}</h2><p class="hint">${S.hint}</p>${body}${yErr?`<p class="err" role="alert">${esc(yErr)}</p>`:''}</div>
    <div class="step-nav">
      ${ystep>0 ? `<button class="btn ghost" type="button" data-act="yBack">Back</button>` : `<button class="btn text" type="button" data-act="yCancel">Cancel</button>`}
      ${last ? `<button class="btn gold" type="button" data-act="ySave">${state.year ? 'Save changes' : 'Begin my Sovereign Year'}</button>` : `<button class="btn" type="button" data-act="yNext">Next</button>`}
    </div>
  </section>`;
}

function renderFuture(){
  const y = state.year;
  if (!y){
    return `<section class="stack-lg">
      <div class="stack-sm"><p class="eyebrow">Future</p><h2>Build on the ground you’ve cleared</h2></div>
      <div class="ppf">
        <div><svg class="emb" aria-hidden="true"><use href="#e-narrow"/></svg><b>Past</b><span>Where it came from. You trace it.</span></div>
        <div><svg class="emb" aria-hidden="true"><use href="#e-tent"/></svg><b>Present</b><span>What you do today. You hold it.</span></div>
        <div class="now"><svg class="emb" aria-hidden="true"><use href="#e-sunrise"/></svg><b>Future</b><span>Who you are building. You plan it.</span></div>
      </div>
      <p>Walking out of a pattern leaves space. Your <b>Sovereign Year</b> fills it on purpose: one goal, built over 52 weeks, one small step a week, with a review every Sunday and four seasons to mark the way.</p>
      <div class="row"><a class="btn gold" href="#yearsetup" data-act="yStart">Begin my Sovereign Year</a></div>
      <p class="muted small">It takes about five minutes to set up. You can change everything later.</p>
    </section>`;
  }
  const n = yearWeek(), si = Math.max(0, seasonOf(n)), S = SEASONS[si];
  const cur = weekRec(n), done = yearDone();
  if (yr.week !== n) yr = Object.assign({week:n, how:cur.done || ''}, clone(cur.review || {}), {next:(y.weeks[n+1]||{}).step || ''});
  const finished = n === 52 && cur.review;
  const blocked = realPatterns().filter(p => !p.released);
  let grid = '';
  for (let i = 1; i <= 52; i++){
    const w = y.weeks[i] || {}; const cls = w.done === 'yes' ? 'held' : w.done === 'partly' ? 'noticed' : (w.done === 'no' || (i < n && !w.done)) ? 'slipped' : '';
    grid += `<i class="${cls}${i===n?' today':''}${i%13===0?' edge':''}" title="Week ${i} · ${fmtShort(weekStart(i))}${w.step?': '+esc(w.step):''}"></i>`;
  }
  const rv = cur.review;
  const review = rv && !reviewOpen ? `<div class="panel">
      <div class="row">${emb('seal')}<p class="eyebrow">Week ${n} reviewed</p></div>
      <p>${rv.how==='yes'?'You did this week’s step.':rv.how==='partly'?'You did part of this week’s step.':'This week’s step didn’t happen, and you told the truth about it.'}</p>
      ${n < 52 ? `<p>Next week’s step: <b>${esc((y.weeks[n+1]||{}).step||'')}</b></p>` : ''}
      <button class="btn text" type="button" data-act="yReviewOpen" style="align-self:flex-start">Edit this review</button>
    </div>` : `<div class="panel${isSunday()?' sunday':''}">
      <div class="row">${emb('lamp')}<div class="stack-sm" style="gap:2px"><p class="eyebrow">Sunday review · week ${n}</p><p class="muted small">${isSunday()?'It’s Sunday. Close the week and set the next step.':'Best done on Sunday evening, but any day is fine.'}</p></div></div>
      <div><span class="lbl">How did this week’s step go?</span><div class="yn" role="group">${[['yes','Done'],['partly','Partly'],['no','Not this week']].map(([v,l]) => `<button type="button" class="choice" data-act="yHow" data-v="${v}" aria-pressed="${(yr.how||'')===v}">${l}</button>`).join('')}</div></div>
      <div class="two"><div><label class="lbl" for="yr-helped">What helped</label><textarea id="yr-helped" data-bind="yr" data-k="helped" placeholder="People, times, habits that made it easier">${esc(yr.helped||'')}</textarea></div>
      <div><label class="lbl" for="yr-blocked">What got in the way</label><textarea id="yr-blocked" data-bind="yr" data-k="blocked" placeholder="Be honest; this is where the patterns show up">${esc(yr.blocked||'')}</textarea></div></div>
      ${blocked.length ? `<div><span class="lbl">Was it an old pattern?</span><div class="row">${blocked.map(p => `<button type="button" class="pick${yr.pid===p.id?' on':''}" data-act="yPid" data-v="${esc(p.id)}" aria-pressed="${yr.pid===p.id}">${esc(p.name)}</button>`).join('')}<button type="button" class="pick${yr.pid==='none'?' on':''}" data-act="yPid" data-v="none" aria-pressed="${yr.pid==='none'}">No, something else</button></div></div>` : ''}
      ${n < 52 ? `<div><label class="lbl" for="yr-next">Next week’s step</label><input type="text" id="yr-next" data-bind="yr" data-k="next" placeholder="One thing you can finish in seven days" value="${esc(yr.next||'')}">
        ${mirrorOn() ? `<button class="btn text" type="button" data-act="yMirror"${yearBusy?' disabled':''}>${yearBusy?'The Mirror is thinking…':'Ask the Mirror to suggest a step'}</button>` : ''}
        ${yearMirror ? `<p class="small muted"><em>${esc(yearMirror.why||'')}</em></p>` : ''}${yearMirrorErr?`<p class="err">${esc(yearMirrorErr)}</p>`:''}</div>` : ''}
      ${yErr?`<p class="err" role="alert">${esc(yErr)}</p>`:''}
      <div><button class="btn gold" type="button" data-act="yReviewSave">Close the week</button></div>
    </div>`;
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Future · your Sovereign Year</p><h2>${esc(y.goal)}</h2></div>
    <div class="rank year">
      <div class="ringwrap">${ring52(done, n)}<span class="ringcap" style="color:var(--sky-soft)">week of 52</span></div>
      <div class="stack-sm">
        <p class="eyebrow">${S.name} · weeks ${S.from}–${S.to}</p>
        <p class="identity" style="color:var(--crack)">I am someone who ${esc(y.identity)}</p>
        <p class="muted small">${done} of 52 weekly steps done · began ${fmtLong(fromKey(y.start))}</p>
        ${y.fromPattern && realPatterns().find(p=>p.id===y.fromPattern) ? `<p class="muted small">Growing from walking out of: <b style="color:var(--sky-ink)">${esc(realPatterns().find(p=>p.id===y.fromPattern).name)}</b></p>` : ''}
      </div>
    </div>
    ${finished ? `<div class="empty">${emb('crown')}<h3>Your Sovereign Year is complete.</h3><p class="muted">Read your letter again. Then, when you’re ready, begin the next one.</p><button class="btn gold" type="button" data-act="yNewYear">Begin a new year</button></div>` : `
    <div class="dare">
      <div class="row"><span class="emb-badge">${emb('sprout')}</span><div class="stack-sm" style="gap:2px"><p class="eyebrow">This week’s step · week ${n}</p><p class="muted small">${fmtShort(weekStart(n))} to ${fmtShort(addDays(weekStart(n),6))} · +10 manna when done</p></div></div>
      ${cur.step ? `<p class="text">${esc(cur.step)}</p>` : `<div><label class="lbl" for="y-step">Set this week’s step</label><input type="text" id="y-step" data-bind="ystepnow" placeholder="One thing you can finish in seven days" value="${esc(stepNow)}"></div><div><button class="btn small" type="button" data-act="ySetStep">Set my step</button></div>`}
      ${cur.step ? `<div class="row">${cur.done==='yes' ? '<span class="ok">Done. Well built.</span><button class="btn text" type="button" data-act="yStepUndo">Undo</button>'
        : cur.done==='partly' ? '<span class="muted small">Partly done.</span><button class="btn gold small" type="button" data-act="yStepDone">I finished it</button>'
        : '<button class="btn gold" type="button" data-act="yStepDone">I did it</button>'}</div>` : ''}
    </div>`}
    ${blockedPrompt ? `<p class="notice"><b>The past showed up in the present.</b> ${esc(blockedPrompt.name)} got in the way this week. <a href="#question" data-act="inqStart" data-id="${esc(blockedPrompt.id)}">Question the belief behind it</a>, or check in on it under Today.</p>` : ''}
    ${review}
    <div class="stack"><p class="eyebrow">Four seasons</p>
      <div class="seasons">${SEASONS.map((s, i) => { const hit = (y.milestones||{})[i]; return `<div class="season${i===si?' now':''}${hit?' hit':''}">
        <svg class="emb" aria-hidden="true"><use href="#e-${s.emb}"/></svg>
        <b>${s.name}</b><span class="muted small">Weeks ${s.from}–${s.to}</span>
        <p class="small">${esc(y.seasons[i] || 'No milestone set')}</p>
        ${y.seasons[i] ? (hit ? `<span class="ok small">Reached ${fmtShort(fromKey(hit))}</span>` : `<button class="btn text small" type="button" data-act="yMilestone" data-i="${i}">Mark reached</button>`) : ''}
      </div>`; }).join('')}</div>
    </div>
    <div class="stack"><p class="eyebrow">The 52 weeks</p>
      <div class="legend"><span><i class="held"></i>Done</span><span><i class="noticed"></i>Partly</span><span><i class="slipped"></i>Missed</span><span><i></i>Ahead</span></div>
      <div class="grid52" aria-label="Your 52 weeks">${grid}</div>
    </div>
    ${y.why ? `<div class="stack-sm"><p class="eyebrow">Why it matters</p><p>${esc(y.why)}</p></div>` : ''}
    ${y.letter ? `<details class="letterbox"><summary>Read the letter from your future self</summary><p>${esc(y.letter).replace(/\n/g,'<br>')}</p></details>` : ''}
    <div class="pat-actions">
      <button class="btn ghost small" type="button" data-act="yEdit">Edit my year</button>
      ${yearEndArmed ? `<span class="confirm">End this year and start again? Your weeks will be cleared.<button class="btn danger small" type="button" data-act="yEnd">End it</button><button class="btn text" type="button" data-act="yEndNo">Keep going</button></span>` : `<button class="btn text" type="button" data-act="yEndArm">End this year</button>`}
    </div>
  </section>`;
}
let yr = {}, stepNow = '';

function weekSummary(){
  const ex = showingExample();
  const list = ex ? [EXAMPLE] : realPatterns().filter(p => !p.released);
  const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(new Date(), -i));
  const dset = new Set(days.map(dkey));
  const name = (state.witness.name||'').trim() || 'my witness';
  const L = [];
  if (ex) L.push('(Example — this fills in from your own check-ins)', '');
  L.push(`Weekly check-in for ${name}`, `The Crossing · ${fmtShort(days[0])} to ${fmtShort(days[6])}`, '');
  for (const p of list){
    let h=0,n=0,s=0;
    days.forEach((d, i) => { let v;
      if (p.example){ const c = p.grid[33+i]; v = c==='h'?'held':c==='n'?'noticed':c==='s'?'slipped':''; }
      else v = checkOf(dkey(d), p.id);
      if (v==='held') h++; else if (v==='noticed') n++; else if (v==='slipped') s++; });
    const ur = p.example ? p.urges : state.urges.filter(u => u.pid === p.id && dset.has(u.date));
    L.push(`• ${p.name}: held ${h} of 7 days, noticed ${n}, slipped ${s}. ${Math.min(stats(p).held,40)} of 40 days held so far (hold strength ${strength(p)}%).`);
    if (ur.length) L.push(`  Urges this week: ${ur.length}, ridden out ${ur.filter(u=>u.outcome==='rode').length}.`);
    if (p.truth) L.push(`  The truth I’m choosing: ${p.truth}`);
  }
  if (!ex){
    const slips = [];
    days.forEach(d => { const m = state.slips[dkey(d)]; if (!m) return;
      for (const id in m){ const p = realPatterns().find(x => x.id === id); if (p && m[id] && m[id].trim()) slips.push(`  – ${fmtShort(d)} (${p.name}): ${m[id].trim()}`); } });
    if (slips.length) L.push('', 'Where I slipped, and what came just before:', ...slips);
    const q = state.quest; if (q.start && !q.complete) L.push('', `Seven Days Out trial: ${TRIAL.filter((t,i)=>q.done[i]).length} of 7 quests sealed.`);
    if (state.year){ const n = yearWeek(), w = state.year.weeks[n] || {}; L.push('', `Sovereign Year: ${state.year.goal}. Week ${n} of 52 (${yearDone()} steps done).`, `  This week\u2019s step: ${w.step || 'not set yet'}${w.done==='yes' ? ' (done)' : ''}`); }
    L.push(`Rank: ${RANKS[rankOf(manna())].n} (${manna()} manna).`);
  }
  if ((state.witness.next||'').trim()) L.push('', `Next week I commit to: ${state.witness.next.trim()}`);
  if ((state.witness.stake||'').trim()) L.push(`If I don’t send you my check-in, I will: ${state.witness.stake.trim()}`);
  L.push('', 'Please ask me how it went next time we speak.');
  return L.join('\n');
}

function renderReminder(){
  let body;
  if (rem && rem.on){
    body = `<p>Reminders are on: every <b>${rem.slot==='evening'?'evening, around 8pm':'morning, around 7:30am'}</b>, to <b>${esc(rem.email)}</b>.</p>
      <div class="row"><button class="btn ghost small" type="button" data-act="remEdit">Change</button><button class="btn text" type="button" data-act="remStop"${remBusy?' disabled':''}>Stop reminders</button></div>`;
  } else {
    body = `<div><label class="lbl" for="remEmail">Your email</label><input type="email" id="remEmail" data-bind="remEmail" autocomplete="email" placeholder="you@example.com" value="${esc(remDraft)}"></div>
      <div><span class="lbl">When</span><div class="seg" role="group" aria-label="Reminder time">${[['morning','Morning · 7:30am'],['evening','Evening · 8pm']].map(([v,l])=>`<button type="button" data-act="remSlot" data-v="${v}" aria-pressed="${remSlot===v}">${l}</button>`).join('')}</div></div>
      <label class="check"><input type="checkbox" id="remConsent" data-bind="remConsent"${remConsent?' checked':''}> <span>${esc(CONSENT)}</span></label>
      <div><button class="btn gold" type="button" data-act="remSave"${remBusy?' disabled':''}>Send me reminders</button></div>`;
  }
  return `<div class="panel">
    <div class="row">${emb('lamp')}<div class="stack-sm" style="gap:2px"><p class="eyebrow">Daily reminder by email</p><p class="muted small">A short nudge to check in, from Indigo Estate.</p></div></div>
    ${body}
    ${remErr?`<p class="err" role="alert">${esc(remErr)}</p>`:''}${remMsg?`<p class="ok">${esc(remMsg)}</p>`:''}
  </div>`;
}
function renderAccount(){
  return `<div class="panel">
    <p class="eyebrow">Your account</p>
    <p>Signed in as <b>${esc(api.email || '')}</b>. Your journal is private: it is stored in your own account, and nobody at Indigo Estate reads it.</p>
    <div class="row"><button class="btn ghost small" type="button" data-act="export">Download my journal</button><button class="btn ghost small" type="button" data-act="signOut">Sign out</button></div>
    ${delArmed ? `<div class="confirm"><span>Delete your account, journal and reminders for good? This can’t be undone.</span><button class="btn danger small" type="button" data-act="delAccount"${delBusy?' disabled':''}>${delBusy?'Deleting…':'Delete everything'}</button><button class="btn text" type="button" data-act="delCancel">Keep my account</button></div>`
      : `<button class="btn text" type="button" data-act="delArm" style="align-self:flex-start">Delete my account</button>`}
  </div>`;
}
function renderWitness(){
  const w = state.witness;
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Witness</p><h2>Walk out with someone watching</h2></div>
    <p class="muted">Choose one person who will ask, not fix. Send them your check-in on a set rhythm. A private intention becomes a covenant once someone else has heard it.</p>
    <div class="stack">
      <div><label class="lbl" for="wName">My witness</label><input type="text" id="wName" data-bind="wName" placeholder="Their name" value="${esc(w.name)}"></div>
      <div><span class="lbl">I’ll send my check-in</span><div class="seg" role="group" aria-label="Check-in rhythm">${['daily','weekly'].map(r=>`<button type="button" data-act="rhythm" data-v="${r}" aria-pressed="${w.rhythm===r}">${r==='daily'?'Every day':'Every week'}</button>`).join('')}</div></div>
      <div><label class="lbl" for="wNext">${w.rhythm==='daily'?'Tomorrow':'Next week'} I commit to</label><textarea id="wNext" data-bind="wNext" placeholder="One clear promise your witness can check.">${esc(w.next)}</textarea></div>
      <div><label class="lbl" for="wStake">If I don’t send my check-in, I will</label><input type="text" id="wStake" data-bind="wStake" placeholder="e.g. give £10 to a cause my witness picks" value="${esc(w.stake)}">
        <p class="muted small" style="margin-top:6px">Optional. A small stake you’ve promised out loud makes it harder to drift quietly. Your witness holds you to it; the app doesn’t take any money.</p></div>
    </div>
    <div class="letter">
      <div class="section-head"><p class="eyebrow">This week’s check-in</p><button class="btn" type="button" data-act="copy">Copy to send</button></div>
      <pre id="summary">${esc(weekSummary())}</pre>
      <p class="muted small">Paste it into a message, WhatsApp or email to your witness.</p>
    </div>
    ${renderReminder()}
    ${renderAccount()}
  </section>`;
}

function render(){
  syncQuest();
  const v = view();
  const tab = v === 'question' || v === 'trace' ? 'patterns' : v === 'yearsetup' ? 'future' : v;
  document.querySelectorAll('.tabs a').forEach(a => { if (a.dataset.v === tab) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  const fn = {today:renderToday, quest:renderQuest, patterns:renderPatterns, trace:renderTrace, journey:renderJourney, witness:renderWitness, question:renderQuestion, future:renderFuture, yearsetup:renderYearSetup}[v];
  $('#main').innerHTML = fn();
  checkRank();
}

/* ---------- The pull is here ---------- */
function renderUrge(){
  const p = urge && realPatterns().find(x => x.id === urge.pid);
  const box = $('#urgeBody');
  if (!p){ $('#urge').hidden = true; return; }
  let h = `<button class="btn text ov-close" type="button" data-act="urgeClose">Close</button>`;
  if (urge.step === 0){
    h += `<p class="eyebrow">The pull is here · ${esc(p.name)}</p>
      <h2 id="urgeTitle">Stop. Breathe first.</h2>
      <div class="breath" aria-hidden="true">Breathe</div>
      <p class="muted">In as the circle grows, out slowly as it shrinks. Three rounds. An urge rises, peaks and passes, usually within minutes. You only have to outlast this one.</p>
      <button class="btn" type="button" data-act="urgeNext">I’ve breathed</button>`;
  } else if (urge.step === 1){
    h += `<p class="eyebrow">Remember why you left</p><h2 id="urgeTitle">This is what it costs.</h2>
      <div class="why">
        ${p.cost?`<div><span class="k">What it costs</span>${esc(p.cost)}</div>`:''}
        ${p.identity?`<div><span class="k">Who I am becoming</span>I am someone who ${esc(p.identity)}</div>`:''}
        ${p.truth?`<div><span class="k">The truth I choose</span><em>${esc(p.truth)}</em></div>`:''}
        ${p.practice?`<div><span class="k">Right now, I will</span>${esc(p.practice)}</div>`:''}
      </div>
      <button class="btn" type="button" data-act="urgeNext">Log this moment</button>`;
  } else {
    const past = [...new Set([p.trigger, ...state.urges.filter(u=>u.pid===p.id).map(u=>u.trigger)].filter(Boolean).map(s=>s.trim()))].slice(0,5);
    h += `<p class="eyebrow">Name it</p><h2 id="urgeTitle">What set it off?</h2>
      <div><label class="lbl" for="u-trigger">The trigger</label><input type="text" id="u-trigger" data-bind="urge" data-k="trigger" placeholder="What just happened?" value="${esc(urge.trigger)}"></div>
      ${past.length?`<div class="row">${past.map(t=>`<button type="button" class="pick" data-act="urgePick" data-v="${esc(t)}">${esc(t.length>40?t.slice(0,40)+'…':t)}</button>`).join('')}</div>`:''}
      <div class="stack-sm"><span class="lbl">How strong is the pull? <span id="u-int">${urge.intensity}</span> of 10</span><input type="range" min="1" max="10" id="u-intensity" data-bind="urgeRange" value="${urge.intensity}" aria-label="Strength of the urge"></div>
      <div class="two"><button class="btn gold" type="button" data-act="urgeSave" data-v="rode">I rode it out</button><button class="btn ghost" type="button" data-act="urgeSave" data-v="won">It won this time</button></div>`;
  }
  box.innerHTML = h;
}

/* ---------- Claude-powered reflections ---------- */
async function askMirror(id){
  const p = realPatterns().find(x => x.id === id); if (!p || !mirrorOn()) return;
  mirrorBusy[id] = true; delete mirrorErr[id]; render();
  const lastInq = (p.inquiries||[]).slice(-1)[0];
  const payload = {name:p.name||'', habit:p.habit||'', trigger:p.trigger||'', belief:p.belief||'', voice:p.voice||'', root:p.rootType?ROOTS[p.rootType].label:'',
    rootStory:p.rootStory||'', payoff:p.payoff||'', cost:p.cost||'', identity:p.identity?'I am someone who '+p.identity:'', truth:p.truth||'', practice:p.practice||'',
    inquiry: lastInq ? `went from ${lastInq.before}% to ${lastInq.after}% true; turnaround: ${lastInq.turn||'-'}` : '',
    triggers: state.urges.filter(u=>u.pid===p.id).slice(-6).map(u=>u.trigger).filter(Boolean).join('; ')};
  try { p.mirror = await api.mirrorPattern(payload); save(); }
  catch(e){ mirrorErr[id] = errText(e, 'The Mirror couldn’t answer just now. Try again.'); }
  mirrorBusy[id] = false; render();
}
async function readWeek(){
  if (!mirrorOn()) return;
  weekBusy = true; weekErr = ''; render();
  const days = []; for (let i = 6; i >= 0; i--) days.push(dkey(addDays(new Date(), -i)));
  const lines = days.map(k => {
    const parts = [];
    realPatterns().filter(p=>!p.released).forEach(p => { const v = checkOf(k,p.id); if (v) parts.push(`${p.name}: ${v}`); });
    const sl = state.slips[k]; if (sl) for (const id in sl){ const p = realPatterns().find(x=>x.id===id); if (p && sl[id]) parts.push(`slip note (${p.name}): ${sl[id]}`); }
    const e = state.examens[k]; if (e){ if (e.free) parts.push('walked free: '+e.free); if (e.pulled) parts.push('pulled: '+e.pulled); if (e.grateful) parts.push('grateful: '+e.grateful); }
    state.urges.filter(u=>u.date===k).forEach(u => parts.push(`urge (${u.intensity}/10, ${u.outcome==='rode'?'ridden out':'it won'}): ${u.trigger||'-'}`));
    return `${k}: ${parts.join(' | ') || 'no entries'}`;
  }).join('\n');
  const pats = realPatterns().filter(p=>!p.released).map(p => `- ${p.name}. Belief: ${p.belief||'-'}. Truth chosen: ${p.truth||'-'}.`).join('\n');
  try { weekRead = await api.mirrorWeek(pats, lines); }
  catch(e){ weekErr = errText(e, 'The Mirror couldn\u2019t answer just now. Try again.'); }
  weekBusy = false; render();
}

function journalText(){
  const L = ['THE CROSSING · my journal', 'Indigo Estate · exported ' + fmtLong(new Date()), `Rank: ${RANKS[rankOf(manna())].n} (${manna()} manna)`, ''];
  realPatterns().forEach(p => {
    const st = stats(p);
    L.push('==== ' + p.name + ' ====', `${STAGES[stageOf(p)].name} · ${st.held} held · ${st.noticed} noticed · ${st.slipped} slipped · hold strength ${strength(p)}%`);
    [['What I do',p.habit],['Trigger',p.trigger],['Belief',p.belief],['The voice',p.voice],['Root',p.rootType?ROOTS[p.rootType].label:''],['First memory',p.rootStory],['What it protected',p.payoff],['What it costs',p.cost],['I am someone who',p.identity],['The truth I choose',p.truth],['When the trigger comes',p.practice]]
      .forEach(([k,v]) => { if (v) L.push(k + ': ' + v); });
    (p.inquiries||[]).forEach(q => { L.push('', `Inquiry ${q.date}: ${q.before}% → ${q.after}%`); [['Is it true',q.isTrue],['Certain',q.certain],['Supports it',q.forEv],['Doesn’t',q.againstEv],['When I believe it',q.react],['Without it',q.without],['Turnaround',q.turn],['Examples',q.examples]].forEach(([k,v]) => { if (v) L.push('  ' + k + ': ' + v); }); });
    if (p.released) L.push('Released on ' + p.releasedAt);
    L.push('');
  });
  if (state.year){ const y = state.year; L.push('==== Sovereign Year ====', `Goal: ${y.goal}`, `I am someone who ${y.identity}`, `Began ${y.start} \u00b7 week ${yearWeek()} of 52`); if (y.why) L.push('Why: ' + y.why); y.seasons.forEach((m, i) => { if (m) L.push(`${SEASONS[i].name}: ${m}${(y.milestones||{})[i] ? ' (reached ' + y.milestones[i] + ')' : ''}`); }); if (y.letter) L.push('Letter from my future self: ' + y.letter);
    Object.keys(y.weeks).map(Number).sort((a,b)=>a-b).forEach(i => { const w = y.weeks[i]; L.push(`Week ${i}: ${w.step||'-'}${w.done?' ['+w.done+']':''}`); if (w.review){ if (w.review.helped) L.push('  Helped: ' + w.review.helped); if (w.review.blocked) L.push('  In the way: ' + w.review.blocked); } }); L.push(''); }
  const keys = new Set([...Object.keys(state.examens), ...Object.keys(state.slips), ...Object.keys(state.intentions), ...state.urges.map(u=>u.date)]);
  [...keys].sort().forEach(k => {
    const part = [];
    if (state.intentions[k]) part.push('Intention: ' + state.intentions[k]);
    const e = state.examens[k] || {};
    if (e.grateful) part.push('Thanks: ' + e.grateful); if (e.free) part.push('Walked free: ' + e.free); if (e.pulled) part.push('Pulled: ' + e.pulled); if (e.tomorrow) part.push('For tomorrow: ' + e.tomorrow);
    const sl = state.slips[k] || {}; for (const id in sl){ const p = realPatterns().find(x=>x.id===id); if (sl[id]) part.push(`Slip (${p?p.name:'pattern'}): ${sl[id]}`); }
    state.urges.filter(u=>u.date===k).forEach(u => { const p = realPatterns().find(x=>x.id===u.pid); part.push(`Urge ${u.time||''} (${p?p.name:'pattern'}, ${u.intensity}/10, ${u.outcome==='rode'?'ridden out':'it won'}): ${u.trigger||''}`); });
    if (part.length) L.push('---- ' + fmtLong(fromKey(k)) + ' ----', ...part, '');
  });
  return L.join('\n');
}

function startTrace(){ draft = blankDraft(); editingId = null; step = 0; stepErr = ''; }
function showRelease(p){
  const r = $('#release');
  $('#relName').textContent = p.name;
  $('#relTruth').textContent = p.truth ? '“' + p.truth + '”' : 'You walked out of the narrow place.';
  r.hidden = false; r.classList.remove('play'); void r.offsetWidth; r.classList.add('play');
}
const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const csvCell = s => /[",\n]/.test(s) ? '"' + String(s).replace(/"/g,'""') + '"' : String(s);

/* ---------- Actions ---------- */
const acts = {
  check(b){
    const k = todayKey(), id = b.dataset.id, v = b.dataset.v;
    const p = realPatterns().find(x => x.id === id); if (!p) return;
    const before = stats(p).held;
    const m = state.checks[k] || (state.checks[k] = {});
    if (m[id] === v) delete m[id]; else m[id] = v;
    if (!Object.keys(m).length) delete state.checks[k];
    save(); render();
    const after = stats(p).held;
    if (after > before){ const s = STONES.find(x => x.d === after); if (s) queueSeal({kicker:`Waymark · day ${s.d}`, name:s.name, line:s.line, emb:s.emb}); }
  },
  pledge(){ const n = new Date(); state.pledges[todayKey()] = pad(n.getHours())+':'+pad(n.getMinutes()); save(); render(); toast('Pledged. One day at a time. +1 manna'); },
  dare(){ state.dares[todayKey()] = true; save(); render(); toast('Dare done. +5 manna'); },
  trialStart(){ state.quest = {start:todayKey(), done:{}, complete:null, trials:state.quest.trials||0}; save(); render(); toast('The trial has begun. Quest one is open.'); },
  trialAbandon(b){ if (b.dataset.sure){ state.quest.start = null; state.quest.done = {}; save(); render(); } else { b.dataset.sure = '1'; b.textContent = 'Tap again to start over'; } },
  questDone(b){ const i = +b.dataset.i; state.quest.done[i] = todayKey(); save(); render(); toast(`Quest sealed: ${TRIAL[i].t}. +10 manna`); },
  urgeOpen(b){ urge = {pid:b.dataset.id, step:0, trigger:'', intensity:5}; $('#urge').hidden = false; renderUrge(); },
  urgeNext(){ urge.step++; renderUrge(); },
  urgeClose(){ urge = null; $('#urge').hidden = true; },
  urgePick(b){ urge.trigger = b.dataset.v; const i = $('#u-trigger'); if (i) i.value = urge.trigger; },
  urgeSave(b){
    const n = new Date(), k = todayKey();
    state.urges.push({id:newId(), pid:urge.pid, date:k, time:pad(n.getHours())+':'+pad(n.getMinutes()), hour:n.getHours(), trigger:urge.trigger.trim(), intensity:urge.intensity, outcome:b.dataset.v});
    if (b.dataset.v === 'won'){ (state.checks[k] || (state.checks[k] = {}))[urge.pid] = 'slipped'; }
    save(); urge = null; $('#urge').hidden = true; render();
    toast(b.dataset.v === 'rode' ? 'You rode it out. That is the wilderness doing its work. +5 manna' : 'Logged as a slip. Tell yourself the truth, then begin again.', 4000);
  },
  newTrace(){ startTrace(); if (view() === 'trace') render(); },
  edit(b){ const p = realPatterns().find(x => x.id === b.dataset.id); if (!p) return;
    draft = Object.assign(blankDraft(), clone(p)); editingId = p.id; step = 0; stepErr = ''; location.hash = 'trace'; },
  goto(b){ const i = +b.dataset.i; if (i > 0 && !draft.name.trim()){ stepErr = 'Give the pattern a short name first.'; step = 0; } else { stepErr=''; step = i; } render(); },
  next(){ if (step === 0 && !draft.name.trim()){ stepErr = 'Give the pattern a short name first.'; render(); return; }
    stepErr = ''; step = Math.min(STEPS.length-1, step+1); render(); window.scrollTo({top:0}); },
  back(){ stepErr = ''; step = Math.max(0, step-1); render(); },
  cancelTrace(){ draft = null; editingId = null; location.hash = 'patterns'; },
  pickRoot(b){ draft.rootType = draft.rootType === b.dataset.k ? '' : b.dataset.k;
    document.querySelectorAll('.rootbtn').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.k === draft.rootType))); },
  saveTrace(){
    if (!draft.name.trim()){ step = 0; stepErr = 'Give the pattern a short name first.'; render(); return; }
    const fields = Object.keys(blankDraft());
    let id = editingId;
    if (editingId){ const p = realPatterns().find(x => x.id === editingId); if (p) fields.forEach(f => p[f] = (draft[f]||'').trim()); }
    else { id = newId(); const p = {id, created: todayKey(), released:false, inquiries:[]}; fields.forEach(f => p[f] = (draft[f]||'').trim()); state.patterns.push(p); }
    save(); draft = null; editingId = null; expanded = id;
    toast('Covenant sealed'); location.hash = 'patterns';
  },
  inqStart(b){ inq = {pid:b.dataset.id, step:0, data:{before:70, after:70}}; location.hash = 'question'; if (view()==='question') render(); },
  inqPick(b){ inq.data[b.dataset.k] = b.dataset.v; render(); },
  inqNext(){ if (inq.step === QSTEPS.length-2 && inq.data.after === 70) inq.data.after = inq.data.before; inq.step++; render(); window.scrollTo({top:0}); },
  inqBack(){ inq.step = Math.max(0, inq.step-1); render(); },
  inqCancel(){ inq = null; location.hash = 'patterns'; },
  inqSave(){
    const p = realPatterns().find(x => x.id === inq.pid);
    if (p){ const d = inq.data; (p.inquiries || (p.inquiries = [])).push({date:todayKey(), before:+d.before, after:+d.after, isTrue:d.isTrue||'', certain:d.certain||'', forEv:(d.forEv||'').trim(), againstEv:(d.againstEv||'').trim(), react:(d.react||'').trim(), without:(d.without||'').trim(), turn:(d.turn||'').trim(), examples:(d.examples||'').trim()}); save(); expanded = p.id;
      const drop = d.before - d.after; toast(drop > 0 ? `The belief loosened by ${drop} points. +8 manna` : 'Kept. Come back to it; beliefs loosen over time. +8 manna', 3600); }
    inq = null; location.hash = 'patterns';
  },
  toggle(b){ expanded = expanded === b.dataset.id ? '' : b.dataset.id; render(); },
  mirror(b){ askMirror(b.dataset.id); },
  week(){ readWeek(); },
  useTruth(b){ const p = realPatterns().find(x => x.id === b.dataset.id); if (p && p.mirror){ p.truth = p.mirror.truth; save(); render(); toast('Truth updated'); } },
  release(b){ const p = realPatterns().find(x => x.id === b.dataset.id); if (!p) return;
    p.released = true; p.releasedAt = todayKey(); save(); render(); showRelease(p); },
  yStart(){ ydraft = blankYear(); const ids = realPatterns().map(p => (p.identity||'').trim()).filter(Boolean); if (ids.length) ydraft.identity = ids[0]; ystep = 0; yErr = ''; if (view() === 'yearsetup') render(); },
  yPickId(b){ ydraft.identity = b.dataset.v; const i = $('#y-identity'); if (i) i.value = ydraft.identity; },
  yPickPattern(b){ ydraft.fromPattern = ydraft.fromPattern === b.dataset.v ? '' : b.dataset.v; render(); },
  yNext(){
    yErr = '';
    if (ystep === 0 && !ydraft.identity.trim()){ yErr = 'Finish the sentence: I am someone who…'; render(); return; }
    if (ystep === 1 && !ydraft.goal.trim()){ yErr = 'Name your one goal for the year.'; render(); return; }
    ystep = Math.min(YSTEPS.length - 1, ystep + 1); render(); window.scrollTo({top:0});
  },
  yBack(){ yErr = ''; ystep = Math.max(0, ystep - 1); render(); },
  yCancel(){ ydraft = null; location.hash = 'future'; },
  ySave(){
    const d = ydraft; yErr = '';
    if (!state.year && !d.firstStep.trim()){ yErr = 'Name one small step for this week.'; render(); return; }
    if (state.year){
      Object.assign(state.year, {identity:d.identity.trim(), goal:d.goal.trim(), why:d.why.trim(), fromPattern:d.fromPattern, seasons:d.seasons.map(s => s.trim()), letter:d.letter.trim()});
      if (d.firstStep.trim()) weekRec(yearWeek()).step = d.firstStep.trim();
      toast('Your year is updated');
    } else {
      state.year = {identity:d.identity.trim(), goal:d.goal.trim(), why:d.why.trim(), fromPattern:d.fromPattern, seasons:d.seasons.map(s => s.trim()), letter:d.letter.trim(), start:todayKey(), weeks:{1:{step:d.firstStep.trim()}}, milestones:{}};
      queueSeal({kicker:'Week 1 of 52', name:'Your Sovereign Year', line:'The ground is cleared. Now you build, one small step a week.', emb:'sunrise'});
    }
    save(); ydraft = null; yr = {}; location.hash = 'future';
  },
  yEdit(){ const y = state.year; ydraft = {identity:y.identity, goal:y.goal, why:y.why, fromPattern:y.fromPattern||'', seasons:[...y.seasons], letter:y.letter, firstStep:''}; ystep = 0; yErr = ''; location.hash = 'yearsetup'; },
  ySetStep(){ const s = stepNow.trim(); if (!s){ toast('Write one small step first.'); return; } weekRec(yearWeek()).step = s; stepNow = ''; save(); render(); },
  yStepDone(){ weekRec(yearWeek()).done = 'yes'; save(); render(); toast('Step done. +10 manna'); },
  yStepUndo(){ delete weekRec(yearWeek()).done; save(); render(); },
  yHow(b){ yr.how = b.dataset.v; render(); },
  yPid(b){ yr.pid = yr.pid === b.dataset.v ? '' : b.dataset.v; render(); },
  yReviewOpen(){ reviewOpen = true; const n = yearWeek(); yr = Object.assign({week:n}, clone(weekRec(n).review || {}), {next:(state.year.weeks[n+1]||{}).step || ''}); render(); },
  yReviewSave(){
    const n = yearWeek(); yErr = '';
    if (!yr.how){ yErr = 'Choose how this week’s step went.'; render(); return; }
    if (n < 52 && !(yr.next||'').trim()){ yErr = 'Name next week’s step before closing the week.'; render(); return; }
    const w = weekRec(n);
    w.review = {how:yr.how, helped:(yr.helped||'').trim(), blocked:(yr.blocked||'').trim(), pid:yr.pid && yr.pid !== 'none' ? yr.pid : '', at:todayKey()};
    w.done = yr.how;
    if (n < 52){ const nx = weekRec(n + 1); nx.step = yr.next.trim(); }
    blockedPrompt = w.review.pid ? realPatterns().find(p => p.id === w.review.pid) || null : null;
    reviewOpen = false; yearMirror = null; save(); render();
    toast(n < 52 ? `Week ${n} closed. Week ${n+1} is set. +5 manna` : 'Your final week is closed.');
  },
  async yMirror(){
    if (!mirrorOn()) return;
    const y = state.year, n = yearWeek(), si = Math.max(0, seasonOf(n));
    yearBusy = true; yearMirrorErr = ''; render();
    const recent = [];
    for (let i = Math.max(1, n - 3); i <= n; i++){ const w = y.weeks[i]; if (!w) continue; recent.push(`Week ${i}: step "${w.step||'-'}", ${w.done||yr.how||'not reviewed'}${w.review&&w.review.blocked?`, blocked by: ${w.review.blocked}`:''}${i===n&&yr.blocked?`, blocked by: ${yr.blocked}`:''}`); }
    try {
      yearMirror = await api.mirrorYear({goal:y.goal, identity:y.identity, why:y.why||'', season:SEASONS[si].name, milestone:y.seasons[si]||'', week:String(n + 1), recent:recent.join('\n')});
      if (yearMirror && yearMirror.step) yr.next = yearMirror.step;
    } catch(e){ yearMirrorErr = errText(e, 'The Mirror couldn’t answer just now. Try again.'); }
    yearBusy = false; render();
  },
  yMilestone(b){ const y = state.year; y.milestones = y.milestones || {}; const i = +b.dataset.i; y.milestones[i] = todayKey(); save(); render();
    queueSeal({kicker:`${SEASONS[i].name} milestone`, name:y.seasons[i], line:'A season’s harvest, gathered. +20 manna', emb:SEASONS[i].emb}); },
  yEndArm(){ yearEndArmed = true; render(); },
  yEndNo(){ yearEndArmed = false; render(); },
  yEnd(){ state.year = null; yearEndArmed = false; save(); render(); toast('Your year has been cleared.'); },
  yNewYear(){ state.yearsCompleted = (state.yearsCompleted || 0) + 1; state.year = null; save(); location.hash = 'future'; },
  buildOnThis(){ $('#release').hidden = true; location.hash = state.year ? 'future' : 'yearsetup'; if (!state.year) acts.yStart(); },
  closeRelease(){ $('#release').hidden = true; },
  closeSeal(){ nextSeal(); },
  delAsk(b){ confirmDel = b.dataset.id; render(); },
  delNo(){ confirmDel = null; render(); },
  delYes(b){ const id = b.dataset.id;
    state.patterns = state.patterns.filter(p => p.id !== id);
    state.urges = state.urges.filter(u => u.pid !== id);
    for (const k in state.checks){ delete state.checks[k][id]; if (!Object.keys(state.checks[k]).length) delete state.checks[k]; }
    for (const k in state.slips){ delete state.slips[k][id]; if (!Object.keys(state.slips[k]).length) delete state.slips[k]; }
    confirmDel = null; expanded = null; save(); render(); toast('Pattern deleted'); },
  rhythm(b){ state.witness.rhythm = b.dataset.v; save(); render(); },
  copy(){
    const text = weekSummary();
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('#summary')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selected. Press copy on your device.'); };
    try { navigator.clipboard.writeText(text).then(() => toast('Copied. Paste it to your witness.'), fallback); } catch(e){ fallback(); }
  },
  async export(){
    const blob = new Blob([journalText()], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'the-crossing-journal-' + todayKey() + '.txt';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Journal downloaded');
  },
  remSlot(b){ remSlot = b.dataset.v; document.querySelectorAll('[data-act=remSlot]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === remSlot))); },
  remEdit(){ if (rem){ remDraft = rem.email; remSlot = rem.slot; rem = Object.assign({}, rem, {on:false}); } remConsent = false; remMsg = ''; render(); },
  async remSave(){
    const email = ($('#remEmail').value || '').trim();
    remErr = ''; remMsg = '';
    if (!validEmail(email)){ remErr = 'Enter a full email address, like name@example.com.'; render(); return; }
    if (!$('#remConsent').checked){ remErr = 'Tick the box to agree to reminder emails.'; render(); return; }
    remBusy = true; render();
    try { await api.setReminder(email, remSlot, CONSENT); rem = {email: email.toLowerCase(), slot: remSlot, on: true}; remMsg = 'Saved. Your first reminder comes at the next ' + (remSlot === 'evening' ? '8pm.' : '7:30am.'); }
    catch(e){ remErr = errText(e, 'That didn’t save. Try again in a moment.'); }
    remBusy = false; render();
  },
  async remStop(){
    remBusy = true; remErr = ''; render();
    try { await api.stopReminder(); rem = null; remMsg = 'Reminders stopped and your email removed from the list.'; }
    catch(e){ remErr = errText(e, 'That didn’t go through. Try again in a moment.'); }
    remBusy = false; render();
  },
  async signOut(){ await flush(); await api.signOut(); },
  delArm(){ delArmed = true; render(); },
  delCancel(){ delArmed = false; render(); },
  async delAccount(){
    delBusy = true; render();
    try { clearTimeout(saveTimer); dirty = false; await api.deleteAccount(); }
    catch(e){ delBusy = false; delArmed = false; toast(errText(e, 'That didn’t go through. Try again.')); render(); }
  }
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = acts[b.dataset.act]; if (!a) return;
  if (b.tagName !== 'A') e.preventDefault();
  a(b, e);
});
document.addEventListener('input', e => {
  const t = e.target, bind = t.dataset && t.dataset.bind; if (!bind) return;
  const k = todayKey();
  if (bind === 'intention'){ state.intentions[k] = t.value; if (!t.value) delete state.intentions[k]; save(); }
  else if (bind === 'examen'){ const e2 = state.examens[k] || (state.examens[k] = {}); e2[t.dataset.k] = t.value; save(); }
  else if (bind === 'slip'){ (state.slips[k] || (state.slips[k] = {}))[t.dataset.id] = t.value; save(); }
  else if (bind === 'draft'){ draft[t.dataset.k] = t.value; if (stepErr && t.dataset.k === 'name'){ stepErr = ''; } }
  else if (bind === 'inq'){ inq.data[t.dataset.k] = t.value; }
  else if (bind === 'inqRange'){ inq.data[t.dataset.k] = +t.value; const o = $('#rv-' + t.dataset.k); if (o) o.textContent = t.value + '%'; }
  else if (bind === 'urge'){ urge.trigger = t.value; }
  else if (bind === 'remEmail'){ remDraft = t.value; }
  else if (bind === 'ydraft'){ ydraft[t.dataset.k] = t.value; }
  else if (bind === 'yseason'){ ydraft.seasons[+t.dataset.i] = t.value; }
  else if (bind === 'yr'){ yr[t.dataset.k] = t.value; }
  else if (bind === 'ystepnow'){ stepNow = t.value; }
  else if (bind === 'remConsent'){ remConsent = t.checked; }
  else if (bind === 'urgeRange'){ urge.intensity = +t.value; const o = $('#u-int'); if (o) o.textContent = t.value; }
  else if (bind === 'wName' || bind === 'wNext' || bind === 'wStake'){ state.witness[{wName:'name',wNext:'next',wStake:'stake'}[bind]] = t.value; save(); const s = $('#summary'); if (s) s.textContent = weekSummary(); }
});
/* Examen completes a quest on blur, so the page doesn't redraw while typing */
document.addEventListener('focusout', e => { if (e.target.dataset && e.target.dataset.bind === 'examen' && view() === 'today'){ if (syncQuest()) checkRank(); else checkRank(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ if (!$('#release').hidden) $('#release').hidden = true; if (!$('#urge').hidden) acts.urgeClose(); if (!$('#seal').hidden) nextSeal(); } });
window.addEventListener('hashchange', () => { confirmDel = null; render(); window.scrollTo({top:0}); });

setStatus();
render();
{ const so = document.querySelector('.hdr-out'); if (so) so.hidden = false; }
return { flush };
}
