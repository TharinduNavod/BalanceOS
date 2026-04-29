// ====================================================
//  BalanceOS — Personal Workload Manager
//  script.js
// ====================================================

// ===== Google Drive Upload Web App URL =====
// Replace this with YOUR Google Apps Script Web App URL
const DRIVE_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbyH39IpQt6n5ooJxw4UpebjCAhEtjHuwbUsycaicdL5RKjupcT3M9Mi1pqMjnLfd7GTYQ/exec';

// ===== STATE =====
let state = {
  profile: null,
  academics: [],
  sports: [],
  routine: [],
  milestones: [],
  tasks: [],
  files: [],
  reminders: [],
  routineChecked: {} // date -> [ids checked today]
};

let editingId    = null;
let currentSec   = 'dashboard';
let currentWeek  = 0; // 0 = this week, -1 = last week, etc.
let acadFilter   = 'all';
let taskFilter   = 'all';
let fileFilter   = 'all';
let chosenColor  = '#6EE7B7';

const COLORS = [
  '#6EE7B7','#60A5FA','#F472B6','#A78BFA',
  '#FBBF24','#FB7185','#34D399','#38BDF8'
];

const CAT_ICONS = {
  morning:'🌅', study:'📚', sports:'🏃', meal:'🍽️',
  rest:'😴', social:'👥', other:'📌'
};

