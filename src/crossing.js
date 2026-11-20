
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
  {name:'Named', sub:'STARTING', emb:'narrow', desc:'You’ve named it, but haven’t yet worked out where it comes from.'},
  {name:'Understood', sub:'TRACED', emb:'eye', desc:'You know what it is and where it came from.'},
  {name:'Breaking away', sub:'DAYS 1–6', emb:'gate', desc:'Your first days free. The start is the hardest part.'},
  {name:'Keeping going', sub:'DAYS 7–39', emb:'tent', desc:'Old urges come back. Every day free makes the new way easier.'},
  {name:'Nearly there', sub:'DAY 40', emb:'waters', desc:'Forty days free. Ready to let it go for good.'},
  {name:'Free', sub:'RELEASED', emb:'crown', desc:'Let go. This pattern no longer runs your life.'}
];
/* Waymarks follow the route of Exodus, in order */
const STONES = [
  {d:1,  name:'First step', emb:'gate', line:'Day one done. The first step is the biggest.'},
  {d:3,  name:'The hard bit', emb:'tree', line:'Around day three it often feels harder before it feels easier. Keep going. (In Exodus, bitter water at Marah was made sweet.)'},
  {d:7,  name:'One week', emb:'lamp', line:'Seven days free. Take a moment to be proud of that.'},
  {d:12, name:'Breathing space', emb:'palm', line:'Twelve days. A good place to rest and refuel. (Like the oasis at Elim, Exodus 15:27.)'},
  {d:21, name:'Three weeks', emb:'manna', line:'Enough for today, every day. Freedom is built one day at a time. (Exodus 16)'},
  {d:30, name:'Thirty days', emb:'sinai', line:'The new way is taking hold. You know who you’re becoming. (Exodus 19–20)'},
  {d:40, name:'Forty days', emb:'waters', line:'Forty days free. You’ve made the crossing. (Joshua 3)'}
];
/* Ranks echo the Indigo Estate tiers */
const RANKS = [
  {n:'Initiate', m:0,    line:'You’ve started. That’s the bravest bit.'},
  {n:'Seeker',   m:40,   line:'You are asking the right questions.'},
  {n:'Pilgrim',  m:120,  line:'You keep going, even when it’s hard.'},
  {n:'Steward',  m:250,  line:'You look after yourself with care.'},
  {n:'Sovereign',m:500,  line:'You run your own life. The pattern doesn’t.'},
  {n:'Architect',m:1000, line:'You’re building freedom, for yourself and for others.'}
];
const EARN = [['Morning promise',1],['Day free',3],['Caught it',2],['Got through an urge',5],['Honest slip logged',1],['Evening reflection',2],['Belief questioned',8],['Daily dare',5],['Challenge step',10],['7-day challenge done',30],['Weekly step done',10],['Sunday review',5],['Season milestone',20],['Habit done',1]];
const TRIAL = [
  {t:'Say it aloud',          d:'Tell your accountability partner the name of the pattern you’re breaking.', auto:null},
  {t:'Catch it once',         d:'Check in as Stayed free or Caught it on any pattern.', auto:'check'},
  {t:'Beat one urge',         d:'When the urge comes, tap “I’m feeling the urge” and get through it.', auto:'urge'},
  {t:'Question the voice',    d:'Complete one “Question the belief” inquiry.', auto:'inquiry'},
  {t:'Before noon',           d:'Do your practice once before midday.', auto:null},
  {t:'Put it where you’ll see it',d:'Write your new truth somewhere you’ll see it every day: a mirror, a door, your lock screen.', auto:null},
  {t:'End the day well',      d:'Do the evening reflection (at least two answers).', auto:'examen'}
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
  'Go a whole day without complaining.',
  'Walk somewhere new for fifteen minutes and notice what you feel in your body.',
  'Forgive yourself, in writing, for one slip.',
  'Ask your accountability partner one question about their own patterns, and just listen.',
  'Give away one thing that belongs to the old pattern.',
  'Go to bed at the time the person you are becoming would.',
  'Rest for one hour without doing anything useful, and without guilt.',
  'Do your practice before you check your phone.',
  'Write a short letter from your future self, forty days from now.',
  'Write a kind message to someone who once told you the old belief. You don’t have to send it.'
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
  {title:'What it costs now', q:'What is it costing you, and the people around you, today?', hint:'Name the cost honestly. This is your reason for changing, and you’ll see it again when an urge comes.',
    fields:[{k:'cost',label:'What it costs',type:'area',ph:'Time, money, trust, health, peace'}]},
  {title:'Who you are becoming', q:'Who are you becoming, now that you’re breaking free?', hint:'Say it as “I am someone who …”. Every day free is a vote for this person.',
    fields:[{k:'identity',label:'I am someone who',type:'input',ph:'e.g. finishes what I start'}]},
  {title:'The new way', q:'What do you choose to believe instead, and what will you do when the trigger comes?', hint:'Write the truth in the first person. Make the practice small enough to do on a hard day, and tie it to the trigger: “When …, I will …”.',
    fields:[{k:'truth',label:'The truth I choose',type:'area',ph:'e.g. My work can be imperfect and still be finished.'},{k:'practice',label:'When the trigger comes, I will',type:'area',ph:'e.g. Send one small piece to someone the same day.'}]}
];
const QSTEPS = [
  {title:'How true does it feel?', q:'Read the belief slowly. Right now, how true does it feel?', hint:'0 means not at all. 100 means completely, without question.'},
  {title:'Is it true?', q:'Is it true? And can you know, beyond all doubt, that it is true?', hint:'Take a breath before you answer. A quick yes is often the old voice talking.'},
  {title:'Weigh the evidence', q:'What actually supports this belief, and what doesn’t?', hint:'Facts only: things a camera would have recorded, not interpretations.'},
  {title:'When you believe it', q:'What happens when you believe this thought?', hint:'In your body, in what you do next, in how you treat yourself and the people around you.'},
  {title:'Without it', q:'Who would you be in the same situation, without this thought?', hint:'Picture it. Same room, same people. Just without the belief.'},
  {title:'Turn it around', q:'Write the opposite, and find three real examples of it being true.', hint:'Turn it toward yourself, toward the other person, or to its opposite. Pick the one that rings truest.'},
  {title:'How true now?', q:'Read the original belief again. How true does it feel now?', hint:'There’s no right number. Any drop at all is progress.'}
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
  practice:'When I feel the urge to go quiet, I send one small piece to someone that same day.',
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
function blank(){ return {v:3, patterns:[], checks:{}, slips:{}, intentions:{}, pledges:{}, examens:{}, urges:[], dares:{}, quest:{start:null, done:{}, complete:null, trials:0}, rankSeen:null, goals:[], goalIdx:0, yearsCompleted:0, habits:[], habitChecks:{}, witness:{name:'',next:'',stake:'',rhythm:'weekly'}}; }
function normalise(s){
  const b = blank();
  if (!s || typeof s !== 'object') return b;
  for (const k in b) if (s[k] !== undefined && s[k] !== null) b[k] = s[k];
  if (!Array.isArray(b.patterns)) b.patterns = [];
  if (!Array.isArray(b.urges)) b.urges = [];
  b.witness = Object.assign({name:'',next:'',stake:'',rhythm:'weekly'}, typeof b.witness === 'object' ? b.witness : {});
  b.quest = Object.assign({start:null, done:{}, complete:null, trials:0}, typeof b.quest === 'object' ? b.quest : {});
  b.patterns.forEach(p => { if (!Array.isArray(p.inquiries)) p.inquiries = []; });
  // Older journals kept one goal in "year"; it becomes the first of the goals list.
  if (!Array.isArray(b.goals)) b.goals = [];
  if (s.year && typeof s.year === 'object' && !b.goals.length) b.goals = [s.year];
  b.goals.forEach((g, i) => { g.id = g.id || ('g' + i + Date.now().toString(36)); g.weeks = g.weeks || {}; g.milestones = g.milestones || {}; g.seasons = Array.isArray(g.seasons) ? g.seasons : ['','','','']; });
  b.goalIdx = Math.min(Math.max(0, b.goalIdx|0), Math.max(0, b.goals.length - 1));
  if (!Array.isArray(b.habits)) b.habits = [];
  if (!b.habitChecks || typeof b.habitChecks !== 'object') b.habitChecks = {};
  delete b.year;
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
  for (const g of state.goals){ for (const k in g.weeks){ const w = g.weeks[k]; t += w.done==='yes'?10 : w.done==='partly'?4 : 0; if (w.review) t += 5; } t += 20 * Object.keys(g.milestones||{}).length; }
  for (const k in state.habitChecks) t += Object.keys(state.habitChecks[k]).length;
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
    queueSeal({kicker:'Trial complete', name:'Seven Days Out', line:'Seven challenges, seven days. You did it. +30 points.', emb:'seal'}); }
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
  return `<svg class="ring" viewBox="0 0 76 76" role="img" aria-label="${on} of 40 days free">${s}<text x="38" y="44" text-anchor="middle">${on}</text></svg>`;
}
function stonesRow(held){
  return `<div class="stones" aria-label="Milestones">${STONES.map(s => `<div class="stone${held>=s.d?' on':''}" title="Day ${s.d}: ${esc(s.line)}"><span class="disc">${emb(s.emb)}</span><span>${s.name}<br>${s.d}</span></div>`).join('')}</div>`;
}
function strengthBar(p){
  const v = strength(p);
  return `<div class="strength" title="Rises with each day free and dips gently with a slip, so one bad day never wipes out your progress."><span>Momentum</span><span class="track"><span class="fill" style="width:${v}%"></span></span><b>${v}%</b></div>`;
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
const VIEWS = ['today','quest','patterns','trace','future','yearsetup','journey','witness','question','plus','welcome-plus','owner'];
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
    cards = `<div class="empty">${emb('crown')}<h3>You’ve let go of every pattern you traced.</h3><p class="muted">When you notice another one, trace it here.</p><a class="btn" href="#trace" data-act="newTrace">Trace a pattern</a></div>`;
  }
  for (const p of list){
    const st = stats(p);
    const cur = p.example ? 'held' : checkOf(k, p.id);
    const slipNote = (!p.example && state.slips[k] && state.slips[k][p.id]) || '';
    const nx = nextStone(st.held);
    const btn = (v, label, sub) => `<button type="button" class="choice" data-act="check" data-id="${esc(p.id)}" data-v="${v}" aria-pressed="${cur===v}"${p.example?' disabled':''}>${label}<small>${sub}</small></button>`;
    cards += `<article class="pcard${p.example?' is-example':''}">
      <div class="ringwrap">${ring(st.held)}<span class="ringcap">of 40 days</span></div>
      <div class="pbody">
        <div class="row">${p.example?'<span class="chip example">Example</span>':''}${stageChip(stageOf(p))}</div>
        <h3>${esc(p.name)}</h3>
        ${p.identity?`<p class="identity">Each day free is a vote for: I am someone who ${esc(p.identity)}</p>`:''}
        ${p.truth?`<p class="truth">${esc(p.truth)}</p>`:''}
        ${p.practice?`<p class="practice">${esc(p.practice)}</p>`:''}
        <div class="choices" role="group" aria-label="How did today go with ${esc(p.name)}?">
          ${btn('held','Stayed free','I didn’t do it')}${btn('noticed','Caught it','It started, I stopped')}${btn('slipped','Slipped','It happened')}
        </div>
        <div class="meta"><span>Momentum <b>${strength(p)}%</b></span>${st.streak?`<span><b>${st.streak}</b> in a row</span>`:''}${nx?`<span>Next milestone: <b>${nx.name}</b> at day ${nx.d}</span>`:''}</div>
        ${cur==='slipped' && !p.example ? `<div><label class="lbl" for="slip-${esc(p.id)}">What happened just before?</label><textarea id="slip-${esc(p.id)}" data-bind="slip" data-id="${esc(p.id)}" placeholder="No judgement. Where were you, what did you feel, what did you tell yourself?">${esc(slipNote)}</textarea></div>` : ''}
        <button type="button" class="pullbtn" data-act="urgeOpen" data-id="${esc(p.id)}"${p.example?' disabled':''}>I’m feeling the urge</button>
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
        ? `<div class="pledge done">${emb('seal')}<p><em>Just for today, I choose the new way. I’ll keep my promise to myself.</em></p><span class="seal">Promised ${esc(pledged)}</span></div>`
        : `<div class="pledge"><p>Morning promise: <em>Just for today, I choose the new way. I’ll keep my promise to myself.</em></p><button class="btn gold small" type="button" data-act="pledge">Make my promise</button></div>`) : ''}
      <div><label class="lbl" for="intention">Morning intention</label>
      <input type="text" id="intention" data-bind="intention" placeholder="Today I will be someone who…" value="${esc(state.intentions[k]||'')}"></div>
      <a class="dare-mini" href="#quest"><span class="emb-badge">${emb('flame')}</span><p><span class="eyebrow">Today’s dare${dareDone?' · done':''}</span><br>${esc(todaysDare())}</p></a>
      ${renderNudge()}
    </div>
    ${slippedYesterday.length ? `<p class="notice"><b>Never twice.</b> Yesterday ${esc(slippedYesterday.map(p=>p.name).join(' and '))} got the better of you. One slip is just a stumble; it’s two in a row that pulls you back. Today matters more than yesterday.</p>` : ''}
    ${ex ? `<div class="empty">${emb('gate')}<p class="eyebrow">Begin here</p><h3>You haven’t traced a pattern yet.</h3><p class="muted small">Below is an example of a traced pattern once you’re checking in each day. Trace your own and it takes the example’s place.</p><a class="btn gold" href="#trace" data-act="newTrace">Trace your first pattern</a></div>` : ''}
    <div class="stack">${cards}</div>
    ${renderHabits()}
    ${!ex ? `<div class="examen">
      <div class="stack-sm"><p class="eyebrow">Evening reflection</p><p class="muted small">Four quick questions to look back on your day.</p></div>
      ${exField('grateful','I’m grateful for','One good thing from today, however small')}
      ${exField('free','Where I did well','A moment I chose the new way')}
      ${exField('pulled','Where the old pattern tugged at me','When, where, and what you told yourself')}
      ${exField('tomorrow','For tomorrow, I need','Strength, patience, courage… whatever tomorrow needs')}
    </div>` : ''}
    ${released ? `<p class="muted small">${released} pattern${released>1?'s':''} let go for good.</p>` : ''}
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
    trial = `<div class="empty">${emb('seal')}<h3>Trace a pattern to start the 7-day challenge.</h3><a class="btn" href="#trace" data-act="newTrace">Trace a pattern</a></div>`;
  } else if (!q.start || q.complete){
    trial = `<div class="panel">
      ${q.complete ? `<div class="row">${emb('seal')}<p><b>Completed on ${fmtLong(fromKey(q.complete))}.</b> ${q.trials>1?`You’ve done this challenge ${q.trials} times.`:''}</p></div>` : ''}
      <p>Seven small challenges over seven days. A new one opens each morning. Some tick themselves off when you log the right thing; the rest you tick yourself, on your honour.</p>
      <div class="row"><button class="btn gold" type="button" data-act="trialStart">${q.complete?'Do it again':'Start the challenge'}</button><span class="muted small">+10 points each, +30 when all seven are done</span></div>
    </div>`;
  } else {
    const tk = todayKey();
    const done = TRIAL.filter((t,i)=>q.done[i]).length;
    trial = `<div class="trial">
      <div class="row"><div class="seals" aria-label="${done} of 7 done">${TRIAL.map((t,i)=>`<i class="${q.done[i]?'on':''}"></i>`).join('')}</div><span class="muted small">${done} of 7 done · started ${fmtShort(fromKey(q.start))}</span></div>
      ${TRIAL.map((t, i) => {
        const u = questUnlock(i), locked = tk < u, isDone = !!q.done[i];
        const st = isDone ? `<span class="qstate done">Done</span>` : locked ? `<span class="qstate">Opens ${fmtDay(fromKey(u))}</span>`
          : t.auto ? `<span class="qstate">Ticks itself when you log it</span>` : `<button class="btn small" type="button" data-act="questDone" data-i="${i}">I did it</button>`;
        return `<div class="quest ${isDone?'done':locked?'locked':'open'}"><span class="num">${isDone?emb('seal'):i+1}</span><div><h3>${t.t}</h3><p>${t.d}</p></div><div class="qside">${st}</div></div>`;
      }).join('')}
      <button class="btn text" type="button" data-act="trialAbandon">Start the challenge again</button>
    </div>`;
  }
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Quest</p><h2>Earn points. Move up a level.</h2></div>
    <div class="rank">
      ${jar(frac)}
      <div class="stack-sm">
        <p class="eyebrow">Your level</p>
        <p class="title">${RANKS[r].n}</p>
        <p class="muted small">${RANKS[r].line}</p>
        <span class="track"><span class="fill" style="width:${Math.round(frac*100)}%"></span></span>
        <p class="small">${m} points${next?` · ${next.m - m} more to <b>${next.n}</b>`:' · the highest level'}</p>
      </div>
    </div>
    ${ex?'<p class="muted small">You start earning points once you trace your first pattern.</p>':''}
    <div class="dare">
      <div class="row"><span class="emb-badge">${emb('flame')}</span><div class="stack-sm" style="gap:2px"><p class="eyebrow">Today’s dare</p><p class="muted small">A new one every day · +5 points</p></div></div>
      <p class="text">${esc(todaysDare())}</p>
      <div>${dareDone ? `<span class="ok">Done today. Well done.</span>` : `<button class="btn gold" type="button" data-act="dare"${ex?' disabled':''}>I did it</button>`}</div>
    </div>
    <div class="stack">
      <div class="section-head"><div class="stack-sm" style="gap:2px"><p class="eyebrow">7-day challenge</p><h2>Seven Days Out</h2></div></div>
      ${trial}
    </div>
    <div class="stack-sm"><p class="eyebrow">How to earn points</p><div class="earn">${EARN.map(([l,n])=>`<div><span>${l}</span><b>+${n}</b></div>`).join('')}</div>
      <p class="muted small">Levels: ${RANKS.map(x=>`${x.n} (${x.m})`).join(' · ')}</p></div>
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
    ${(p.truth||p.practice||p.identity) ? `<li class="divider">The new way</li>` : ''}
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
        <p class="muted small">${p.released ? `Released on ${fmtLong(fromKey(p.releasedAt))}` : `${st.held} of 40 days free · ${st.noticed} caught · ${st.slipped} slipped · ${urgesFor(p).filter(u=>u.outcome==='rode').length} urges beaten`}</p>
      </div>
      ${!p.released ? strengthBar(p) + stonesRow(st.held) : ''}
      ${open ? mapList(p) + renderInquiries(p) + renderMirror(p) : ''}
      <div class="pat-actions">
        <button class="btn ghost small" type="button" data-act="toggle" data-id="${esc(p.id)}" aria-expanded="${open}">${open?'Close the map':'Open the map'}</button>
        ${p.example ? `<a class="btn small" href="#trace" data-act="newTrace">Trace my own</a>` : `
          ${p.belief && !p.released ? (isPlus() ? `<button class="btn small" type="button" data-act="inqStart" data-id="${esc(p.id)}">Question the belief</button>` : plusLink('Question the belief')) : ''}
          ${s===4 ? `<button class="btn gold small" type="button" data-act="release" data-id="${esc(p.id)}">Release this pattern</button>` : ''}
          <button class="btn text" type="button" data-act="edit" data-id="${esc(p.id)}">Edit</button>
          ${mirrorOn() && !p.released ? (isPlus() ? `<button class="btn text" type="button" data-act="mirror" data-id="${esc(p.id)}"${mirrorBusy[p.id]?' disabled':''}>Ask the Mirror</button>` : plusLink('Ask the Mirror')) : ''}
          ${confirmDel===p.id ? `<span class="confirm">Delete this pattern and its check-ins?<button class="btn danger small" type="button" data-act="delYes" data-id="${esc(p.id)}">Delete</button><button class="btn text" type="button" data-act="delNo">Keep it</button></span>`
            : `<button class="btn text" type="button" data-act="delAsk" data-id="${esc(p.id)}">Delete</button>`}`}
      </div>
    </article>`;
  }
  return `<section class="stack-lg">
    <div class="section-head"><div class="stack-sm"><p class="eyebrow">Your patterns</p><h2>Every pattern has a root</h2></div>
    <a class="btn gold" href="#trace" data-act="newTrace">Trace a pattern</a></div>
    ${!isPlus() && !showingExample() ? `<p class="muted small">Free plan: one pattern at a time. <a href="#plus">Plus</a> lets you trace as many as you need.</p>` : ''}
    <p class="muted">Each map reads from top to bottom: where the pattern came from, the belief behind it, and what it causes now. Below the gold line is the new way you’re choosing instead.</p>
    <div class="stack">${h}</div>
  </section>`;
}

function blankDraft(){ return {name:'',habit:'',trigger:'',belief:'',voice:'',rootType:'',rootStory:'',payoff:'',cost:'',identity:'',truth:'',practice:''}; }

function renderTrace(){
  if (!editingId && !isPlus() && activeCount() >= 1) return `<section class="stack-lg"><div class="stack-sm"><p class="eyebrow">Trace a pattern</p><h2>One pattern at a time on the free plan</h2></div>${plusLock('Work on more than one pattern', 'You\u2019re already walking out of one pattern. Release it, or upgrade to Plus to trace as many as you need.')}</section>`;
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
      ${last ? `<button class="btn gold" type="button" data-act="saveTrace">${editingId?'Save changes':'Save my pattern'}</button>` : `<button class="btn" type="button" data-act="next">Next</button>`}
    </div>
  </section>`;
}

function renderQuestion(){
  if (!isPlus()) return `<section class="stack-lg">${plusLock('Question the belief', 'Seven steps that loosen the belief beneath the pattern, with a before-and-after rating so you can see it shift.')}</section>`;
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
  const svg = `<svg viewBox="-28 0 776 200" role="img" aria-label="Map of the journey from first naming a pattern to being free of it, with your patterns placed at each stage">
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
    <div class="stack-sm"><p class="eyebrow">Journey</p><h2>How far you’ve come</h2></div>
    ${!ex ? `<div class="ppf">
      <a href="#patterns"><svg class="emb" aria-hidden="true"><use href="#e-narrow"/></svg><b>Past</b><span>${realPatterns().length} pattern${realPatterns().length===1?'':'s'} traced to the root</span></a>
      <a href="#today"><svg class="emb" aria-hidden="true"><use href="#e-tent"/></svg><b>Present</b><span>${list.reduce((a,p)=>a+stats(p).held,0)} days free</span></a>
      <a href="#future" class="now"><svg class="emb" aria-hidden="true"><use href="#e-sunrise"/></svg><b>Future</b><span>${G() ? `Week ${yearWeek()} of 52: ${esc(state.goals[0].goal)}${state.goals.length > 1 ? ` (+${state.goals.length - 1} more)` : ''}` : 'Your Sovereign Year is waiting'}</span></a>
    </div>` : ''}
    ${ex?'<p class="muted small"><span class="chip example">Example</span> These figures show the example pattern until you trace your own.</p>':''}
    <div class="pathbox">${svg}</div>
    <div class="stats">
      <div class="stat"><b>${totalHeld}</b><span>Days free</span></div>
      <div class="stat"><b>${rode}<span class="muted" style="font-size:1rem"> / ${urges.length}</span></b><span>Urges beaten</span></div>
      <div class="stat"><b>${list.filter(p=>p.released).length}</b><span>Released</span></div>
    </div>
    ${mirrorOn() && !ex ? `<div class="insight">
      <div class="section-head"><p class="eyebrow">The Mirror reads your week</p>${isPlus() ? `<button class="btn ghost small" type="button" data-act="week"${weekBusy?' disabled':''}>${weekRead?'Read it again':'Read my week'}</button>` : plusLink('Read my week')}</div>
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
      ${topT.length ? `<ol class="toplist">${topT.map(t => `<li>${esc(t.label)} <span class="muted small">· ${t.n} time${t.n>1?'s':''}</span></li>`).join('')}</ol>` : '<p class="muted small">Log an urge with “I’m feeling the urge” and your triggers will show up here.</p>'}
      <p class="lbl" style="margin:8px 0 0">When the urges come</p>
      ${bars(tod, true)}
      <p class="lbl" style="margin:8px 0 0">Slips by day of the week</p>
      ${anySlips ? bars(dowMon, true) : '<p class="muted small">No slips logged yet.</p>'}
    </div>
    <ol class="stagelist">${STAGES.map((s,i)=>`<li>${emb(s.emb)}<b>${s.name}</b><span class="muted small">${s.desc}</span><span class="meta">${counts[i]} pattern${counts[i]===1?'':'s'}</span></li>`).join('')}</ol>
    <div class="etym">
      <span class="heb" lang="he">מִצְרַיִם</span>
      <span class="t">Why forty days?</span>
      <span class="muted small">The Hebrew word for Egypt, <em>Mitzrayim</em>, comes from <em>tsar</em>, meaning “narrow” or “tight”. A pattern is a tight place you learned to live in. In the Exodus story, people left that place and took forty years to learn to live free. Here, forty days free marks the same journey.</span>
    </div>
    <div class="stack"><p class="eyebrow">The last forty days</p>
      <div class="legend"><span><i class="held"></i>Stayed free</span><span><i class="noticed"></i>Caught it</span><span><i class="slipped"></i>Slipped</span><span><i></i>No check-in</span></div>
      ${grids || '<p class="muted">No patterns in progress right now.</p>'}
    </div>
    <div class="stack"><p class="eyebrow">Where your patterns come from</p>${bars(Object.entries(ROOTS).map(([k,r]) => [r.label, rootCounts[k]||0]))}
      <p class="muted small">If one source keeps coming up, that’s often the thing to work on, rather than each pattern separately.</p></div>
  </section>`;
}

/* ---------- Future: the Sovereign Year ---------- */
const MAX_GOALS = 3;
const G = () => state.goals[state.goalIdx] || null;
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
  {title:'How you\u2019ll know', q:'How will you know you\u2019re getting there?', hint:'Some goals are a number: money saved, weight, words written, clients signed. If yours is, track it and watch the line move each week. If not, your weekly steps are the measure.'},
  {title:'Why it matters', q:'Why does this matter, and what are you leaving behind to get there?', hint:'The future grows from the past. Link it to a pattern you’re leaving behind, if one fits.'},
  {title:'Four seasons', q:'What will be true at the end of each season?', hint:'A milestone every 13 weeks. Rough is fine; you can change these later.'},
  {title:'Week one', q:'Write a letter from your future self, and choose this week’s first step.', hint:'Your future self has already done it. What do they want you to know? Then name one step small enough to finish in the next seven days.'}
];
const yearWeek = () => { const y = G(); if (!y) return 0; const days = Math.floor((fromKey(todayKey()) - fromKey(y.start)) / 86400000); return Math.min(52, Math.max(1, Math.floor(days / 7) + 1)); };
const seasonOf = w => SEASONS.findIndex(s => w >= s.from && w <= s.to);
const weekRec = n => (G().weeks[n] || (G().weeks[n] = {}));
const weekStart = n => addDays(fromKey(G().start), (n - 1) * 7);
const isSunday = () => new Date().getDay() === 0;
function yearDone(){ return G() ? Object.values(G().weeks).filter(w => w.done === 'yes').length : 0; }