// ===== STORAGE =====
function save() {
  localStorage.setItem('balanceos_state', JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem('balanceos_state');
    if (raw) state = JSON.parse(raw);
  } catch(e) { /* first run */ }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// ===== INIT =====
window.onload = () => {
  loadState();
  initObColors();
  drawBgCanvas();
  updateTbDate();

  if (state.profile) {
    bootApp();
  } else {
    document.getElementById('onboardScreen').style.display = 'flex';
  }
};

// ===== BACKGROUND CANVAS =====
function drawBgCanvas() {
  const canvas = document.getElementById('bgCanvas');
  const ctx    = canvas.getContext('2d');
  let w, h, pts;

  function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  function initPts() {
    pts = Array.from({length:55},()=>({
      x:Math.random()*w, y:Math.random()*h,
      vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
      r:Math.random()*1.8+.4
    }));
  }
  function draw() {
    ctx.clearRect(0,0,w,h);
    for(let i=0;i<pts.length;i++){
      for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<130){ctx.beginPath();ctx.strokeStyle=`rgba(110,231,183,${.1*(1-d/130)})`;ctx.lineWidth=.5;ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();}
      }
    }
    pts.forEach(p=>{
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(110,231,183,0.25)';ctx.fill();
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize',resize);
  resize();initPts();draw();
}

// ===== ONBOARDING =====
function initObColors() {
  const wrap = document.getElementById('obColors');
  wrap.innerHTML = COLORS.map((c,i)=>
    `<div class="ob-color ${i===0?'sel':''}" style="background:${c}" onclick="pickColor('${c}',this)"></div>`
  ).join('');
}

function pickColor(c, el) {
  chosenColor = c;
  document.querySelectorAll('.ob-color').forEach(x=>x.classList.remove('sel'));
  el.classList.add('sel');
}

function finishSetup() {
  const name   = document.getElementById('obName').value.trim();
  const degree = document.getElementById('obDegree').value.trim();
  const sport  = document.getElementById('obSport').value.trim();
  const err    = document.getElementById('obErr');
  err.textContent = '';
  if(!name)   { err.textContent = 'Please enter your name.'; return; }
  if(!degree) { err.textContent = 'Please enter your degree / field.'; return; }

  state.profile = { name, degree, sport: sport||'Activity', color: chosenColor, initials: makeInitials(name) };
  save();
  bootApp();
}

function makeInitials(name) {
  return name.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
}

function bootApp() {
  document.getElementById('onboardScreen').style.display = 'none';
  document.getElementById('appRoot').style.display = 'flex';
  const p = state.profile;
  const av = document.getElementById('sbAvatar');
  av.textContent = p.initials;
  av.style.background = p.color;
  document.getElementById('sbName').textContent   = p.name;
  document.getElementById('sbDegree').textContent = p.degree;
  renderAll();
}

function resetProfile() {
  if(!confirm('Reset your profile? All data will be cleared.')) return;
  localStorage.removeItem('balanceos_state');
  location.reload();
}

// ===== DATE =====
function updateTbDate() {
  const now  = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('tbDate').textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function fmtDate(d) {
  if(!d) return '';
  try { const [y,m,day]=d.split('-'); const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return `${parseInt(day)} ${months[parseInt(m)-1]}`; }
  catch { return d; }
}

// ===== SECTION NAV =====
const SECTION_META = {
  dashboard: { title:'Dashboard',       sub:'Your personal balance overview' },
  academics: { title:'Academics',       sub:'Track assignments, exams & lectures' },
  sports:    { title:'Sports & Fitness',sub:'Log your training sessions' },
  routine:   { title:'Daily Routine',   sub:'Build & track your ideal day' },
  reminders: { title:'Reminders',        sub:'Lectures, seminars, webinars & more — categorised' },
  timeline:  { title:'Timeline',        sub:'Milestones & important dates' },
  tasks:     { title:'Tasks',           sub:'Manage your to-do list' },
  files:     { title:'Files & Docs',    sub:'Upload to Google Drive' },
};

function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.sb-btn').forEach(b=>b.classList.remove('active'));
  const sec = document.getElementById('sec-'+name);
  if(sec) sec.classList.add('active');
  if(btn) btn.classList.add('active');
  else {
    const b = document.querySelector(`[data-sec="${name}"]`);
    if(b) b.classList.add('active');
  }
  currentSec = name;
  const m = SECTION_META[name]||{};
  document.getElementById('tbTitle').textContent = m.title||name;
  document.getElementById('tbSub').textContent   = m.sub||'';
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== RENDER ALL =====
function renderAll() {
  renderDashboard();
  renderAcademics();
  renderSports();
  renderRoutine();
  renderTimeline();
  renderTasks();
  renderReminders();
  renderFileTabs();
  renderFiles();
}

// ===== DASHBOARD =====
function renderDashboard() {
  const p = state.profile;
  const hr = new Date().getHours();
  const greet = hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';
  document.getElementById('dashGreeting').textContent = `${greet}, ${p.name.split(' ')[0]}! 👋`;
  document.getElementById('dashSport').textContent    = `${p.sport} • ${p.degree}`;

  // Stats
  const pendingTasks  = state.tasks.filter(t=>t.status!=='done').length;
  const acadItems     = state.academics.length;
  const thisWeekSports = getWeekSessions(0).length;
  const filesCount    = state.files.length;

  document.getElementById('statTasks').textContent  = pendingTasks;
  document.getElementById('statAcad').textContent   = acadItems;
  document.getElementById('statSports').textContent = thisWeekSports;
  document.getElementById('statFiles').textContent  = filesCount;

  // Balance ring
  drawBalanceRing();

  // Dashboard items
  renderDashTimeline();
  renderDashTasks();
  renderDashRoutine();
  renderDashAcad();

  // Task badge
  const badge = document.getElementById('taskBadge');
  if(pendingTasks>0){ badge.textContent=pendingTasks; badge.style.display='inline'; }
  else { badge.style.display='none'; }

  // Reminder badge
  const remBadge = document.getElementById('reminderBadge');
  const pendingRem = (state.reminders||[]).filter(r=>!r.done).length;
  if(pendingRem>0){ remBadge.textContent=pendingRem; remBadge.style.display='inline'; }
  else { remBadge.style.display='none'; }
}

function drawBalanceRing() {
  const canvas = document.getElementById('balanceRing');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx=90,cy=90,r=72,lw=14;

  // Calculate scores
  const acadScore  = Math.min(state.academics.filter(a=>a.status==='done').length / Math.max(state.academics.length,1), 1);
  const sportsScore= Math.min(getWeekSessions(0).length / 5, 1);
  const routineScore = getTodayRoutineScore();
  const overall = Math.round((acadScore+sportsScore+routineScore)/3*100);

  ctx.clearRect(0,0,180,180);

  const segments = [
    { value: acadScore,   color:'#6EE7B7', start:-Math.PI/2 },
    { value: sportsScore, color:'#60A5FA', start:-Math.PI/2 + Math.PI*2*acadScore },
    { value: routineScore,color:'#F472B6', start:-Math.PI/2 + Math.PI*2*(acadScore+sportsScore) },
  ];

  // bg ring
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=lw; ctx.stroke();

  let angle = -Math.PI/2;
  segments.forEach(seg=>{
    const sweep = Math.PI*2*seg.value;
    if(sweep<0.001) return;
    ctx.beginPath(); ctx.arc(cx,cy,r,angle,angle+sweep);
    ctx.strokeStyle=seg.color; ctx.lineWidth=lw;
    ctx.lineCap='round'; ctx.stroke();
    angle+=sweep+0.04;
  });

  document.getElementById('ringPct').textContent = overall+'%';
}

function getTodayRoutineScore() {
  const today = new Date().toISOString().split('T')[0];
  const todaySlots = getTodaySlots();
  if(!todaySlots.length) return 0;
  const checked = (state.routineChecked[today]||[]).length;
  return Math.min(checked/todaySlots.length,1);
}

function getTodaySlots() {
  const dayMap = { 0:'sun',1:'mon',2:'tue',3:'wed',4:'thu',5:'fri',6:'sat' };
  const day    = dayMap[new Date().getDay()];
  const isWeekday = [1,2,3,4,5].includes(new Date().getDay());
  const isWeekend = [0,6].includes(new Date().getDay());
  return state.routine.filter(r=>{
    if(r.days==='daily')   return true;
    if(r.days==='weekday') return isWeekday;
    if(r.days==='weekend') return isWeekend;
    return r.days===day;
  });
}

function renderDashTimeline() {
  const el = document.getElementById('dashTimeline');
  const upcoming = state.milestones
    .filter(m=>m.status!=='done')
    .sort((a,b)=>(a.end||'').localeCompare(b.end||''))
    .slice(0,4);
  el.innerHTML = upcoming.length ? upcoming.map(m=>`
    <div class="dash-item" onclick="showSection('timeline',document.querySelector('[data-sec=timeline]'))">
      <div class="di-dot" style="background:${m.status==='active'?'#60A5FA':'#6EE7B7'}"></div>
      <div class="di-label">${m.name}</div>
      <div class="di-meta">${fmtDate(m.end)}</div>
    </div>
  `).join('') : '<div class="dash-empty">No upcoming milestones</div>';
}

function renderDashTasks() {
  const el = document.getElementById('dashTasks');
  const tasks = state.tasks.filter(t=>t.status!=='done').slice(0,4);
  el.innerHTML = tasks.length ? tasks.map(t=>`
    <div class="dash-item" onclick="openTaskModal('${t.id}')">
      <div class="di-dot" style="background:${t.status==='inprogress'?'#60A5FA':'#8DA5C0'}"></div>
      <div class="di-label">${t.title}</div>
      <div class="di-meta">${t.due?fmtDate(t.due):''}</div>
    </div>
  `).join('') : '<div class="dash-empty">No pending tasks 🎉</div>';
}

function renderDashRoutine() {
  const el    = document.getElementById('dashRoutine');
  const slots = getTodaySlots().sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const today = new Date().toISOString().split('T')[0];
  const checked = state.routineChecked[today]||[];
  el.innerHTML = slots.length ? slots.slice(0,5).map(r=>`
    <div class="dash-item" onclick="showSection('routine',document.querySelector('[data-sec=routine]'))">
      <div class="di-dot" style="background:${checked.includes(r.id)?'#6EE7B7':'#4A6080'}"></div>
      <div class="di-label">${CAT_ICONS[r.cat]||'📌'} ${r.name}</div>
      <div class="di-meta">${r.time||''}</div>
    </div>
  `).join('') : '<div class="dash-empty">No routine items for today</div>';
}

function renderDashAcad() {
  const el = document.getElementById('dashAcad');
  const items = state.academics.filter(a=>a.status!=='done')
    .sort((a,b)=>(a.due||'').localeCompare(b.due||''))
    .slice(0,4);
  el.innerHTML = items.length ? items.map(a=>`
    <div class="dash-item" onclick="openAcadModal('${a.id}')">
      <div class="di-dot" style="background:${a.priority==='high'?'#FB7185':a.priority==='medium'?'#FBBF24':'#6EE7B7'}"></div>
      <div class="di-label">${a.title}</div>
      <div class="di-meta">${fmtDate(a.due)}</div>
    </div>
  `).join('') : '<div class="dash-empty">No pending academic items</div>';
}

// ===== ACADEMICS =====
function renderAcademics() {
  const list = document.getElementById('acadList');
  let items = state.academics;
  if(acadFilter!=='all') items = items.filter(a=>a.type===acadFilter);
  items = items.sort((a,b)=>{
    const po={'high':0,'medium':1,'low':2};
    return (po[a.priority]||1)-(po[b.priority]||1)||(a.due||'').localeCompare(b.due||'');
  });

  if(!items.length){
    list.innerHTML='<div class="acad-empty">📚 No academic items yet.<br><br>Add assignments, exams, lectures and stay on top of your studies!</div>';
    return;
  }

  list.innerHTML = items.map(a=>{
    const statusColor = a.status==='done'?'#6EE7B7':a.status==='inprogress'?'#60A5FA':'#4A6080';
    return `
    <div class="acad-card" onclick="openAcadModal('${a.id}')">
      <div class="acad-type-badge acad-type-${a.type}">${a.type}</div>
      <div class="acad-main">
        <div class="acad-title-text">${a.title}</div>
        <div class="acad-sub">${a.subject||''} ${a.notes?'· '+a.notes.slice(0,50)+(a.notes.length>50?'…':''):''}</div>
      </div>
      <div class="acad-right">
        <div class="acad-priority prio-${a.priority}">${a.priority}</div>
        <div class="acad-due">${fmtDate(a.due)}</div>
        <div class="acad-status-dot" style="background:${statusColor}" title="${a.status}"></div>
      </div>
    </div>`;
  }).join('');
}

function filterAcad(f, btn) {
  acadFilter = f;
  document.querySelectorAll('#sec-academics .filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderAcademics();
}

function openAcadModal(id) {
  editingId = id||null;
  const a = id?state.academics.find(x=>x.id===id):null;
  document.getElementById('acadModalTitle').textContent = a?'Edit Academic Item':'Add Academic Item';
  document.getElementById('acadTitle').value   = a?a.title   :'';
  document.getElementById('acadSubject').value = a?a.subject||'':'';
  document.getElementById('acadType').value    = a?a.type    :'assignment';
  document.getElementById('acadPriority').value= a?a.priority:'medium';
  document.getElementById('acadDue').value     = a?a.due||'' :'';
  document.getElementById('acadStatus').value  = a?a.status  :'pending';
  document.getElementById('acadNotes').value   = a?a.notes||'':'';
  document.getElementById('acadDel').style.display = a?'block':'none';
  showModal('acadModal');
}

function saveAcad() {
  const title = document.getElementById('acadTitle').value.trim();
  if(!title) return;
  const data = {
    title, subject: document.getElementById('acadSubject').value.trim(),
    type:    document.getElementById('acadType').value,
    priority:document.getElementById('acadPriority').value,
    due:     document.getElementById('acadDue').value,
    status:  document.getElementById('acadStatus').value,
    notes:   document.getElementById('acadNotes').value.trim()
  };
  if(editingId){ const i=state.academics.findIndex(x=>x.id===editingId); if(i>-1) state.academics[i]={...state.academics[i],...data}; }
  else state.academics.push({id:uid(),...data});
  save(); closeModal(); renderAcademics(); renderDashboard();
}

function deleteAcad() {
  if(!editingId||!confirm('Delete this item?')) return;
  state.academics=state.academics.filter(x=>x.id!==editingId);
  save(); closeModal(); renderAcademics(); renderDashboard();
}

// ===== SPORTS =====
function getWeekDates(offset=0) {
  const today = new Date();
  const dow   = today.getDay(); // 0=Sun
  const mon   = new Date(today); mon.setDate(today.getDate()-dow+1+offset*7);
  return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
}

function getWeekSessions(offset=0) {
  const dates = getWeekDates(offset).map(d=>d.toISOString().split('T')[0]);
  return state.sports.filter(s=>dates.includes(s.date));
}

function renderSports() {
  renderWeekGrid();
  renderSportsList();
  const dates = getWeekDates(currentWeek);
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('weekLabel').textContent =
    `${dates[0].getDate()} ${months[dates[0].getMonth()]} – ${dates[6].getDate()} ${months[dates[6].getMonth()]}`;
}

function renderWeekGrid() {
  const dates  = getWeekDates(currentWeek);
  const today  = new Date().toISOString().split('T')[0];
  const days   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const grid   = document.getElementById('weekGrid');
  grid.innerHTML = dates.map((d,i)=>{
    const ds    = d.toISOString().split('T')[0];
    const sessions = state.sports.filter(s=>s.date===ds);
    const pips  = sessions.slice(0,3).map(s=>`<div class="wd-pip ${s.intensity||'moderate'}"></div>`).join('');
    return `
    <div class="week-day ${ds===today?'today':''} ${sessions.length?'has-session':''}"
         onclick="openSportModal(null,'${ds}')">
      <div class="wd-day">${days[i]}</div>
      <div class="wd-date">${d.getDate()}</div>
      <div class="wd-sessions">${pips}</div>
    </div>`;
  }).join('');
}

function renderSportsList() {
  const dates  = getWeekDates(currentWeek).map(d=>d.toISOString().split('T')[0]);
  const list   = document.getElementById('sportsList');
  const sessions = state.sports.filter(s=>dates.includes(s.date))
    .sort((a,b)=>b.date.localeCompare(a.date));
  if(!sessions.length){ list.innerHTML='<div class="acad-empty">🏃 No sessions logged this week.</div>'; return; }
  list.innerHTML = sessions.map(s=>`
    <div class="sport-card" onclick="openSportModal('${s.id}')">
      <div class="sport-intensity ${s.intensity||'moderate'}">${s.intensity==='intense'?'🔥':s.intensity==='light'?'🌿':'⚡'}</div>
      <div class="sport-main">
        <div class="sport-act">${s.activity}</div>
        <div class="sport-meta">${fmtDate(s.date)} · ${s.intensity||'moderate'} ${s.calories?'· '+s.calories+' cal':''}</div>
        ${s.notes?`<div class="sport-meta" style="margin-top:3px;font-style:italic">${s.notes.slice(0,60)}</div>`:''}
      </div>
      <div class="sport-right">
        <div class="sport-dur">${s.duration||0}</div>
        <div class="sport-dur-lbl">mins</div>
      </div>
    </div>
  `).join('');
}

function changeWeek(dir) {
  currentWeek += dir;
  renderSports();
}

function openSportModal(id, prefillDate) {
  editingId = id||null;
  const s = id?state.sports.find(x=>x.id===id):null;
  document.getElementById('sportModalTitle').textContent = s?'Edit Session':'Log Session';
  document.getElementById('sportActivity').value  = s?s.activity:state.profile.sport||'';
  document.getElementById('sportDate').value      = s?s.date:(prefillDate||new Date().toISOString().split('T')[0]);
  document.getElementById('sportDuration').value  = s?s.duration:'';
  document.getElementById('sportIntensity').value = s?s.intensity||'moderate':'moderate';
  document.getElementById('sportCalories').value  = s?s.calories||'':'';
  document.getElementById('sportNotes').value     = s?s.notes||'':'';
  document.getElementById('sportDel').style.display = s?'block':'none';
  showModal('sportModal');
}

function saveSport() {
  const activity = document.getElementById('sportActivity').value.trim();
  if(!activity) return;
  const data = {
    activity, date: document.getElementById('sportDate').value,
    duration:  parseInt(document.getElementById('sportDuration').value)||0,
    intensity: document.getElementById('sportIntensity').value,
    calories:  parseInt(document.getElementById('sportCalories').value)||0,
    notes:     document.getElementById('sportNotes').value.trim()
  };
  if(editingId){ const i=state.sports.findIndex(x=>x.id===editingId); if(i>-1) state.sports[i]={...state.sports[i],...data}; }
  else state.sports.push({id:uid(),...data});
  save(); closeModal(); renderSports(); renderDashboard();
}

function deleteSport() {
  if(!editingId||!confirm('Delete this session?')) return;
  state.sports=state.sports.filter(x=>x.id!==editingId);
  save(); closeModal(); renderSports(); renderDashboard();
}

// ===== ROUTINE =====
function renderRoutine() {
  const wrap  = document.getElementById('routineWrap');
  const today = new Date().toISOString().split('T')[0];
  const checked = state.routineChecked[today]||[];

  if(!state.routine.length){
    wrap.innerHTML='<div class="acad-empty">☀️ No routine slots yet.<br><br>Build your ideal day by adding morning exercises, study blocks, meals, and rest times!</div>';
    return;
  }

  // Sort by time
  const sorted = [...state.routine].sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));

  // Group by category
  const groups = {};
  sorted.forEach(r=>{
    const g = r.cat||'other';
    if(!groups[g]) groups[g]=[];
    groups[g].push(r);
  });

  const groupLabels = { morning:'🌅 Morning',study:'📚 Study',sports:'🏃 Sports',meal:'🍽️ Meals',rest:'😴 Rest',social:'👥 Social',other:'📌 Other' };

  wrap.innerHTML = Object.entries(groups).map(([cat,slots])=>`
    <div class="routine-time-group">
      <div class="rtg-label">${groupLabels[cat]||cat}</div>
      ${slots.map(r=>`
        <div class="routine-slot ${checked.includes(r.id)?'checked':''}" onclick="openRoutineModal('${r.id}')">
          <div class="rs-check" onclick="toggleRoutineCheck('${r.id}',event)">${checked.includes(r.id)?'✓':''}</div>
          <div class="rs-cat">${CAT_ICONS[r.cat]||'📌'}</div>
          <div class="rs-main">
            <div class="rs-name">${r.name}</div>
            <div class="rs-sub">${r.duration?r.duration+' mins':''}${r.days&&r.days!=='daily'?' · '+r.days:''}${r.note?' · '+r.note:''}</div>
          </div>
          <div class="rs-time">${r.time||''}</div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function toggleRoutineCheck(id, event) {
  event.stopPropagation();
  const today = new Date().toISOString().split('T')[0];
  if(!state.routineChecked[today]) state.routineChecked[today]=[];
  const idx = state.routineChecked[today].indexOf(id);
  if(idx>-1) state.routineChecked[today].splice(idx,1);
  else state.routineChecked[today].push(id);
  save(); renderRoutine(); renderDashboard();
}

function openRoutineModal(id) {
  editingId = id||null;
  const r = id?state.routine.find(x=>x.id===id):null;
  document.getElementById('routineModalTitle').textContent = r?'Edit Routine Slot':'Add Routine Slot';
  document.getElementById('routineName').value    = r?r.name    :'';
  document.getElementById('routineTime').value    = r?r.time||''  :'';
  document.getElementById('routineDuration').value= r?r.duration||'':'';
  document.getElementById('routineCat').value     = r?r.cat      :'morning';
  document.getElementById('routineDays').value    = r?r.days     :'daily';
  document.getElementById('routineNote').value    = r?r.note||'' :'';
  document.getElementById('routineDel').style.display = r?'block':'none';
  showModal('routineModal');
}

function saveRoutine() {
  const name = document.getElementById('routineName').value.trim();
  if(!name) return;
  const data = {
    name, time:     document.getElementById('routineTime').value,
    duration: parseInt(document.getElementById('routineDuration').value)||0,
    cat:      document.getElementById('routineCat').value,
    days:     document.getElementById('routineDays').value,
    note:     document.getElementById('routineNote').value.trim()
  };
  if(editingId){ const i=state.routine.findIndex(x=>x.id===editingId); if(i>-1) state.routine[i]={...state.routine[i],...data}; }
  else state.routine.push({id:uid(),...data});
  save(); closeModal(); renderRoutine(); renderDashboard();
}

function deleteRoutine() {
  if(!editingId||!confirm('Delete this routine slot?')) return;
  state.routine=state.routine.filter(x=>x.id!==editingId);
  save(); closeModal(); renderRoutine(); renderDashboard();
}

// ===== TIMELINE =====
function renderTimeline() {
  const track = document.getElementById('timelineTrack');
  const sorted = [...state.milestones].sort((a,b)=>(a.start||'').localeCompare(b.start||''));

  if(!sorted.length){
    track.innerHTML='<div class="tl-empty">📅 No milestones yet.<br><br>Add exam weeks, tournaments, project deadlines and plan ahead!</div>';
    return;
  }

  track.innerHTML = sorted.map(m=>`
    <div class="tl-item ${m.status}" onclick="openMilestoneModal('${m.id}')">
      <div class="tl-card">
        <div class="tl-card-head">
          <div class="tl-name">${m.name}</div>
          <div class="tl-cat-badge tl-cat-${m.cat||'personal'}">${m.cat||'personal'}</div>
        </div>
        <div class="tl-dates">${fmtDate(m.start)}${m.end&&m.end!==m.start?' → '+fmtDate(m.end):''}</div>
        ${m.notes?`<div class="tl-notes">${m.notes.slice(0,120)}</div>`:''}
      </div>
    </div>
  `).join('');
}

function openMilestoneModal(id) {
  editingId = id||null;
  const m = id?state.milestones.find(x=>x.id===id):null;
  document.getElementById('msModalTitle').textContent = m?'Edit Milestone':'Add Milestone';
  document.getElementById('msName').value   = m?m.name      :'';
  document.getElementById('msCat').value    = m?m.cat       :'academics';
  document.getElementById('msStart').value  = m?m.start||'' :'';
  document.getElementById('msEnd').value    = m?m.end||''   :'';
  document.getElementById('msStatus').value = m?m.status    :'upcoming';
  document.getElementById('msNotes').value  = m?m.notes||'' :'';
  document.getElementById('msDel').style.display = m?'block':'none';
  showModal('milestoneModal');
}

function saveMilestone() {
  const name = document.getElementById('msName').value.trim();
  if(!name) return;
  const data = {
    name, cat:    document.getElementById('msCat').value,
    start:  document.getElementById('msStart').value,
    end:    document.getElementById('msEnd').value,
    status: document.getElementById('msStatus').value,
    notes:  document.getElementById('msNotes').value.trim()
  };
  if(editingId){ const i=state.milestones.findIndex(x=>x.id===editingId); if(i>-1) state.milestones[i]={...state.milestones[i],...data}; }
  else state.milestones.push({id:uid(),...data});
  save(); closeModal(); renderTimeline(); renderDashboard();
}

function deleteMilestone() {
  if(!editingId||!confirm('Delete this milestone?')) return;
  state.milestones=state.milestones.filter(x=>x.id!==editingId);
  save(); closeModal(); renderTimeline(); renderDashboard();
}

// ===== TASKS =====
function renderTasks() {
  let items = state.tasks;
  if(taskFilter!=='all') items = items.filter(t=>t.status===taskFilter);

  const todo     = items.filter(t=>t.status==='todo');
  const inprog   = items.filter(t=>t.status==='inprogress');
  const done     = items.filter(t=>t.status==='done');

  document.getElementById('todoCount').textContent  = todo.length;
  document.getElementById('inprogCount').textContent= inprog.length;
  document.getElementById('doneCount').textContent  = done.length;

  const renderCards = arr => arr.length ? arr.map(t=>`
    <div class="task-card" onclick="openTaskModal('${t.id}')">
      <div class="tc-title">${t.title}</div>
      <div class="tc-meta">
        <div class="tc-cat ${t.cat||'personal'}">${t.cat||'personal'}</div>
        <div class="tc-prio ${t.priority||'medium'}">${t.priority==='high'?'▲ High':t.priority==='medium'?'● Med':'▼ Low'}</div>
        ${t.due?`<div class="tc-due">${fmtDate(t.due)}</div>`:''}
      </div>
    </div>
  `).join('') : '<div class="kanban-empty">Empty</div>';

  document.getElementById('colTodo').innerHTML   = renderCards(todo);
  document.getElementById('colInprog').innerHTML = renderCards(inprog);
  document.getElementById('colDone').innerHTML   = renderCards(done);
}

function filterTasks(f, btn) {
  taskFilter = f;
  document.querySelectorAll('#sec-tasks .filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

function openTaskModal(id) {
  editingId = id||null;
  const t = id?state.tasks.find(x=>x.id===id):null;
  document.getElementById('taskModalTitle').textContent = t?'Edit Task':'Add Task';
  document.getElementById('taskTitle').value   = t?t.title    :'';
  document.getElementById('taskDesc').value    = t?t.desc||'' :'';
  document.getElementById('taskCat').value     = t?t.cat      :'academics';
  document.getElementById('taskPriority').value= t?t.priority :'medium';
  document.getElementById('taskStatus').value  = t?t.status   :'todo';
  document.getElementById('taskDue').value     = t?t.due||''  :'';
  document.getElementById('taskDel').style.display = t?'block':'none';
  showModal('taskModal');
}

function saveTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if(!title) return;
  const data = {
    title, desc:    document.getElementById('taskDesc').value.trim(),
    cat:      document.getElementById('taskCat').value,
    priority: document.getElementById('taskPriority').value,
    status:   document.getElementById('taskStatus').value,
    due:      document.getElementById('taskDue').value
  };
  if(editingId){ const i=state.tasks.findIndex(x=>x.id===editingId); if(i>-1) state.tasks[i]={...state.tasks[i],...data}; }
  else state.tasks.push({id:uid(),...data});
  save(); closeModal(); renderTasks(); renderDashboard();
}

function deleteTask() {
  if(!editingId||!confirm('Delete this task?')) return;
  state.tasks=state.tasks.filter(x=>x.id!==editingId);
  save(); closeModal(); renderTasks(); renderDashboard();
}


// ===== FILES — Folder/Section System =====
// state.fileFolders = [ { id, name, emoji, color, desc } ]
// state.files       = [ { id, name, size, mimeType, url, downloadUrl, date, folderId } ]

const FOLDER_EMOJIS = ['💼','🎓','📐','🧪','📋','🗂️','📊','🖥️','📝','🔬','🏗️','📦','🌐','⚙️','🎯'];
const FOLDER_COLORS = ['#6EE7B7','#60A5FA','#F472B6','#A78BFA','#FBBF24','#FB7185','#34D399','#38BDF8','#F97316','#A3E635'];

let activeFolderId  = 'all';  // 'all' or folder id
fileFilter      = 'all';
let editingFolderId = null;

// ── Ensure default folders exist on first run ─────────────────
function ensureDefaultFolders() {
  if (!state.fileFolders) state.fileFolders = [];
  // Migrate old files that have no folderId → assign 'general'
  if (!state.fileFolders.find(f => f.id === 'general')) {
    state.fileFolders.unshift({ id:'general', name:'General', emoji:'📁', color:'#6EE7B7', desc:'' });
  }
  state.files.forEach(f => { if (!f.folderId) f.folderId = 'general'; });
}

// ── Render the tab bar ────────────────────────────────────────
function renderFileTabs() {
  ensureDefaultFolders();
  const wrap = document.getElementById('filesTabs');
  if (!wrap) return;

  const allCount = state.files.length;

  let html = `<button class="ftab ${activeFolderId==='all'?'active':''}" onclick="switchFolder('all')">
    <span class="ftab-emoji">🗄️</span>
    <span class="ftab-name">All Files</span>
    <span class="ftab-count">${allCount}</span>
  </button>`;

  state.fileFolders.forEach(folder => {
    const count = state.files.filter(f => f.folderId === folder.id).length;
    html += `<button class="ftab ${activeFolderId===folder.id?'active':''}" onclick="switchFolder('${folder.id}')">
      <span class="ftab-emoji">${folder.emoji||'📁'}</span>
      <span class="ftab-name">${folder.name}</span>
      <span class="ftab-count">${count}</span>
      <span class="ftab-edit" title="Edit section" onclick="openFolderModal('${folder.id}',event)">✎</span>
    </button>`;
  });

  wrap.innerHTML = html;

  // Update drop zone hint
  const hint = document.getElementById('fdSectionHint');
  if (hint) {
    if (activeFolderId === 'all') {
      hint.textContent = 'Files will be saved to General by default';
    } else {
      const f = state.fileFolders.find(f => f.id === activeFolderId);
      hint.textContent = f ? `Uploading into: ${f.emoji} ${f.name}` : '';
      hint.style.color = f ? f.color : '';
    }
  }
}

// ── Switch active folder tab ──────────────────────────────────
function switchFolder(id) {
  activeFolderId = id;
  renderFileTabs();
  renderFiles();
}

// ── Render the files grid ─────────────────────────────────────
function renderFiles() {
  ensureDefaultFolders();
  const grid = document.getElementById('filesGrid');
  if (!grid) return;

  let files = [...state.files];

  // Filter by folder tab
  if (activeFolderId !== 'all') {
    files = files.filter(f => f.folderId === activeFolderId);
  }

  // Filter by file type
  if (fileFilter !== 'all') {
    const exts = { pdf:['pdf'], doc:['doc','docx'], ppt:['ppt','pptx'], img:['jpg','jpeg','png','gif','webp'] };
    files = files.filter(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return (exts[fileFilter] || []).includes(ext);
    });
  }

  if (!files.length) {
    const isEmptyFolder = activeFolderId !== 'all' && state.files.filter(f => f.folderId === activeFolderId).length === 0;
    grid.innerHTML = `<div class="files-empty">
      ${isEmptyFolder ? '📂 This section is empty.<br><br>Drop files above to add them here!' : '📁 No files match this filter.'}
    </div>`;
    return;
  }

  grid.innerHTML = files.slice().reverse().map(f => {
    const folder = state.fileFolders.find(fd => fd.id === f.folderId);
    const folderTag = folder
      ? `<span class="fc-folder-tag" style="color:${folder.color}">${folder.emoji} ${folder.name}</span>`
      : '';
    return `
    <div class="file-card">
      <div class="fc-icon">${fileIcon(f.name)}</div>
      <div class="fc-name" title="${f.name}">${f.name}</div>
      <div class="fc-meta">${f.size||''} · ${fmtDate(f.date)||''}</div>
      ${folderTag}
      <div class="fc-folder-select-row">
        <select class="fc-move-sel" onchange="moveFileTo('${f.id}',this.value)" title="Move to section">
          ${state.fileFolders.map(fd =>
            `<option value="${fd.id}" ${fd.id===f.folderId?'selected':''}>${fd.emoji} ${fd.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="fc-actions">
        ${f.url
          ? `<a class="fc-open" href="${f.url}" target="_blank" rel="noopener">Open ↗</a>`
          : '<span class="fc-open" style="opacity:0.4;cursor:default">No link</span>'}
        <button class="fc-del" onclick="deleteFile('${f.id}')">✕</button>
      </div>
    </div>`;
  }).join('');
}

// ── Move file to another folder ───────────────────────────────
function moveFileTo(fileId, folderId) {
  state.files = state.files.map(f => f.id === fileId ? {...f, folderId} : f);
  save(); renderFiles(); renderFileTabs(); renderDashboard();
}

// ── File type filter ──────────────────────────────────────────
function filterFiles(f, btn) {
  fileFilter = f;
  document.querySelectorAll('#filesTypeFilter .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderFiles();
}

// ── File upload handlers ──────────────────────────────────────
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  uploadFiles(files);
  event.target.value = '';
}

function handleFileDrop(event) {
  event.preventDefault();
  document.getElementById('filesDrop').classList.remove('dragover');
  uploadFiles(Array.from(event.dataTransfer.files));
}

document.addEventListener('DOMContentLoaded', () => {
  const drop = document.getElementById('filesDrop');
  if (drop) {
    drop.addEventListener('dragenter', () => drop.classList.add('dragover'));
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  }
});

async function uploadFiles(files) {
  if (!files.length) return;
  ensureDefaultFolders();

  // Determine target folder
  const targetFolderId = (activeFolderId === 'all') ? 'general' : activeFolderId;

  const prog = document.getElementById('uploadProgress');
  const fill = document.getElementById('upFill');
  const text = document.getElementById('upText');
  prog.style.display = 'block';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    text.textContent = `Uploading ${i+1}/${files.length}: ${file.name}`;
    fill.style.width = Math.round((i / files.length) * 100) + '%';

    try {
      const base64 = await toBase64(file);
      const res = await fetch(DRIVE_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type || 'application/octet-stream', base64 })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Upload failed');

      state.files.push({
        id: uid(),
        name: result.file.name || file.name,
        size: fmtSize(result.file.size || file.size || 0),
        mimeType: result.file.mimeType || file.type,
        url: result.file.openUrl || '',
        downloadUrl: result.file.downloadUrl || '',
        date: new Date().toISOString().split('T')[0],
        folderId: targetFolderId
      });

    } catch (err) {
      console.error(err);
      // Save locally even if Drive upload fails
      state.files.push({
        id: uid(),
        name: file.name,
        size: fmtSize(file.size || 0),
        mimeType: file.type,
        url: '',
        downloadUrl: '',
        date: new Date().toISOString().split('T')[0],
        folderId: targetFolderId
      });
      alert(`Drive upload failed for ${file.name} — saved locally. Error: ${err.message}`);
    }
  }

  fill.style.width = '100%';
  text.textContent = 'Upload complete ✓';
  save(); renderFiles(); renderFileTabs(); renderDashboard();
  setTimeout(() => { prog.style.display = 'none'; fill.style.width = '0'; }, 1500);
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function fileIcon(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const m = {
    pdf:'📄', doc:'📝', docx:'📝', ppt:'📊', pptx:'📊',
    xls:'📈', xlsx:'📈', jpg:'🖼️', jpeg:'🖼️', png:'🖼️',
    gif:'🖼️', mp4:'🎬', mp3:'🎵', zip:'🗜️', rar:'🗜️',
    py:'🐍', js:'⚡', html:'🌐', css:'🎨'
  };
  return m[ext] || '📁';
}

function deleteFile(id) {
  if (!confirm('Remove this file from the list?')) return;
  state.files = state.files.filter(x => x.id !== id);
  save(); renderFiles(); renderFileTabs(); renderDashboard();
}

// ── Folder / Section modal ────────────────────────────────────
let _pickedFolderEmoji = '📁';
let _pickedFolderColor = '#6EE7B7';

function openFolderModal(id, event) {
  if (event) event.stopPropagation();
  editingFolderId = id || null;
  const folder = id ? state.fileFolders.find(f => f.id === id) : null;

  document.getElementById('folderModalTitle').textContent = folder ? 'Edit Section' : 'New File Section';
  document.getElementById('folderName').value  = folder ? folder.name : '';
  document.getElementById('folderDesc').value  = folder ? (folder.desc || '') : '';
  document.getElementById('folderEmoji').value = folder ? folder.emoji : '';
  _pickedFolderEmoji = folder ? folder.emoji : '📁';
  _pickedFolderColor = folder ? folder.color : '#6EE7B7';

  // Emoji picker
  const emojiRow = document.getElementById('folderEmojiRow');
  emojiRow.innerHTML = FOLDER_EMOJIS.map(e =>
    `<button class="fe-emoji-btn ${_pickedFolderEmoji===e?'sel':''}" onclick="pickFolderEmoji('${e}',this)">${e}</button>`
  ).join('');

  // Color picker
  const colorRow = document.getElementById('folderColorRow');
  colorRow.innerHTML = FOLDER_COLORS.map(c =>
    `<div class="folder-color-dot ${_pickedFolderColor===c?'sel':''}" style="background:${c}" onclick="pickFolderColor('${c}',this)"></div>`
  ).join('');

  // Hide delete for "general" (protected)
  const delBtn = document.getElementById('folderDel');
  delBtn.style.display = (folder && folder.id !== 'general') ? 'block' : 'none';

  showModal('folderModal');
  setTimeout(() => document.getElementById('folderName').focus(), 50);
}

function pickFolderEmoji(e, el) {
  _pickedFolderEmoji = e;
  document.querySelectorAll('.fe-emoji-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  document.getElementById('folderEmoji').value = '';
}

function pickFolderColor(c, el) {
  _pickedFolderColor = c;
  document.querySelectorAll('.folder-color-dot').forEach(d => d.classList.remove('sel'));
  el.classList.add('sel');
}

function saveFolder() {
  const name = document.getElementById('folderName').value.trim();
  if (!name) { document.getElementById('folderName').focus(); return; }

  const emojiInput = document.getElementById('folderEmoji').value.trim();
  const emoji = emojiInput || _pickedFolderEmoji || '📁';
  const color = _pickedFolderColor || '#6EE7B7';
  const desc  = document.getElementById('folderDesc').value.trim();

  if (!state.fileFolders) state.fileFolders = [];

  if (editingFolderId) {
    state.fileFolders = state.fileFolders.map(f =>
      f.id === editingFolderId ? { ...f, name, emoji, color, desc } : f
    );
  } else {
    const newId = uid();
    state.fileFolders.push({ id: newId, name, emoji, color, desc });
    // Auto-switch to the new folder
    activeFolderId = newId;
  }

  save(); closeModal(); renderFileTabs(); renderFiles();
}

function deleteFolder() {
  if (!editingFolderId || editingFolderId === 'general') return;
  if (!confirm('Delete this section? Files inside will be moved to General.')) return;

  // Move files to general
  state.files = state.files.map(f =>
    f.folderId === editingFolderId ? { ...f, folderId: 'general' } : f
  );
  state.fileFolders = state.fileFolders.filter(f => f.id !== editingFolderId);

  if (activeFolderId === editingFolderId) activeFolderId = 'all';
  editingFolderId = null;

  save(); closeModal(); renderFileTabs(); renderFiles();
}
// ===== MODALS =====
function showModal(id) {
  document.getElementById('modalBackdrop').classList.add('show');
  const m=document.getElementById(id);
  m.classList.add('show');
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('show');
  document.querySelectorAll('.modal').forEach(m=>m.classList.remove('show'));
  editingId=null;
}

// ===== REMINDERS =====
const REM_CATS = {
  academic: {
    label:'Academic', icon:'📚', color:'#60A5FA',
    types:['Lecture','Seminar','Webinar','Lab session','Assignment due','Exam','Thesis / research','Study group','Workshop','Tutoring']
  },
  personal: {
    label:'Personal', icon:'⭐', color:'#FBBF24',
    types:['Health / medical','Gym / exercise','Family event','Social meetup','Finance / bills','Travel','Self-care','Shopping','Home task','Other']
  },
  work: {
    label:'Work', icon:'💼', color:'#A78BFA',
    types:['Meeting','Deadline','Presentation','Training','Client call','Review','Interview','Conference','Follow-up','Other']
  },
  learning: {
    label:'Learning', icon:'🎯', color:'#34D399',
    types:['Online course','YouTube study','Book / reading','Practice session','Flashcard review','Mock test','Language study','Coding practice','Certificate prep','Other']
  }
};

let reminderFilter = 'all';
let editingRemId   = null;

function updateRemSubcats(selectedType) {
  const cat   = document.getElementById('remCat').value;
  const types = REM_CATS[cat]?.types || [];
  document.getElementById('remType').innerHTML = types.map(t=>`<option value="${t}">${t}</option>`).join('');
  if(selectedType && types.includes(selectedType)) document.getElementById('remType').value = selectedType;
}

function filterReminders(f, btn) {
  reminderFilter = f;
  document.querySelectorAll('#sec-reminders .filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderReminders();
}

function renderReminders() {
  if(!state.reminders) state.reminders=[];
  const now = new Date();

  // Stats
  const statsEl = document.getElementById('remStatsRow');
  if(statsEl){
    const total   = state.reminders.length;
    const done    = state.reminders.filter(r=>r.done).length;
    const overdue = state.reminders.filter(r=>{
      if(r.done||!r.date) return false;
      return new Date(r.date+(r.time?'T'+r.time:'T23:59')) < now;
    }).length;
    const todayCount = state.reminders.filter(r=>r.date===now.toISOString().split('T')[0]).length;
    statsEl.innerHTML = `
      <div class="rem-stat"><div class="rem-stat-num">${total}</div><div class="rem-stat-lbl">Total</div></div>
      <div class="rem-stat"><div class="rem-stat-num" style="color:#FBBF24">${todayCount}</div><div class="rem-stat-lbl">Today</div></div>
      <div class="rem-stat"><div class="rem-stat-num" style="color:#FB7185">${overdue}</div><div class="rem-stat-lbl">Overdue</div></div>
      <div class="rem-stat"><div class="rem-stat-num" style="color:#6EE7B7">${done}</div><div class="rem-stat-lbl">Done</div></div>
    `;
  }

  const listEl = document.getElementById('remindersList');
  if(!listEl) return;

  let items = reminderFilter==='all' ? state.reminders : state.reminders.filter(r=>r.cat===reminderFilter);
  const sorted = [...items].sort((a,b)=>{
    if(a.done!==b.done) return a.done?1:-1;
    const da = a.date ? new Date(a.date+'T'+(a.time||'00:00')) : new Date('9999');
    const db = b.date ? new Date(b.date+'T'+(b.time||'00:00')) : new Date('9999');
    return da-db;
  });

  if(!sorted.length){
    listEl.innerHTML='<div class="acad-empty">🔔 No reminders yet.<br><br>Add lectures, seminars, webinars, personal events and more!</div>';
    return;
  }

  listEl.innerHTML = sorted.map(r=>{
    const cat = REM_CATS[r.cat]||REM_CATS.personal;
    let timeBadge='';
    if(r.date){
      const dt = new Date(r.date+(r.time?'T'+r.time:'T23:59'));
      const diffH = (dt-now)/3600000;
      if(!r.done && dt<now) timeBadge=`<span class="rem-badge overdue-badge">Overdue</span>`;
      else if(!r.done && diffH<24) timeBadge=`<span class="rem-badge today-badge">Today</span>`;
    }
    const dateStr = r.date ? new Date(r.date+'T12:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
    return `
    <div class="rem-card ${r.done?'rem-done':''}" onclick="openReminderModal('${r.id}')">
      <div class="rem-cat-bar" style="background:${cat.color}"></div>
      <div class="rem-inner">
        <div class="rem-top">
          <div class="rem-cat-badge" style="background:${cat.color}22;color:${cat.color}">${cat.icon} ${cat.label}</div>
          <div class="rem-type-badge">${r.type||''}</div>
          ${timeBadge}
          <div style="flex:1"></div>
          <div class="rem-actions">
            <button class="rem-check-btn ${r.done?'is-done':''}" title="${r.done?'Undo':'Mark done'}" onclick="toggleReminderDone('${r.id}',event)">${r.done?'↩':'✓'}</button>
            <button class="rem-del-btn" title="Delete" onclick="confirmDeleteReminder('${r.id}',event)">✕</button>
          </div>
        </div>
        <div class="rem-title">${r.title}</div>
        <div class="rem-meta">
          ${dateStr?`<span>📅 ${dateStr}${r.time?' at '+r.time:''}</span>`:''}
          ${r.note?`<span style="font-style:italic;color:var(--text3)">📝 ${r.note}</span>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function openReminderModal(id) {
  editingRemId = id||null;
  const r = id ? state.reminders.find(x=>x.id===id) : null;
  document.getElementById('reminderModalTitle').textContent = r?'Edit Reminder':'Add Reminder';
  document.getElementById('remTitle').value = r?r.title:'';
  document.getElementById('remNote').value  = r?r.note||'':'';
  document.getElementById('remDate').value  = r?r.date||'':'';
  document.getElementById('remTime').value  = r?r.time||'':'';
  const catSel = document.getElementById('remCat');
  catSel.innerHTML = Object.entries(REM_CATS).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('');
  catSel.value = r?r.cat:'academic';
  updateRemSubcats(r?r.type:null);
  document.getElementById('reminderDel').style.display = r?'block':'none';
  showModal('reminderModal');
  setTimeout(()=>document.getElementById('remTitle').focus(),50);
}

function saveReminder() {
  const title = document.getElementById('remTitle').value.trim();
  if(!title){ document.getElementById('remTitle').focus(); return; }
  if(!state.reminders) state.reminders=[];
  const obj = {
    id:    editingRemId||uid(),
    title,
    cat:   document.getElementById('remCat').value,
    type:  document.getElementById('remType').value,
    date:  document.getElementById('remDate').value,
    time:  document.getElementById('remTime').value,
    note:  document.getElementById('remNote').value.trim(),
    done:  editingRemId ? (state.reminders.find(r=>r.id===editingRemId)?.done||false) : false
  };
  if(editingRemId) state.reminders = state.reminders.map(r=>r.id===editingRemId?obj:r);
  else state.reminders.push(obj);
  save(); closeModal(); renderReminders(); renderDashboard();
}

function deleteReminder() {
  if(!editingRemId||!confirm('Delete this reminder?')) return;
  state.reminders = state.reminders.filter(r=>r.id!==editingRemId);
  save(); closeModal(); renderReminders(); renderDashboard();
}

function confirmDeleteReminder(id, e) {
  e.stopPropagation();
  if(!confirm('Delete this reminder?')) return;
  state.reminders = state.reminders.filter(r=>r.id!==id);
  save(); renderReminders(); renderDashboard();
}

function toggleReminderDone(id, e) {
  e.stopPropagation();
  if(!state.reminders) state.reminders=[];
  state.reminders = state.reminders.map(r=>r.id===id?{...r,done:!r.done}:r);
  save(); renderReminders(); renderDashboard();
}