let ydraft = null, ystep = 0, yErr = '', yearBusy = false, yearMirrorErr = '', yearMirror = null, reviewOpen = false, yearEndArmed = false, blockedPrompt = null;

function blankYear(){ return {identity:'', goal:'', why:'', fromPattern:'', seasons:['','','',''], letter:'', firstStep:'', mType:'steps', mUnit:'', mStart:'', mTarget:''}; }

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
  if (!isPlus()) return renderFuture();
  if (!ydraft){ if (state.goals.length >= MAX_GOALS) return renderFuture(); ydraft = blankYear(); yEditing = false; }
  if (!ydraft) ydraft = blankYear();
  const d = ydraft, S = YSTEPS[ystep];
  let prog = ''; for (let i = 0; i < YSTEPS.length; i++) prog += `<span class="${i<ystep?'done':i===ystep?'here':''}"></span>`;
  const ids = [...new Set(realPatterns().map(p => (p.identity||'').trim()).filter(Boolean))];
  let body = '';
  if (ystep === 0) body = `${ids.length ? `<div class="row">${ids.map(t => `<button type="button" class="pick" data-act="yPickId" data-v="${esc(t)}">I am someone who ${esc(t)}</button>`).join('')}</div>` : ''}
    <div><label class="lbl" for="y-identity">I am someone who</label><input type="text" id="y-identity" data-bind="ydraft" data-k="identity" placeholder="e.g. finishes what I start" value="${esc(d.identity)}"></div>`;
  if (ystep === 1) body = `<div><label class="lbl" for="y-goal">My goal for the next 52 weeks</label><input type="text" id="y-goal" data-bind="ydraft" data-k="goal" placeholder="e.g. Publish my first book" value="${esc(d.goal)}"></div>`;
  if (ystep === 2) body = `<div class="yn" role="group" aria-label="How you'll measure it">${[['steps','By my weekly steps'],['number','By a number']].map(([v,l]) => `<button type="button" class="choice" data-act="yMType" data-v="${v}" aria-pressed="${(d.mType||'steps')===v}">${l}</button>`).join('')}</div>
    ${d.mType === 'number' ? `<div class="three">
      <div><label class="lbl" for="y-mstart">Where you are now</label><input type="text" inputmode="decimal" id="y-mstart" data-bind="ydraft" data-k="mStart" placeholder="e.g. 0" value="${esc(d.mStart)}"></div>
      <div><label class="lbl" for="y-mtarget">Where you\u2019re heading</label><input type="text" inputmode="decimal" id="y-mtarget" data-bind="ydraft" data-k="mTarget" placeholder="e.g. 5000" value="${esc(d.mTarget)}"></div>
      <div><label class="lbl" for="y-munit">Unit</label><input type="text" id="y-munit" data-bind="ydraft" data-k="mUnit" placeholder="e.g. \u00a3, kg, words" value="${esc(d.mUnit)}"></div>
    </div><p class="muted small">It works both ways: going up (saving \u00a35,000) or down (from 14 stone to 12). Each Sunday you\u2019ll log where you are.</p>` : ''}`;
  if (ystep === 3) body = `<div><label class="lbl" for="y-why">Why it matters</label><textarea id="y-why" data-bind="ydraft" data-k="why" placeholder="Who benefits? What changes when it’s done?">${esc(d.why)}</textarea></div>
    ${realPatterns().length ? `<div><span class="lbl">Linked to the pattern I’m breaking</span><div class="row">${realPatterns().map(p => `<button type="button" class="pick${d.fromPattern===p.id?' on':''}" data-act="yPickPattern" data-v="${esc(p.id)}" aria-pressed="${d.fromPattern===p.id}">${esc(p.name)}</button>`).join('')}</div></div>` : ''}`;
  if (ystep === 4) body = SEASONS.map((s, i) => `<div><label class="lbl" for="y-s${i}">${s.name} · by week ${s.to}</label><input type="text" id="y-s${i}" data-bind="yseason" data-i="${i}" placeholder="${['e.g. First three chapters drafted','e.g. Full first draft finished','e.g. Edited and cover designed','e.g. Published and launched'][i]}" value="${esc(d.seasons[i])}"></div>`).join('');
  if (ystep === 5) body = `<div><label class="lbl" for="y-letter">A letter from your future self (optional)</label><textarea id="y-letter" data-bind="ydraft" data-k="letter" placeholder="Dear me, a year ago today…">${esc(d.letter)}</textarea></div>
    <div><label class="lbl" for="y-first">This week’s first step</label><input type="text" id="y-first" data-bind="ydraft" data-k="firstStep" placeholder="One thing you can finish in seven days" value="${esc(d.firstStep)}"></div>`;
  const last = ystep === YSTEPS.length - 1;
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">${yEditing ? 'Editing your goal' : state.goals.length ? 'Add a goal' : 'Begin your Sovereign Year'} · Step ${ystep+1} of ${YSTEPS.length} · ${S.title}</p><div class="progress" style="--n:${YSTEPS.length}">${prog}</div></div>
    <div class="stack"><h2 class="q">${S.q}</h2><p class="hint">${S.hint}</p>${body}${yErr?`<p class="err" role="alert">${esc(yErr)}</p>`:''}</div>
    <div class="step-nav">
      ${ystep>0 ? `<button class="btn ghost" type="button" data-act="yBack">Back</button>` : `<button class="btn text" type="button" data-act="yCancel">Cancel</button>`}
      ${last ? `<button class="btn gold" type="button" data-act="ySave">${yEditing ? 'Save changes' : state.goals.length ? 'Add this goal' : 'Begin my Sovereign Year'}</button>` : `<button class="btn" type="button" data-act="yNext">Next</button>`}
    </div>
  </section>`;
}

function renderFuture(){
  const y = G();
  if (!isPlus()) return `<section class="stack-lg"><div class="stack-sm"><p class="eyebrow">Future</p><h2>Now build what’s next</h2></div>
      <div class="ppf"><div><svg class="emb" aria-hidden="true"><use href="#e-narrow"/></svg><b>Past</b><span>Where it came from. You trace it.</span></div><div><svg class="emb" aria-hidden="true"><use href="#e-tent"/></svg><b>Present</b><span>What you do today. You hold it.</span></div><div class="now"><svg class="emb" aria-hidden="true"><use href="#e-sunrise"/></svg><b>Future</b><span>Who you are building. You plan it.</span></div></div>
      ${plusLock('Your Sovereign Year', 'One goal, built over 52 weeks: a small step each week, a Sunday review, four seasons and the Mirror as your coach.')}${y ? '<p class="muted small">Your Sovereign Year is saved and will be waiting for you.</p>' : ''}</section>`;
  if (!y){
    return `<section class="stack-lg">
      <div class="stack-sm"><p class="eyebrow">Future</p><h2>Now build what’s next</h2></div>
      <div class="ppf">
        <div><svg class="emb" aria-hidden="true"><use href="#e-narrow"/></svg><b>Past</b><span>Where it came from. You trace it.</span></div>
        <div><svg class="emb" aria-hidden="true"><use href="#e-tent"/></svg><b>Present</b><span>What you do today. You hold it.</span></div>
        <div class="now"><svg class="emb" aria-hidden="true"><use href="#e-sunrise"/></svg><b>Future</b><span>Who you are building. You plan it.</span></div>
      </div>
      <p>Breaking a pattern frees up time and energy. Your <b>Sovereign Year</b> puts it to good use: one goal, built over 52 weeks, one small step a week, with a review every Sunday and four seasons to mark the way.</p>
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
      ${y.measure ? `<div><label class="lbl" for="yr-value">Your figure now (${esc(y.measure.unit || 'number')})</label><input type="text" inputmode="decimal" id="yr-value" data-bind="yr" data-k="value" placeholder="Where are you this week?" value="${esc(yr.value != null ? String(yr.value) : '')}"></div>` : ''}
      ${n < 52 ? `<div><label class="lbl" for="yr-next">Next week’s step</label><input type="text" id="yr-next" data-bind="yr" data-k="next" placeholder="One thing you can finish in seven days" value="${esc(yr.next||'')}">
        ${mirrorOn() ? `<button class="btn text" type="button" data-act="yMirror"${yearBusy?' disabled':''}>${yearBusy?'The Mirror is thinking…':'Ask the Mirror to suggest a step'}</button>` : ''}
        ${yearMirror ? `<p class="small muted"><em>${esc(yearMirror.why||'')}</em></p>` : ''}${yearMirrorErr?`<p class="err">${esc(yearMirrorErr)}</p>`:''}</div>` : ''}
      ${yErr?`<p class="err" role="alert">${esc(yErr)}</p>`:''}
      <div><button class="btn gold" type="button" data-act="yReviewSave">Close the week</button></div>
    </div>`;
  return `<section class="stack-lg">
    ${goalSwitcher()}
    <div class="stack-sm"><p class="eyebrow">Future \u00b7 ${state.goals.length > 1 ? (state.goalIdx === 0 ? 'your main goal' : 'goal ' + (state.goalIdx + 1)) : 'your Sovereign Year'}</p><h2>${esc(y.goal)}</h2></div>
    <div class="rank year">
      <div class="ringwrap">${ring52(done, n)}<span class="ringcap" style="color:var(--sky-soft)">week of 52</span></div>
      <div class="stack-sm">
        <p class="eyebrow">${S.name} · weeks ${S.from}–${S.to}</p>
        <p class="identity" style="color:var(--crack)">I am someone who ${esc(y.identity)}</p>
        <p class="muted small">${done} of 52 weekly steps done · began ${fmtLong(fromKey(y.start))}</p>
        ${y.fromPattern && realPatterns().find(p=>p.id===y.fromPattern) ? `<p class="muted small">Linked to breaking: <b style="color:var(--sky-ink)">${esc(realPatterns().find(p=>p.id===y.fromPattern).name)}</b></p>` : ''}
      </div>
    </div>
    ${finished ? `<div class="empty">${emb('crown')}<h3>Your Sovereign Year is complete.</h3><p class="muted">Read your letter again. Then, when you’re ready, begin the next one.</p><button class="btn gold" type="button" data-act="yNewYear">Begin a new year</button></div>` : `
    <div class="dare">
      <div class="row"><span class="emb-badge">${emb('sprout')}</span><div class="stack-sm" style="gap:2px"><p class="eyebrow">This week’s step · week ${n}</p><p class="muted small">${fmtShort(weekStart(n))} to ${fmtShort(addDays(weekStart(n),6))} · +10 points when done</p></div></div>
      ${cur.step ? `<p class="text">${esc(cur.step)}</p>` : `<div><label class="lbl" for="y-step">Set this week’s step</label><input type="text" id="y-step" data-bind="ystepnow" placeholder="One thing you can finish in seven days" value="${esc(stepNow)}"></div><div><button class="btn small" type="button" data-act="ySetStep">Set my step</button></div>`}
      ${cur.step ? `<div class="row">${cur.done==='yes' ? '<span class="ok">Done. Well built.</span><button class="btn text" type="button" data-act="yStepUndo">Undo</button>'
        : cur.done==='partly' ? '<span class="muted small">Partly done.</span><button class="btn gold small" type="button" data-act="yStepDone">I finished it</button>'
        : '<button class="btn gold" type="button" data-act="yStepDone">I did it</button>'}</div>` : ''}
    </div>`}
    ${measureCard(y)}
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
      ${yearEndArmed ? `<span class="confirm">Remove this goal? Its weeks will be cleared.<button class="btn danger small" type="button" data-act="yEnd">End it</button><button class="btn text" type="button" data-act="yEndNo">Keep going</button></span>` : `<button class="btn text" type="button" data-act="yEndArm">${state.goals.length > 1 ? 'Remove this goal' : 'End this year'}</button>`}
    </div>
  </section>`;
}
let yr = {}, stepNow = '';

/* ---------- Crossing Plus ---------- */
const PRICES = {monthly:'£4.99', yearly:'£39'};
let plusInfo = api.plusInfo || {plus:false, admin:false};
const isPlus = () => !!plusInfo.plus;
let plusBusy = '', plusErr = '', welcomeTries = 0, adminStats = null, adminErr = '';
const activeCount = () => realPatterns().filter(p => !p.released).length;
const plusLink = (label) => `<a class="btn plus-btn small" href="#plus">${label} · Plus</a>`;
function plusLock(title, line){
  return `<div class="plus-lock">
    <span class="plus-tag">Crossing Plus</span>
    <h3>${title}</h3>
    <p class="muted">${line}</p>
    <div class="row"><a class="btn gold" href="#plus">See Plus</a><span class="muted small">From ${PRICES.monthly} a month. Free for Indigo Estate members.</span></div>
  </div>`;
}

function renderPlus(){
  const benefits = [
    ['narrow','Unlimited patterns','Work on more than one pattern at a time.'],
    ['eye','Question the belief','The seven-step inquiry that loosens the belief beneath the pattern.'],
    ['sunrise','The Future','Your Sovereign Year: one goal, 52 weekly steps, four seasons, Sunday reviews.'],
    ['seal','The Mirror','AI reflections on your patterns, your week and your next step.']
  ];
  if (isPlus()){
    const end = plusInfo.periodEnd ? fmtLong(new Date(plusInfo.periodEnd)) : '';
    return `<section class="stack-lg">
      <div class="stack-sm"><p class="eyebrow">Crossing Plus</p><h2>You have Crossing Plus</h2></div>
      <div class="rank"><span class="emb-badge">${emb('crown')}</span><div class="stack-sm">
        <p class="title">Plus</p>
        <p class="muted small">${plusInfo.admin && !plusInfo.hasCustomer ? 'Included with your owner account.' : plusInfo.cancelAtPeriodEnd ? `Ends on ${end}. You keep everything until then.` : end ? `Renews on ${end}.` : 'Active.'}</p>
      </div></div>
      <ul class="gate-points">${benefits.map(([e,t,l]) => `<li>${emb(e)}<span><b>${t}.</b> ${l}</span></li>`).join('')}</ul>
      ${plusInfo.hasCustomer ? `<div class="row"><button class="btn ghost" type="button" data-act="portal"${plusBusy?' disabled':''}>${plusBusy==='portal'?'Opening…':'Manage or cancel my plan'}</button></div>` : ''}
      ${plusErr?`<p class="err" role="alert">${esc(plusErr)}</p>`:''}
    </section>`;
  }
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Crossing Plus</p><h2>Go deeper, and build what comes next</h2></div>
    <p>The free Crossing gives you everything you need to break one pattern, day by day. Plus adds the deeper work.</p>
    <ul class="gate-points">${benefits.map(([e,t,l]) => `<li>${emb(e)}<span><b>${t}.</b> ${l}</span></li>`).join('')}</ul>
    <div class="plans">
      <div class="plan"><p class="eyebrow">Monthly</p><p class="price">${PRICES.monthly}<span> a month</span></p><button class="btn gold" type="button" data-act="checkout" data-plan="monthly"${plusBusy?' disabled':''}>${plusBusy==='monthly'?'Opening…':'Choose monthly'}</button></div>
      <div class="plan best"><p class="eyebrow">Yearly · save 35%</p><p class="price">${PRICES.yearly}<span> a year</span></p><button class="btn gold" type="button" data-act="checkout" data-plan="yearly"${plusBusy?' disabled':''}>${plusBusy==='yearly'?'Opening…':'Choose yearly'}</button></div>
    </div>
    ${plusErr?`<p class="err" role="alert">${esc(plusErr)}</p>`:''}
    <div class="panel"><p><b>Indigo Estate member?</b> Plus is included in your membership. Choose either plan, tap <b>Add promotion code</b> on the payment page, and enter the member code from your members’ area. You won’t be charged.</p></div>
    <p class="muted small">Payments are handled securely by Stripe. Cancel any time from this page; you keep Plus until the end of the period you’ve paid for. Everything you’ve written stays yours either way.</p>
  </section>`;
}

let confirmTried = false;
function renderWelcomePlus(){
  const cs = new URLSearchParams(location.search).get('cs');
  if (cs && !confirmTried && !isPlus()){
    confirmTried = true;
    api.confirmCheckout(cs).then(async () => { try { plusInfo = await api.getPlus() || plusInfo; } catch(e){} history.replaceState(null, '', location.pathname + location.hash); if (view() === 'welcome-plus') render(); }).catch(() => {});
  }
  if (isPlus()) return `<section class="empty">${emb('crown')}<p class="eyebrow">Welcome to Plus</p><h3>Everything is unlocked.</h3><p class="muted">Begin your Sovereign Year, question a belief, or trace another pattern.</p><div class="row" style="justify-content:center"><a class="btn gold" href="#future">Go to the Future</a><a class="btn ghost" href="#patterns">My patterns</a></div></section>`;
  if (welcomeTries < 15){
    welcomeTries++;
    setTimeout(async () => { try { plusInfo = await api.getPlus() || plusInfo; } catch(e){} if (view() === 'welcome-plus') render(); }, 2000);
    return `<section class="splash"><svg class="emb" aria-hidden="true"><use href="#e-seal"/></svg>Confirming your payment…</section>`;
  }
  return `<section class="empty"><h3>Your payment is still being confirmed.</h3><p class="muted">This can take a minute. Refresh the page shortly. If Plus still isn’t showing, email enquiries@indigoestate.co.uk and we’ll sort it.</p></section>`;
}

function renderOwner(){
  if (!plusInfo.admin) return `<section class="empty"><h3>This page is for the owner only.</h3></section>`;
  if (!adminStats && !adminErr){ api.adminStats().then(s => { adminStats = s; if (view()==='owner') render(); }).catch(() => { adminErr = 'Couldn’t load the figures. Refresh to try again.'; if (view()==='owner') render(); }); }
  const s = adminStats;
  const card = (n, l) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`;
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Owner dashboard</p><h2>How The Crossing is being used</h2></div>
    <p class="muted small">Counts only. Members’ journals and email addresses are never shown here.</p>
    ${adminErr?`<p class="err">${esc(adminErr)}</p>`:''}
    ${!s ? '<p class="muted">Loading…</p>' : `
    <p class="eyebrow">Members</p>
    <div class="stats">${card(s.members,'Members in total')}${card(s.joined7,'Joined this week')}${card(s.joined30,'Joined in 30 days')}</div>
    <p class="eyebrow">Activity, last 7 days</p>
    <div class="stats">${card(s.active7,'Used the app')}${card(s.checkingIn7,'Checked in')}${card(s.checkins7,'Check-ins')}</div>
    <p class="eyebrow">The work</p>
    <div class="stats">${card(s.patterns,'Patterns traced')}${card(s.released,'Patterns released')}${card(s.years,'Sovereign Years')}</div>
    <div class="stats">${card(s.goals ?? 0,'Goals in progress')}${card(s.habits ?? 0,'Habits being built')}${card(s.habitTicks7 ?? 0,'Habit ticks this week')}</div>
    <p class="eyebrow">Plus and reminders</p>
    <div class="stats">${card(s.plusActive,'Plus members')}${card(s.plusCancelling,'Plus, cancelling')}${card(s.mirror30,'Mirror uses, 30 days')}</div>
    <div class="stats">${card(s.remindersMorning,'Morning reminders')}${card(s.remindersEvening,'Evening reminders')}${card(s.remindersMorning + s.remindersEvening,'Reminders in total')}</div>
    <button class="btn ghost small" type="button" data-act="ownerRefresh" style="align-self:flex-start">Refresh figures</button>`}
  </section>`;
}

/* ---------- Phase 2: number goals, several goals, daily habits ---------- */
let yEditing = false, figureDraft = '', habitDraft = {name:'', cue:''}, habitFormOpen = false, habitDelArmed = null;
const HABITS_FREE = 1, HABITS_PLUS = 5;
const activeHabits = () => state.habits.filter(h => !h.archived);
const habitLimit = () => isPlus() ? HABITS_PLUS : HABITS_FREE;
const num = v => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : null; };
function measureFrom(d){
  if (d.mType !== 'number') return null;
  const start = num(d.mStart), target = num(d.mTarget);
  if (start === null || target === null || start === target) return null;
  return {unit:(d.mUnit||'').trim().slice(0, 20), start, target};
}
const fmtNum = (n, unit) => { const r = Math.round(n * 100) / 100; const u = (unit||'').trim(); const t = r.toLocaleString('en-GB'); return !u ? t : /^[£$€]$/.test(u) ? u + t : `${t} ${u}`; };
function measureNow(y){
  let cur = y.measure.start, at = 0;
  Object.keys(y.weeks).map(Number).sort((a,b)=>a-b).forEach(w => { const v = y.weeks[w].value; if (typeof v === 'number'){ cur = v; at = w; } });
  const frac = Math.max(0, Math.min(1, (cur - y.measure.start) / (y.measure.target - y.measure.start)));
  return {cur, at, frac};
}
function measureChart(y){
  const m = y.measure, pts = [[0, m.start]];
  Object.keys(y.weeks).map(Number).sort((a,b)=>a-b).forEach(w => { const v = y.weeks[w].value; if (typeof v === 'number') pts.push([w, v]); });
  const W = 320, H = 150, L = 46, R = 20, T = 12, B = 26;
  const lastWeek = Math.max(13, ...pts.map(p => p[0]), yearWeek());
  const vals = pts.map(p => p[1]).concat([m.start, m.target]);
  let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
  const x = w => L + (w / lastWeek) * (W - L - R), y_ = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y_(p[1]).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts[pts.length-1][0]).toFixed(1)} ${(H - B).toFixed(1)} L${x(0).toFixed(1)} ${(H - B).toFixed(1)} Z`;
  const ticks = [0, Math.round(lastWeek / 2), lastWeek];
  return `<svg class="mchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Your figure each week, from ${fmtNum(m.start, m.unit)} towards ${fmtNum(m.target, m.unit)}">
    <line class="axis" x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}"/>
    <line class="target" x1="${L}" y1="${y_(m.target).toFixed(1)}" x2="${W-R}" y2="${y_(m.target).toFixed(1)}"/>
    <text class="tl" x="${L-6}" y="${(y_(m.target)+4).toFixed(1)}" text-anchor="end">${esc(fmtNum(m.target, m.unit))}</text>
    <text class="tl" x="${L-6}" y="${(y_(m.start)+4).toFixed(1)}" text-anchor="end">${esc(fmtNum(m.start, m.unit))}</text>
    ${pts.length > 1 ? `<path class="area" d="${area}"/><path class="line" d="${line}"/>` : ''}
    ${pts.map((p, i) => `<circle class="${i === pts.length - 1 ? 'pt last' : 'pt'}" cx="${x(p[0]).toFixed(1)}" cy="${y_(p[1]).toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3}"><title>Week ${p[0]}: ${esc(fmtNum(p[1], m.unit))}</title></circle>`).join('')}
    ${ticks.map(t => `<text class="tl" x="${x(t).toFixed(1)}" y="${H - 8}" text-anchor="middle">${t === 0 ? 'Start' : 'Wk ' + t}</text>`).join('')}
  </svg>`;
}
function measureCard(y){
  if (!y.measure) return '';
  const m = y.measure, {cur, at, frac} = measureNow(y), n = yearWeek(), thisWeek = (y.weeks[n] || {}).value;
  const left = m.target - cur;
  return `<div class="dare measure">
    <div class="row"><span class="emb-badge">${emb('sinai')}</span><div class="stack-sm" style="gap:2px"><p class="eyebrow">Your number</p><p class="muted small">From ${esc(fmtNum(m.start, m.unit))} to ${esc(fmtNum(m.target, m.unit))}</p></div></div>
    <div class="mnow"><b>${esc(fmtNum(cur, m.unit))}</b><span>${at ? `as of week ${at}` : 'your starting point'} · ${Math.round(frac * 100)}% of the way</span></div>
    <span class="track"><span class="fill" style="width:${Math.round(frac * 100)}%"></span></span>
    <p class="small muted">${frac >= 1 ? 'Target reached.' : `${esc(fmtNum(Math.abs(left), m.unit))} to go.`}</p>
    <div class="chartbox">${measureChart(y)}</div>
    <div class="figrow"><label class="lbl" for="y-fig">Your figure this week${typeof thisWeek === 'number' ? ` (now ${esc(fmtNum(thisWeek, m.unit))})` : ''}</label>
      <div class="row"><input type="text" inputmode="decimal" id="y-fig" data-bind="yfig" placeholder="e.g. ${esc(String(m.target))}" value="${esc(figureDraft)}"><button class="btn small" type="button" data-act="yFigure">Save figure</button></div></div>
  </div>`;
}
function goalSwitcher(){
  if (!state.goals.length) return '';
  const can = state.goals.length < MAX_GOALS;
  if (state.goals.length === 1 && !can) return '';
  return `<div class="goaltabs" role="tablist" aria-label="Your goals">
    ${state.goals.map((g, i) => `<button type="button" role="tab" class="goaltab${i === state.goalIdx ? ' on' : ''}" aria-selected="${i === state.goalIdx}" data-act="yPick" data-i="${i}"><span>${i === 0 ? 'Main goal' : 'Goal ' + (i + 1)}</span>${esc(g.goal)}</button>`).join('')}
    ${can ? `<a class="goaltab add" href="#yearsetup" data-act="yStart"><span>Up to ${MAX_GOALS}</span>+ Add a goal</a>` : ''}
  </div>`;
}

/* Habits I'm building (daily ticks), shown on Today */
function habitStreak(id){
  let n = 0, d = new Date();
  const has = k => !!(state.habitChecks[k] && state.habitChecks[k][id]);
  if (!has(dkey(d))) d = addDays(d, -1);
  while (has(dkey(d))){ n++; d = addDays(d, -1); }
  return n;
}
const habitTotal = id => Object.keys(state.habitChecks).filter(k => state.habitChecks[k][id]).length;
function renderHabits(){
  const k = todayKey(), list = activeHabits(), limit = habitLimit();
  const rows = list.map(h => {
    const done = !!(state.habitChecks[k] && state.habitChecks[k][h.id]);
    let dots = ''; for (let i = 6; i >= 0; i--){ const dk = dkey(addDays(new Date(), -i)); const on = state.habitChecks[dk] && state.habitChecks[dk][h.id]; dots += `<i class="${on ? 'on' : ''}${i === 0 ? ' today' : ''}" title="${fmtShort(fromKey(dk))}${on ? ': done' : ''}"></i>`; }
    const st = habitStreak(h.id);
    return `<div class="habit${done ? ' done' : ''}">
      <button type="button" class="htick" data-act="hTick" data-id="${esc(h.id)}" aria-pressed="${done}" aria-label="${done ? 'Done today: ' : 'Mark done today: '}${esc(h.name)}">${done ? emb('seal') : ''}</button>
      <div class="hbody"><b>${esc(h.name)}</b>${h.cue ? `<span class="muted small">After I ${esc(h.cue)}</span>` : ''}
        <div class="hmeta"><span class="hdots" aria-label="Last 7 days">${dots}</span><span class="small muted">${st ? `${st} day${st > 1 ? 's' : ''} in a row` : 'Start today'} · ${habitTotal(h.id)} in total</span></div></div>
      ${habitDelArmed === h.id ? `<span class="confirm small">Remove?<button class="btn danger small" type="button" data-act="hRemove" data-id="${esc(h.id)}">Remove</button><button class="btn text" type="button" data-act="hRemoveNo">Keep</button></span>` : `<button class="btn text small hdel" type="button" data-act="hRemoveArm" data-id="${esc(h.id)}" aria-label="Remove ${esc(h.name)}">Remove</button>`}
    </div>`;
  }).join('');
  const canAdd = list.length < limit;
  const form = habitFormOpen ? `<div class="panel">
      <div><label class="lbl" for="h-name">The habit</label><input type="text" id="h-name" data-bind="habit" data-k="name" placeholder="e.g. Walk for 20 minutes" value="${esc(habitDraft.name)}"></div>
      <div><label class="lbl" for="h-cue">After I… (optional)</label><input type="text" id="h-cue" data-bind="habit" data-k="cue" placeholder="e.g. drop the children at school" value="${esc(habitDraft.cue)}">
        <p class="muted small" style="margin-top:6px">Tie it to something you already do every day. It’s the most reliable way to make a new habit stick.</p></div>
      <div class="row"><button class="btn gold small" type="button" data-act="hAdd">Add habit</button><button class="btn text" type="button" data-act="hFormClose">Cancel</button></div>
    </div>`
    : canAdd ? `<button class="btn ghost small" type="button" data-act="hFormOpen" style="align-self:flex-start">+ Add a habit to build</button>`
    : !isPlus() ? `<p class="muted small">Free plan: one habit at a time. <a href="#plus">Plus</a> lets you build up to ${HABITS_PLUS}.</p>`
    : `<p class="muted small">You’re building ${HABITS_PLUS} habits, the most at once. Remove one to add another.</p>`;
  return `<div class="stack habits">
    <div class="stack-sm"><p class="eyebrow">Habits I’m building</p><p class="muted small">The patterns above are what you’re leaving behind. These are what you’re building instead, one tick a day. +1 point each.</p></div>
    ${rows || (habitFormOpen ? '' : '<p class="muted small">No habits yet. Add one small thing you want to do every day.</p>')}
    ${form}
  </div>`;
}

/* ---------- Phone notifications ---------- */
const MORNING_TIMES = ['06:30','07:00','07:30','08:00','08:30','09:00'];
const EVENING_TIMES = ['19:00','19:30','20:00','20:30','21:00','21:30','22:00'];
const clock = t => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}${m ? ':' + String(m).padStart(2,'0') : ''}${h < 12 ? 'am' : 'pm'}`; };
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
let push = {state:'checking', endpoint:'', prefs:{morning:'07:30', evening:'21:00', sunday:true}, busy:'', err:'', msg:''};
let nudgeHidden = false; try { nudgeHidden = localStorage.getItem('crossing-push-nudge') === 'hidden'; } catch(e){}
function b64ToU8(s){ const pad = '='.repeat((4 - s.length % 4) % 4); const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); }
const prefArgs = () => { const o = {sunday: !!push.prefs.sunday}; if (push.prefs.morning) o.morning = push.prefs.morning; if (push.prefs.evening) o.evening = push.prefs.evening; return o; };

async function pushInit(){
  try {
    if (!pushSupported()){ push.state = isIOS && !isStandalone() ? 'ios-install' : 'unsupported'; return; }
    if (Notification.permission === 'denied'){ push.state = 'denied'; return; }
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg && await reg.pushManager.getSubscription();
    if (sub){
      push.endpoint = sub.endpoint;
      const p = await api.pushMine(sub.endpoint);
      if (p){ push.state = 'on'; push.prefs = {morning:p.morning || '', evening:p.evening || '', sunday:p.sunday}; return; }
    }
    push.state = 'off';
  } catch(e){ push.state = 'off'; }
}
pushInit().then(() => { if (['today','witness'].includes(view())) render(); });

function renderNudge(){
  if (nudgeHidden || !['off','ios-install'].includes(push.state)) return '';
  return `<div class="nudge">
    <span class="emb-badge">${emb('lamp')}</span>
    <p><b>Get your reminders on your phone.</b> A gentle nudge for your morning promise, your evening reflection and your Sunday review.</p>
    <div class="row"><a class="btn small" href="#witness">Set it up</a><button class="btn text" type="button" data-act="nudgeHide">Not now</button></div>
  </div>`;
}

function renderPush(){
  let body = '';
  if (push.state === 'checking') body = `<p class="muted small">Checking this device…</p>`;
  else if (push.state === 'ios-install') body = `<p>On iPhone and iPad, notifications only work once The Crossing is on your home screen:</p>
    <ol class="small steps"><li>Tap the <b>Share</b> button in Safari (the square with an arrow).</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li><li>Open The Crossing from its new icon, come back to this page, and tap <b>Turn on notifications</b>.</li></ol>
    <p class="muted small">Needs iOS 16.4 or later.</p>`;
  else if (push.state === 'unsupported') body = `<p class="muted small">This browser can’t show notifications. Try Chrome, Edge or Firefox, or on iPhone add The Crossing to your home screen first. The daily email reminder works everywhere.</p>`;
  else if (push.state === 'denied') body = `<p>Notifications are blocked for this site on this device.</p><p class="muted small">To allow them: open your browser’s site settings for crossing.indigoestate.co.uk (usually the padlock or “i” icon next to the address), set <b>Notifications</b> to <b>Allow</b>, then reload this page. On Android you may also need to allow notifications for your browser in the phone’s Settings.</p>`;
  else {
    const on = push.state === 'on';
    const sel = (id, list, val, label) => `<div><label class="lbl" for="${id}">${label}</label><select id="${id}" data-bind="pushPref" data-k="${id === 'pn-m' ? 'morning' : 'evening'}"><option value="">Off</option>${list.map(t => `<option value="${t}"${t === val ? ' selected' : ''}>${clock(t)}</option>`).join('')}</select></div>`;
    body = `<div class="two">${sel('pn-m', MORNING_TIMES, push.prefs.morning, 'Morning promise')}${sel('pn-e', EVENING_TIMES, push.prefs.evening, 'Evening reflection')}</div>
      <label class="check"><input type="checkbox" id="pn-s" data-bind="pushPref" data-k="sunday"${push.prefs.sunday ? ' checked' : ''}> <span>Sunday 6pm: close your week (only if you have a Sovereign Year goal)</span></label>
      <div class="row">${on
        ? `<button class="btn ghost small" type="button" data-act="pushTest"${push.busy?' disabled':''}>${push.busy==='test'?'Sending…':'Send me a test'}</button><button class="btn text" type="button" data-act="pushOff"${push.busy?' disabled':''}>Turn off on this device</button>`
        : `<button class="btn gold" type="button" data-act="pushOn"${push.busy?' disabled':''}>${push.busy==='on'?'Turning on…':'Turn on notifications'}</button>`}</div>
      <p class="muted small">${on ? 'On for this device. Changes save as you make them. ' : ''}Notifications only ever say it’s time to check in; nothing you’ve written appears on your lock screen.</p>`;
  }
  return `<div class="panel" id="notifications">
    <div class="row">${emb('lamp')}<div class="stack-sm" style="gap:2px"><p class="eyebrow">Phone notifications</p><p class="muted small">Reminders that pop up on this device, like any other app.</p></div></div>
    ${body}
    ${push.err?`<p class="err" role="alert">${esc(push.err)}</p>`:''}${push.msg?`<p class="ok">${esc(push.msg)}</p>`:''}
  </div>`;
}

function weekSummary(){
  // Only fall back to the example when there's nothing of the member's own to report.
  const ex = showingExample() && !state.goals.length && !activeHabits().length;
  const list = ex ? [EXAMPLE] : realPatterns().filter(p => !p.released);
  const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(new Date(), -i));
  const dset = new Set(days.map(dkey));
  const name = (state.witness.name||'').trim() || 'my accountability partner';
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
    L.push(`• ${p.name}: ${h} of 7 days free, caught it ${n}, slipped ${s}. ${Math.min(stats(p).held,40)} of 40 days free so far (momentum ${strength(p)}%).`);
    if (ur.length) L.push(`  Urges this week: ${ur.length}, got through ${ur.filter(u=>u.outcome==='rode').length}.`);
    if (p.truth) L.push(`  The truth I’m choosing: ${p.truth}`);
  }
  if (!ex){
    const slips = [];
    days.forEach(d => { const m = state.slips[dkey(d)]; if (!m) return;
      for (const id in m){ const p = realPatterns().find(x => x.id === id); if (p && m[id] && m[id].trim()) slips.push(`  – ${fmtShort(d)} (${p.name}): ${m[id].trim()}`); } });
    if (slips.length) L.push('', 'Where I slipped, and what came just before:', ...slips);
    const q = state.quest; if (q.start && !q.complete) L.push('', `7-day challenge: ${TRIAL.filter((t,i)=>q.done[i]).length} of 7 done.`);
    if (state.goals.length){
      const keep = state.goalIdx; L.push('', state.goals.length > 1 ? 'My Sovereign Year goals:' : 'My Sovereign Year:');
      state.goals.forEach((g, i) => { state.goalIdx = i; const n = yearWeek(), w = g.weeks[n] || {};
        L.push(`\u2022 ${g.goal}: week ${n} of 52, ${yearDone()} steps done.`, `  This week\u2019s step: ${w.step || 'not set yet'}${w.done==='yes' ? ' (done)' : ''}`);
        if (g.measure){ const m = measureNow(g); L.push(`  Now at ${fmtNum(m.cur, g.measure.unit)} of ${fmtNum(g.measure.target, g.measure.unit)} (${Math.round(m.frac * 100)}%).`); } });
      state.goalIdx = keep;
    }
    const hs = activeHabits();
    if (hs.length){ L.push('', 'Habits I\u2019m building:'); hs.forEach(h => { const c = days.filter(d => state.habitChecks[dkey(d)] && state.habitChecks[dkey(d)][h.id]).length; L.push(`\u2022 ${h.name}: ${c} of 7 days.`); }); }
    L.push(`Level: ${RANKS[rankOf(manna())].n} (${manna()} manna).`);
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
    <div class="row"><button class="btn ghost small" type="button" data-act="export">Download my journal</button><button class="btn ghost small" type="button" data-act="signOut">Sign out</button><a class="btn ghost small" href="#plus">${isPlus() ? 'My Plus plan' : 'Get Crossing Plus'}</a>${plusInfo.admin ? '<a class="btn ghost small" href="#owner">Owner dashboard</a>' : ''}</div>
    ${delArmed ? `<div class="confirm"><span>Delete your account, journal and reminders for good? This can’t be undone.</span><button class="btn danger small" type="button" data-act="delAccount"${delBusy?' disabled':''}>${delBusy?'Deleting…':'Delete everything'}</button><button class="btn text" type="button" data-act="delCancel">Keep my account</button></div>`
      : `<button class="btn text" type="button" data-act="delArm" style="align-self:flex-start">Delete my account</button>`}
  </div>`;
}
function renderWitness(){
  const w = state.witness;
  return `<section class="stack-lg">
    <div class="stack-sm"><p class="eyebrow">Accountability partner</p><h2>Change is easier with someone in your corner</h2></div>
    <p class="muted">Pick one person you trust, who’ll ask how it’s going rather than try to fix you. Send them a quick check-in every day or every week. A promise feels more real once someone else has heard it.</p>
    <div class="stack">
      <div><label class="lbl" for="wName">My accountability partner</label><input type="text" id="wName" data-bind="wName" placeholder="Their name" value="${esc(w.name)}"></div>
      <div><span class="lbl">I’ll send my check-in</span><div class="seg" role="group" aria-label="Check-in rhythm">${['daily','weekly'].map(r=>`<button type="button" data-act="rhythm" data-v="${r}" aria-pressed="${w.rhythm===r}">${r==='daily'?'Every day':'Every week'}</button>`).join('')}</div></div>
      <div><label class="lbl" for="wNext">${w.rhythm==='daily'?'Tomorrow':'Next week'} I commit to</label><textarea id="wNext" data-bind="wNext" placeholder="One clear promise they can check on.">${esc(w.next)}</textarea></div>
      <div><label class="lbl" for="wStake">If I don’t send my check-in, I will</label><input type="text" id="wStake" data-bind="wStake" placeholder="e.g. give £10 to a cause they pick" value="${esc(w.stake)}">
        <p class="muted small" style="margin-top:6px">Optional. A small forfeit you’ve agreed out loud makes it harder to quietly give up. Your partner holds you to it; the app doesn’t take any money.</p></div>
    </div>
    <div class="letter">
      <div class="section-head"><p class="eyebrow">This week’s check-in</p><button class="btn" type="button" data-act="copy">Copy to send</button></div>
      <pre id="summary">${esc(weekSummary())}</pre>
      <p class="muted small">Paste it into a text, WhatsApp or email to your partner.</p>
    </div>
    ${renderPush()}
    ${renderReminder()}
    ${renderAccount()}
  </section>`;
}

function render(){
  syncQuest();
  const v = view();
  const tab = v === 'question' || v === 'trace' ? 'patterns' : v === 'yearsetup' ? 'future' : v;
  const hp = document.querySelector('.hdr-plus'); if (hp){ hp.textContent = isPlus() ? 'Plus' : 'Get Plus'; hp.classList.toggle('on', isPlus()); }
  document.querySelectorAll('.tabs a').forEach(a => { if (a.dataset.v === tab) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  const fn = {today:renderToday, quest:renderQuest, patterns:renderPatterns, trace:renderTrace, journey:renderJourney, witness:renderWitness, question:renderQuestion, future:renderFuture, yearsetup:renderYearSetup, plus:renderPlus, 'welcome-plus':renderWelcomePlus, owner:renderOwner}[v];
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
    h += `<p class="eyebrow">Feeling the urge · ${esc(p.name)}</p>
      <h2 id="urgeTitle">Stop. Breathe first.</h2>
      <div class="breath" aria-hidden="true">Breathe</div>
      <p class="muted">In as the circle grows, out slowly as it shrinks. Three rounds. An urge rises, peaks and passes, usually within minutes. You only have to outlast this one.</p>
      <button class="btn" type="button" data-act="urgeNext">I’ve breathed</button>`;
  } else if (urge.step === 1){
    h += `<p class="eyebrow">Remember why you’re doing this</p><h2 id="urgeTitle">This is what it costs.</h2>
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
      <div class="stack-sm"><span class="lbl">How strong is the urge? <span id="u-int">${urge.intensity}</span> of 10</span><input type="range" min="1" max="10" id="u-intensity" data-bind="urgeRange" value="${urge.intensity}" aria-label="Strength of the urge"></div>
      <div class="two"><button class="btn gold" type="button" data-act="urgeSave" data-v="rode">I got through it</button><button class="btn ghost" type="button" data-act="urgeSave" data-v="won">It won this time</button></div>`;
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
    state.urges.filter(u=>u.date===k).forEach(u => parts.push(`urge (${u.intensity}/10, ${u.outcome==='rode'?'got through it':'it won'}): ${u.trigger||'-'}`));
    return `${k}: ${parts.join(' | ') || 'no entries'}`;
  }).join('\n');
  const pats = realPatterns().filter(p=>!p.released).map(p => `- ${p.name}. Belief: ${p.belief||'-'}. Truth chosen: ${p.truth||'-'}.`).join('\n');
  try { weekRead = await api.mirrorWeek(pats, lines); }
  catch(e){ weekErr = errText(e, 'The Mirror couldn\u2019t answer just now. Try again.'); }
  weekBusy = false; render();
}

function journalText(){
  const L = ['THE CROSSING · my journal', 'Indigo Estate · exported ' + fmtLong(new Date()), `Level: ${RANKS[rankOf(manna())].n} (${manna()} manna)`, ''];
  realPatterns().forEach(p => {
    const st = stats(p);
    L.push('==== ' + p.name + ' ====', `${STAGES[stageOf(p)].name} · ${st.held} free · ${st.noticed} caught · ${st.slipped} slipped · momentum ${strength(p)}%`);
    [['What I do',p.habit],['Trigger',p.trigger],['Belief',p.belief],['The voice',p.voice],['Root',p.rootType?ROOTS[p.rootType].label:''],['First memory',p.rootStory],['What it protected',p.payoff],['What it costs',p.cost],['I am someone who',p.identity],['The truth I choose',p.truth],['When the trigger comes',p.practice]]
      .forEach(([k,v]) => { if (v) L.push(k + ': ' + v); });
    (p.inquiries||[]).forEach(q => { L.push('', `Inquiry ${q.date}: ${q.before}% → ${q.after}%`); [['Is it true',q.isTrue],['Certain',q.certain],['Supports it',q.forEv],['Doesn’t',q.againstEv],['When I believe it',q.react],['Without it',q.without],['Turnaround',q.turn],['Examples',q.examples]].forEach(([k,v]) => { if (v) L.push('  ' + k + ': ' + v); }); });
    if (p.released) L.push('Released on ' + p.releasedAt);
    L.push('');
  });
  { const keep = state.goalIdx;
    state.goals.forEach((y, gi) => { state.goalIdx = gi;
      L.push(`==== Sovereign Year${state.goals.length > 1 ? ' goal ' + (gi + 1) : ''} ====`, `Goal: ${y.goal}`, `I am someone who ${y.identity}`, `Began ${y.start} \u00b7 week ${yearWeek()} of 52`);
      if (y.measure) L.push(`Measured by: ${fmtNum(y.measure.start, y.measure.unit)} \u2192 ${fmtNum(y.measure.target, y.measure.unit)}`);
      if (y.why) L.push('Why: ' + y.why);
      y.seasons.forEach((m, i) => { if (m) L.push(`${SEASONS[i].name}: ${m}${(y.milestones||{})[i] ? ' (reached ' + y.milestones[i] + ')' : ''}`); });
      if (y.letter) L.push('Letter from my future self: ' + y.letter);
      Object.keys(y.weeks).map(Number).sort((a,b)=>a-b).forEach(i => { const w = y.weeks[i]; L.push(`Week ${i}: ${w.step||'-'}${w.done?' ['+w.done+']':''}${typeof w.value === 'number' ? ' \u00b7 figure ' + fmtNum(w.value, y.measure ? y.measure.unit : '') : ''}`); if (w.review){ if (w.review.helped) L.push('  Helped: ' + w.review.helped); if (w.review.blocked) L.push('  In the way: ' + w.review.blocked); } });
      L.push(''); });
    state.goalIdx = keep;
    if (state.habits.length){ L.push('==== Habits ===='); state.habits.forEach(h => L.push(`${h.name}${h.cue ? ' (after I ' + h.cue + ')' : ''}: ${habitTotal(h.id)} days done${h.archived ? ', removed' : ''}`)); L.push(''); }
  }
  const keys = new Set([...Object.keys(state.examens), ...Object.keys(state.slips), ...Object.keys(state.intentions), ...state.urges.map(u=>u.date)]);
  [...keys].sort().forEach(k => {
    const part = [];
    if (state.intentions[k]) part.push('Intention: ' + state.intentions[k]);
    const e = state.examens[k] || {};
    if (e.grateful) part.push('Thanks: ' + e.grateful); if (e.free) part.push('Did well: ' + e.free); if (e.pulled) part.push('Old pattern tugged: ' + e.pulled); if (e.tomorrow) part.push('For tomorrow: ' + e.tomorrow);
    const sl = state.slips[k] || {}; for (const id in sl){ const p = realPatterns().find(x=>x.id===id); if (sl[id]) part.push(`Slip (${p?p.name:'pattern'}): ${sl[id]}`); }
    state.urges.filter(u=>u.date===k).forEach(u => { const p = realPatterns().find(x=>x.id===u.pid); part.push(`Urge ${u.time||''} (${p?p.name:'pattern'}, ${u.intensity}/10, ${u.outcome==='rode'?'got through it':'it won'}): ${u.trigger||''}`); });
    if (part.length) L.push('---- ' + fmtLong(fromKey(k)) + ' ----', ...part, '');
  });
  return L.join('\n');
}

function startTrace(){ draft = blankDraft(); editingId = null; step = 0; stepErr = ''; }
function showRelease(p){
  const r = $('#release');
  $('#relName').textContent = p.name;
  $('#relTruth').textContent = p.truth ? '“' + p.truth + '”' : 'You broke free.';
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
    if (after > before){ const s = STONES.find(x => x.d === after); if (s) queueSeal({kicker:`Milestone · day ${s.d}`, name:s.name, line:s.line, emb:s.emb}); }
  },
  pledge(){ const n = new Date(); state.pledges[todayKey()] = pad(n.getHours())+':'+pad(n.getMinutes()); save(); render(); toast('Promise made. One day at a time. +1 point'); },
  dare(){ state.dares[todayKey()] = true; save(); render(); toast('Dare done. +5 points'); },
  trialStart(){ state.quest = {start:todayKey(), done:{}, complete:null, trials:state.quest.trials||0}; save(); render(); toast('Challenge started. Day one is open.'); },
  trialAbandon(b){ if (b.dataset.sure){ state.quest.start = null; state.quest.done = {}; save(); render(); } else { b.dataset.sure = '1'; b.textContent = 'Tap again to start over'; } },
  questDone(b){ const i = +b.dataset.i; state.quest.done[i] = todayKey(); save(); render(); toast(`Done: ${TRIAL[i].t}. +10 points`); },
  urgeOpen(b){ urge = {pid:b.dataset.id, step:0, trigger:'', intensity:5}; $('#urge').hidden = false; renderUrge(); },
  urgeNext(){ urge.step++; renderUrge(); },
  urgeClose(){ urge = null; $('#urge').hidden = true; },
  urgePick(b){ urge.trigger = b.dataset.v; const i = $('#u-trigger'); if (i) i.value = urge.trigger; },
  urgeSave(b){
    const n = new Date(), k = todayKey();
    state.urges.push({id:newId(), pid:urge.pid, date:k, time:pad(n.getHours())+':'+pad(n.getMinutes()), hour:n.getHours(), trigger:urge.trigger.trim(), intensity:urge.intensity, outcome:b.dataset.v});
    if (b.dataset.v === 'won'){ (state.checks[k] || (state.checks[k] = {}))[urge.pid] = 'slipped'; }
    save(); urge = null; $('#urge').hidden = true; render();
    toast(b.dataset.v === 'rode' ? 'You got through it. That’s how the new way gets stronger. +5 points' : 'Logged as a slip. Be honest with yourself, then start again.', 4000);
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
    toast('Pattern saved'); location.hash = 'patterns';
  },
  inqStart(b){ inq = {pid:b.dataset.id, step:0, data:{before:70, after:70}}; location.hash = 'question'; if (view()==='question') render(); },
  inqPick(b){ inq.data[b.dataset.k] = b.dataset.v; render(); },
  inqNext(){ if (inq.step === QSTEPS.length-2 && inq.data.after === 70) inq.data.after = inq.data.before; inq.step++; render(); window.scrollTo({top:0}); },
  inqBack(){ inq.step = Math.max(0, inq.step-1); render(); },
  inqCancel(){ inq = null; location.hash = 'patterns'; },
  inqSave(){
    const p = realPatterns().find(x => x.id === inq.pid);
    if (p){ const d = inq.data; (p.inquiries || (p.inquiries = [])).push({date:todayKey(), before:+d.before, after:+d.after, isTrue:d.isTrue||'', certain:d.certain||'', forEv:(d.forEv||'').trim(), againstEv:(d.againstEv||'').trim(), react:(d.react||'').trim(), without:(d.without||'').trim(), turn:(d.turn||'').trim(), examples:(d.examples||'').trim()}); save(); expanded = p.id;
      const drop = d.before - d.after; toast(drop > 0 ? `The belief loosened by ${drop} points. +8 points` : 'Kept. Come back to it; beliefs loosen over time. +8 points', 3600); }
    inq = null; location.hash = 'patterns';
  },
  toggle(b){ expanded = expanded === b.dataset.id ? '' : b.dataset.id; render(); },
  mirror(b){ askMirror(b.dataset.id); },
  week(){ readWeek(); },
  useTruth(b){ const p = realPatterns().find(x => x.id === b.dataset.id); if (p && p.mirror){ p.truth = p.mirror.truth; save(); render(); toast('Truth updated'); } },
  release(b){ const p = realPatterns().find(x => x.id === b.dataset.id); if (!p) return;
    p.released = true; p.releasedAt = todayKey(); save(); render(); showRelease(p); },
  yStart(){ if (state.goals.length >= MAX_GOALS){ toast(`You can work on up to ${MAX_GOALS} goals at once.`); location.hash = 'future'; return; } yEditing = false; ydraft = blankYear(); const ids = realPatterns().map(p => (p.identity||'').trim()).filter(Boolean); if (ids.length) ydraft.identity = ids[0]; ystep = 0; yErr = ''; if (view() === 'yearsetup') render(); },
  yPickId(b){ ydraft.identity = b.dataset.v; const i = $('#y-identity'); if (i) i.value = ydraft.identity; },
  yPickPattern(b){ ydraft.fromPattern = ydraft.fromPattern === b.dataset.v ? '' : b.dataset.v; render(); },
  yNext(){
    yErr = '';
    if (ystep === 0 && !ydraft.identity.trim()){ yErr = 'Finish the sentence: I am someone who…'; render(); return; }
    if (ystep === 1 && !ydraft.goal.trim()){ yErr = 'Name your one goal for the year.'; render(); return; }
    if (ystep === 2 && ydraft.mType === 'number'){ const a = num(ydraft.mStart), b = num(ydraft.mTarget); if (a === null || b === null){ yErr = 'Enter both numbers: where you are now and where you\u2019re heading.'; render(); return; } if (a === b){ yErr = 'Your target needs to be different from where you are now.'; render(); return; } }
    ystep = Math.min(YSTEPS.length - 1, ystep + 1); render(); window.scrollTo({top:0});
  },
  yBack(){ yErr = ''; ystep = Math.max(0, ystep - 1); render(); },
  yCancel(){ ydraft = null; location.hash = 'future'; },
  ySave(){
    const d = ydraft; yErr = '';
    if (!yEditing && !d.firstStep.trim()){ yErr = 'Name one small step for this week.'; render(); return; }
    if (yEditing && G()){
      Object.assign(G(), {identity:d.identity.trim(), goal:d.goal.trim(), why:d.why.trim(), fromPattern:d.fromPattern, seasons:d.seasons.map(s => s.trim()), letter:d.letter.trim(), measure:measureFrom(d)});
      if (d.firstStep.trim()) weekRec(yearWeek()).step = d.firstStep.trim();
      toast('Your goal is updated');
    } else {
      state.goals.push({id:newId(), identity:d.identity.trim(), goal:d.goal.trim(), why:d.why.trim(), fromPattern:d.fromPattern, seasons:d.seasons.map(s => s.trim()), letter:d.letter.trim(), start:todayKey(), weeks:{1:{step:d.firstStep.trim()}}, milestones:{}, measure:measureFrom(d)});
      state.goalIdx = state.goals.length - 1;
      queueSeal({kicker:'Week 1 of 52', name: state.goals.length > 1 ? d.goal.trim() : 'Your Sovereign Year', line:'You’re set. Now you build it, one small step a week.', emb:'sunrise'});
    }
    save(); ydraft = null; yr = {}; yEditing = false; location.hash = 'future';
  },
  yEdit(){ const y = G(); yEditing = true; const m = y.measure; ydraft = {identity:y.identity, goal:y.goal, why:y.why, fromPattern:y.fromPattern||'', seasons:[...y.seasons], letter:y.letter, firstStep:'', mType: m ? 'number' : 'steps', mUnit: m ? m.unit : '', mStart: m ? String(m.start) : '', mTarget: m ? String(m.target) : ''}; ystep = 0; yErr = ''; location.hash = 'yearsetup'; },
  ySetStep(){ const s = stepNow.trim(); if (!s){ toast('Write one small step first.'); return; } weekRec(yearWeek()).step = s; stepNow = ''; save(); render(); },
  yStepDone(){ weekRec(yearWeek()).done = 'yes'; save(); render(); toast('Step done. +10 points'); },
  yStepUndo(){ delete weekRec(yearWeek()).done; save(); render(); },
  yHow(b){ yr.how = b.dataset.v; render(); },
  yPid(b){ yr.pid = yr.pid === b.dataset.v ? '' : b.dataset.v; render(); },
  yReviewOpen(){ reviewOpen = true; const n = yearWeek(); yr = Object.assign({week:n}, clone(weekRec(n).review || {}), {next:(G().weeks[n+1]||{}).step || ''}); render(); },
  yReviewSave(){
    const n = yearWeek(); yErr = '';
    if (!yr.how){ yErr = 'Choose how this week’s step went.'; render(); return; }
    if (n < 52 && !(yr.next||'').trim()){ yErr = 'Name next week’s step before closing the week.'; render(); return; }
    const w = weekRec(n);
    if (G().measure && num(yr.value) !== null) w.value = num(yr.value);
    w.review = {how:yr.how, helped:(yr.helped||'').trim(), blocked:(yr.blocked||'').trim(), pid:yr.pid && yr.pid !== 'none' ? yr.pid : '', at:todayKey()};
    w.done = yr.how;
    if (n < 52){ const nx = weekRec(n + 1); nx.step = yr.next.trim(); }
    blockedPrompt = w.review.pid ? realPatterns().find(p => p.id === w.review.pid) || null : null;
    reviewOpen = false; yearMirror = null; save(); render();
    toast(n < 52 ? `Week ${n} closed. Week ${n+1} is set. +5 points` : 'Your final week is closed.');
  },
  async yMirror(){
    if (!mirrorOn()) return;
    const y = G(), n = yearWeek(), si = Math.max(0, seasonOf(n));
    yearBusy = true; yearMirrorErr = ''; render();
    const recent = [];
    for (let i = Math.max(1, n - 3); i <= n; i++){ const w = y.weeks[i]; if (!w) continue; recent.push(`Week ${i}: step "${w.step||'-'}", ${w.done||yr.how||'not reviewed'}${w.review&&w.review.blocked?`, blocked by: ${w.review.blocked}`:''}${i===n&&yr.blocked?`, blocked by: ${yr.blocked}`:''}`); }
    try {
      yearMirror = await api.mirrorYear({goal:y.goal, identity:y.identity, why:y.why||'', season:SEASONS[si].name, milestone:y.seasons[si]||'', week:String(n + 1), recent:recent.join('\n')});
      if (yearMirror && yearMirror.step) yr.next = yearMirror.step;
    } catch(e){ yearMirrorErr = errText(e, 'The Mirror couldn’t answer just now. Try again.'); }
    yearBusy = false; render();
  },
  yMilestone(b){ const y = G(); y.milestones = y.milestones || {}; const i = +b.dataset.i; y.milestones[i] = todayKey(); save(); render();
    queueSeal({kicker:`${SEASONS[i].name} milestone`, name:y.seasons[i], line:'A season’s harvest, gathered. +20 points', emb:SEASONS[i].emb}); },
  yEndArm(){ yearEndArmed = true; render(); },
  yEndNo(){ yearEndArmed = false; render(); },
  yEnd(){ state.goals.splice(state.goalIdx, 1); state.goalIdx = 0; yr = {}; yearEndArmed = false; save(); render(); toast('That goal has been cleared.'); },
  yNewYear(){ state.yearsCompleted = (state.yearsCompleted || 0) + 1; state.goals.splice(state.goalIdx, 1); state.goalIdx = 0; yr = {}; save(); location.hash = 'future'; },
  buildOnThis(){ $('#release').hidden = true; if (state.goals.length < MAX_GOALS){ acts.yStart(); location.hash = 'yearsetup'; } else location.hash = 'future'; },
  async checkout(b){
    plusBusy = b.dataset.plan; plusErr = ''; render();
    try { const url = await api.checkout(b.dataset.plan); await flush(); window.location.href = url; }
    catch(e){ plusBusy = ''; plusErr = errText(e, 'We couldn’t open the payment page. Try again in a moment.'); render(); }
  },
  async portal(){
    plusBusy = 'portal'; plusErr = ''; render();
    try { const url = await api.portal(); await flush(); window.location.href = url; }
    catch(e){ plusBusy = ''; plusErr = errText(e, 'We couldn’t open your plan page. Try again in a moment.'); render(); }
  },
  ownerRefresh(){ adminStats = null; adminErr = ''; render(); },
  yPick(b){ state.goalIdx = +b.dataset.i; yr = {}; figureDraft = ''; reviewOpen = false; yearMirror = null; blockedPrompt = null; yearEndArmed = false; save(); render(); },
  yMType(b){ ydraft.mType = b.dataset.v; render(); },
  yFigure(){
    const v = num(figureDraft);
    if (v === null){ toast('Enter a number, e.g. 2500'); return; }
    weekRec(yearWeek()).value = v; figureDraft = ''; save(); render(); toast('Figure saved');
  },
  hFormOpen(){ habitFormOpen = true; habitDraft = {name:'', cue:''}; render(); const i = $('#h-name'); if (i) i.focus(); },
  hFormClose(){ habitFormOpen = false; render(); },
  hAdd(){
    const name = habitDraft.name.trim();
    if (!name){ toast('Name the habit first.'); return; }
    if (activeHabits().length >= habitLimit()){ habitFormOpen = false; render(); return; }
    state.habits.push({id:newId(), name:name.slice(0, 80), cue:habitDraft.cue.trim().replace(/^after i\s*/i, '').slice(0, 80), created:todayKey(), archived:false});
    habitFormOpen = false; save(); render(); toast('Habit added. Tick it off each day you do it.');
  },
  hTick(b){
    const k = todayKey(), id = b.dataset.id;
    const m = state.habitChecks[k] || (state.habitChecks[k] = {});
    if (m[id]) delete m[id]; else m[id] = 1;
    if (!Object.keys(m).length) delete state.habitChecks[k];
    save(); render();
    if (m[id]){ const st = habitStreak(id); if ([7, 21, 40, 66].includes(st)) queueSeal({kicker:`${st} days in a row`, name:(state.habits.find(h => h.id === id)||{}).name || 'Your habit', line: st === 66 ? 'Sixty-six days. Research suggests this is about when a habit becomes automatic.' : 'Every tick is a vote for who you are becoming.', emb:'sprout'}); }
  },
  hRemoveArm(b){ habitDelArmed = b.dataset.id; render(); },
  hRemoveNo(){ habitDelArmed = null; render(); },
  hRemove(b){ const h = state.habits.find(x => x.id === b.dataset.id); if (h) h.archived = true; habitDelArmed = null; save(); render(); toast('Habit removed. Its history is kept in your journal.'); },
  async pushOn(){
    push.err = ''; push.msg = ''; push.busy = 'on'; render();
    try {
      // Ask permission first, straight from the tap: iPhone refuses if anything else comes before it.
      const perm = await Notification.requestPermission();
      if (perm !== 'granted'){ push.state = perm === 'denied' ? 'denied' : 'off'; push.busy = ''; render(); return; }
      const key = await api.pushPublicKey();
      if (!key) throw new Error('Phone notifications aren’t switched on for The Crossing yet. Please try again later.');
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:b64ToU8(key)});
      const j = sub.toJSON();
      await api.pushSubscribe(Object.assign({endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth}, prefArgs()));
      push.endpoint = j.endpoint; push.state = 'on'; push.msg = 'Notifications are on for this device.';
      nudgeHidden = true;
    } catch(e){ push.err = errText(e, (e && e.message) || 'Notifications couldn’t be turned on. Try again in a moment.'); }
    push.busy = ''; render();
  },
  async pushOff(){
    push.err = ''; push.msg = ''; push.busy = 'off'; render();
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      if (push.endpoint) await api.pushUnsubscribe(push.endpoint);
      push.state = 'off'; push.msg = 'Notifications are off for this device.';
    } catch(e){ push.err = errText(e, 'That didn’t go through. Try again in a moment.'); }
    push.busy = ''; render();
  },
  async pushTest(){
    push.err = ''; push.msg = ''; push.busy = 'test'; render();
    try { const n = await api.pushTest(); push.msg = n ? 'Sent. It should arrive within a few seconds.' : 'We couldn’t reach this device. Turn notifications off and on again.'; }
    catch(e){ push.err = errText(e, 'The test didn’t send. Try again in a moment.'); }
    push.busy = ''; render();
  },
  nudgeHide(){ nudgeHidden = true; try { localStorage.setItem('crossing-push-nudge', 'hidden'); } catch(e){} render(); },
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
    try { navigator.clipboard.writeText(text).then(() => toast('Copied. Paste it to your partner.'), fallback); } catch(e){ fallback(); }
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
  else if (bind === 'yfig'){ figureDraft = t.value; }
  else if (bind === 'pushPref'){
    push.prefs[t.dataset.k] = t.type === 'checkbox' ? t.checked : t.value;
    if (push.state === 'on' && push.endpoint){
      clearTimeout(push._t);
      push._t = setTimeout(() => { api.pushUpdate(Object.assign({endpoint:push.endpoint}, prefArgs())).then(() => toast('Notification times saved')).catch(e => { push.err = errText(e, 'That didn\u2019t save. Try again.'); render(); }); }, 400);
    }
  }
  else if (bind === 'habit'){ habitDraft[t.dataset.k] = t.value; }
  else if (bind === 'remConsent'){ remConsent = t.checked; }
  else if (bind === 'urgeRange'){ urge.intensity = +t.value; const o = $('#u-int'); if (o) o.textContent = t.value; }
  else if (bind === 'wName' || bind === 'wNext' || bind === 'wStake'){ state.witness[{wName:'name',wNext:'next',wStake:'stake'}[bind]] = t.value; save(); const s = $('#summary'); if (s) s.textContent = weekSummary(); }
});
/* Examen completes a quest on blur, so the page doesn't redraw while typing */
document.addEventListener('focusout', e => { if (e.target.dataset && e.target.dataset.bind === 'examen' && view() === 'today'){ if (syncQuest()) checkRank(); else checkRank(); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target && e.target.dataset && e.target.dataset.bind === 'habit'){ e.preventDefault(); acts.hAdd(); return; }
  if (e.key === 'Enter' && e.target && e.target.id === 'y-fig'){ e.preventDefault(); acts.yFigure(); return; } if (e.key === 'Escape'){ if (!$('#release').hidden) $('#release').hidden = true; if (!$('#urge').hidden) acts.urgeClose(); if (!$('#seal').hidden) nextSeal(); } });
window.addEventListener('hashchange', () => { confirmDel = null; render(); window.scrollTo({top:0}); });

setStatus();
render();
{ const so = document.querySelector('.hdr-out'); if (so) so.hidden = false; const hp = document.querySelector('.hdr-plus'); if (hp) hp.hidden = false; }
return { flush };
}
