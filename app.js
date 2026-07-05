/* =====================================================
   학점은행 플래너 — 앱 로직
   모든 데이터는 이 기기(localStorage)에만 저장됩니다.
   학점 기준: 국가평생교육진흥원 공식 자료 및
   「제28차 자격 학점인정 기준」 고시(2025.12.15 시행),
   「중복 과목 및 대체 과목 처리 기준」 고시(제2013-16호)
   ===================================================== */

'use strict';

/* ---------- 아이콘 (라인 스타일 통일) ---------- */

const I = (path, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra}>${path}</svg>`;

const ICONS = {
  home: I('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
  map: I('<circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8 17.5C13 15 11 9 16 6.6"/>'),
  book: I('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17.5H6.5A2.5 2.5 0 0 0 4 22V4.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>'),
  calendar: I('<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
  more: I('<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  bell: I('<path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9"/><path d="M10 19.5a2.2 2.2 0 0 0 4 0"/>'),
  bellOff: I('<path d="M8.6 3.6A6 6 0 0 1 18 9c0 3 .6 4.9 1.3 6M6 9c0 6-2.5 7-2.5 7h13M10 19.5a2.2 2.2 0 0 0 4 0"/><path d="M3 3l18 18"/>'),
  trash: I('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5"/>'),
  check: I('<path d="M4.5 12.5 10 18 19.5 7" stroke-width="2.4"/>'),
  alert: I('<path d="M12 3.5 22 20H2z"/><path d="M12 10v4.5M12 17.5v.1"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.1"/>'),
  award: I('<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21.5l5-2.5 5 2.5-1.5-8"/>'),
  help: I('<circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.8 2.8 0 1 1 3.9 3c-.8.5-1.2 1-1.2 2M12 17.5v.1"/>'),
  person: I('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>'),
  download: I('<path d="M12 3v12m0 0 4.5-4.5M12 15 7.5 10.5"/><path d="M4 18.5V21h16v-2.5"/>'),
  upload: I('<path d="M12 15V3m0 0 4.5 4.5M12 3 7.5 7.5"/><path d="M4 18.5V21h16v-2.5"/>'),
  refresh: I('<path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5"/>'),
  edit: I('<path d="M4 20h4L20 8l-4-4L4 16v4z"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>'),
  chart: I('<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>'),
  db: I('<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5V18.5c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  left: I('<path d="M15 5l-7 7 7 7"/>'),
  right: I('<path d="M9 5l7 7-7 7"/>'),
  list: I('<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.1M3.5 12h.1M3.5 18h.1"/>')
};

/* ---------- 상수 ---------- */

const CATS = { major: '전공', liberal: '교양', general: '일반선택' };

const SCHED_TYPES = {
  exam:       { label: '시험',   subs: ['중간고사', '기말고사', '퀴즈'] },
  assignment: { label: '과제',   subs: [] },
  discussion: { label: '토론',   subs: [] },
  cert:       { label: '자격증', subs: ['원서 접수', '시험 준비', '시험일', '합격 발표'] },
  etc:        { label: '기타',   subs: [] }
};

const PALETTE = ['#e03131', '#e8590c', '#f08c00', '#2f9e44', '#099268', '#0c8599', '#1971c2', '#3b5bdb', '#7048e8', '#d6336c', '#868e96'];

const TYPE_COLORS = { exam: '#e03131', assignment: '#1971c2', discussion: '#7048e8', cert: '#e8590c', etc: '#868e96' };
const CAT_COLORS = { major: '#1971c2', liberal: '#2f9e44', general: '#f08c00' };

const PLAN_KINDS = { cert: '자격증', dokhak: '독학사 시험', other: '기타' };

const TABS = [
  { id: 'home',     label: '홈',     icon: 'home' },
  { id: 'roadmap',  label: '로드맵', icon: 'map' },
  { id: 'courses',  label: '과목',   icon: 'book' },
  { id: 'schedule', label: '일정',   icon: 'calendar' },
  { id: 'more',     label: '더보기', icon: 'more' }
];

/* ---------- 상태 ---------- */

const STORE_KEY = 'cbp_state_v1';

const defaultState = () => ({
  profile: {
    done: false,
    degree: 'bachelor',
    major: '',
    startDate: todayStr(),
    goalYm: null,          // 목표 학위수여 시점 'YYYY-MM' (2월 또는 8월)
    earned: { major: 0, liberal: 0, general: 0 },   // 이미 인정받은 학점
    pending: { major: 0, liberal: 0, general: 0 },  // 이수했지만 학점인정 신청 전인 학점
    certsUsed: 0
  },
  roadmapMode: 'auto',
  manualTerms: null,
  courses: [],             // {id, name, credits, category, required, status, color}
  plans: [],               // 보충 계획 {id, kind, name, credits, target, status:'planning'|'done'}
  schedules: [],           // {id, title, type, subtype, start, end, time, memo, alarm, done, color, planId}
  notif: {
    enabled: false,
    studyOn: true,
    studyDays: [1, 2, 3, 4, 5],
    studyTime: '20:00',
    schedOn: true,
    schedTime: '09:00',
    dayBefore: true,
    fired: {}
  },
  ui: { tab: 'home', sub: null, filter: 'all', schedView: 'list', calYm: null, calSel: null }
});

let S = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    const st = Object.assign(defaultState(), s, {
      profile: Object.assign(defaultState().profile, s.profile),
      notif: Object.assign(defaultState().notif, s.notif),
      ui: Object.assign(defaultState().ui, s.ui)
    });
    migrate(st);
    return st;
  } catch (e) {
    return defaultState();
  }
}

/* 이전 버전 데이터 마이그레이션 */
function migrate(st) {
  // 목표: '개월 수' → '학위수여 시점(2월/8월)'
  if (!st.profile.goalYm) {
    if (st.profile.months) {
      const end = addMonths(st.profile.startDate || todayStr(), st.profile.months);
      st.profile.goalYm = nextConferralYm(end);
    } else if (st.profile.done) {
      st.profile.goalYm = nextConferralYm(addMonths(todayStr(), 18));
    }
    delete st.profile.months;
  }
  // 일정: 단일 날짜 → 기간(start~end) + 색상
  for (const sc of st.schedules) {
    if (!sc.start) { sc.start = sc.date || todayStr(); }
    if (!sc.end) { sc.end = sc.date || sc.start; }
    delete sc.date;
    if (!sc.color) sc.color = TYPE_COLORS[sc.type] || TYPE_COLORS.etc;
  }
  // 과목: 색상
  for (const c of st.courses) {
    if (!c.color) c.color = CAT_COLORS[c.category] || PALETTE[6];
  }
  if (!Array.isArray(st.plans)) st.plans = [];
  // 인정 예정 학점 필드 (구버전 데이터)
  if (!st.profile.pending) st.profile.pending = { major: 0, liberal: 0, general: 0 };
}

function save() {
  S._updatedAt = new Date().toISOString();
  localStorage.setItem(STORE_KEY, JSON.stringify(S));
  scheduleCloudPush(); // 로그인 상태면 클라우드에도 자동 저장 (디바운스)
}

/* ---------- 유틸 ---------- */

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function todayStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
}

function addMonths(str, m) {
  const d = parseDate(str);
  d.setMonth(d.getMonth() + m);
  return todayStr(d);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function fmtDate(str, opts = {}) {
  if (!str) return '';
  const d = parseDate(str);
  const base = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return opts.day === false ? base : `${base} (${WEEKDAYS[d.getDay()]})`;
}

function fmtYM(str) {
  const d = parseDate(str);
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtRange(s) {
  if (s.start === s.end) return fmtDate(s.start);
  return `${fmtDate(s.start)} ~ ${fmtDate(s.end)}`;
}

function dday(str) {
  const t = parseDate(todayStr());
  const d = parseDate(str);
  return Math.round((d - t) / 86400000);
}

/* 기간 일정용 D-day 배지 */
function schedDday(s) {
  const ds = dday(s.start), de = dday(s.end);
  if (de < 0) return `<span class="dday past">종료</span>`;
  if (ds > 0) {
    if (ds <= 7) return `<span class="dday soon">D-${ds}</span>`;
    return `<span class="dday later">D-${ds}</span>`;
  }
  // 진행 중 (시작일 지남, 종료일 안 지남)
  if (s.start === s.end) return `<span class="dday today">D-Day</span>`;
  if (de === 0) return `<span class="dday today">오늘 마감</span>`;
  return `<span class="dday ongoing">진행 중 · 마감 D-${de}</span>`;
}

let toastTimer = null;
function toast(msg) {
  $('#modal-root').insertAdjacentHTML('beforeend',
    `<div class="toast" id="toast">${esc(msg)}</div>`);
  clearTimeout(toastTimer);
  const prev = $$('.toast');
  prev.slice(0, -1).forEach(t => t.remove());
  toastTimer = setTimeout(() => $$('.toast').forEach(t => t.remove()), 2600);
}

/* ---------- 학위수여 시점 (연 2회: 2월 · 8월) ---------- */

/* 특정 수여 시점의 상세 정보 */
function goalInfoOf(ym) {
  const [y, m] = ym.split('-').map(Number);
  const first = m === 2; // 전기
  return {
    ym, year: y, month: m,
    half: first ? '전기' : '후기',
    label: `${y}년 ${m}월`,
    // 수업(학기) 마감: 전기는 전년도 12월 말, 후기는 6월 말까지 이수 완료가 안전
    studyEnd: first ? `${y - 1}-12-31` : `${y}-06-30`,
    applyStart: first ? `${y - 1}-12-15` : `${y}-06-15`,
    applyEnd: first ? `${y}-01-15` : `${y}-07-15`,
    applyLabel: first ? `${y - 1}.12.15 ~ ${y}.1.15` : `${y}.6.15 ~ ${y}.7.15`,
    lastRecog: first ? `${y}년 1월` : `${y}년 7월`,
    conferDate: `${y}-${String(m).padStart(2, '0')}-28`
  };
}

/* 기준일 이후 첫 수여 시점 */
function nextConferralYm(dateStr) {
  const d = parseDate(dateStr);
  const y = d.getFullYear();
  const cands = [`${y}-02`, `${y}-08`, `${y + 1}-02`, `${y + 1}-08`];
  for (const ym of cands) {
    if (parseDate(goalInfoOf(ym).conferDate) >= d) return ym;
  }
  return `${y + 2}-02`;
}

/* 앞으로 선택 가능한 수여 시점 목록 (학습 기간이 남아있는 것만) */
function conferralOpts(n = 8) {
  const t = parseDate(todayStr());
  const list = [];
  for (let y = t.getFullYear(); list.length < n && y < t.getFullYear() + 8; y++) {
    for (const m of ['02', '08']) {
      const gi = goalInfoOf(`${y}-${m}`);
      if (parseDate(gi.studyEnd) > t && list.length < n) list.push(gi);
    }
  }
  return list;
}

function goalInfo() {
  return goalInfoOf(S.profile.goalYm || nextConferralYm(addMonths(todayStr(), 18)));
}

/* 시작일~수업 마감일 사이의 학기 수 */
function termCountBetween(startStr, endStr) {
  const days = (parseDate(endStr) - parseDate(startStr)) / 86400000;
  if (days <= 0) return 0;
  return Math.max(1, Math.ceil(days / 30.44 / 6 - 0.05));
}

/* ---------- 학점 계산 ---------- */

function getReq() {
  return DATA.degrees[S.profile.degree];
}

/* 취득 학점을 '인정 완료'와 '인정 예정(신청 전)'으로 나눠 집계
   - 인정 완료: 프로필의 earned + 인정 처리된 이수 과목·합격 자격
   - 인정 예정: 프로필의 pending + 아직 학점인정 신청 전인 이수 과목·합격 자격
   둘 다 학위 요건 계산에는 포함되지만, 인정 예정분은 신청(연 4회)을 놓치면 안 되므로 따로 보여줌 */
function creditBreakdown() {
  const conf = { major: S.profile.earned.major, liberal: S.profile.earned.liberal, general: S.profile.earned.general };
  const pend = { major: S.profile.pending.major || 0, liberal: S.profile.pending.liberal || 0, general: S.profile.pending.general || 0 };
  for (const c of S.courses) {
    if (c.status === 'done') (c.recognized ? conf : pend)[c.category] += c.credits;
  }
  for (const p of S.plans) {
    if (p.status === 'done') (p.recognized ? conf : pend)[p.target] += p.credits;
  }
  const confTotal = conf.major + conf.liberal + conf.general;
  const pendTotal = pend.major + pend.liberal + pend.general;
  return { conf, pend, confTotal, pendTotal };
}

/* 학점인정 신청 완료 처리: 인정 예정분을 인정 완료로 이동 */
function applyRecognition() {
  const bd = creditBreakdown();
  for (const k of ['major', 'liberal', 'general']) {
    S.profile.earned[k] += S.profile.pending[k] || 0;
    S.profile.pending[k] = 0;
  }
  for (const c of S.courses) if (c.status === 'done') c.recognized = true;
  for (const p of S.plans) if (p.status === 'done') p.recognized = true;
  save(); render();
  toast(`${bd.pendTotal}학점을 인정 완료로 반영했어요 🎉`);
}

function earnedCredits() {
  const bd = creditBreakdown();
  return {
    major: bd.conf.major + bd.pend.major,
    liberal: bd.conf.liberal + bd.pend.liberal,
    general: bd.conf.general + bd.pend.general
  };
}

function calcNeeds() {
  const req = getReq();
  const e = earnedCredits();
  const totalEarned = e.major + e.liberal + e.general;
  const major = Math.max(0, req.major - e.major);
  const liberal = Math.max(0, req.liberal - e.liberal);
  const totalNeed = Math.max(0, req.total - totalEarned);
  const general = Math.max(0, totalNeed - major - liberal);
  return { major, liberal, general, total: major + liberal + general, earned: e, totalEarned, req };
}

/* 자격증 학점인정 개수 슬롯 */
function certSlotInfo() {
  const req = getReq();
  const used = S.profile.certsUsed + S.plans.filter(p => p.kind === 'cert').length;
  const generalUsed = S.plans.filter(p => p.kind === 'cert' && p.target === 'general').length;
  return { limit: req.certLimit, used, slots: Math.max(0, req.certLimit - used), generalUsed };
}

/* 학기별 최대 학점 패턴: 학기 24 · 연 42 → 24, 18, 24, 18 … */
function termCap(i) { return i % 2 === 0 ? 24 : 18; }

function capacity(terms) {
  let c = 0;
  for (let i = 0; i < terms; i++) c += termCap(i);
  return c;
}

function minTermsFor(credits) {
  let t = 0;
  while (capacity(t) < credits && t < 40) t++;
  return Math.max(1, t);
}

/* 자격증 자동 추천: 남은 슬롯 안에서 전공 관련 자격증을 골라
   수업만으로 기간 안에 못 채울 때 학점을 보충
   (사용자가 직접 세운 보충 계획을 먼저 반영한 뒤 남는 부족분에만 사용) */
function pickCerts(needsRem, terms, slotInfo, excludeNames) {
  if (slotInfo.slots === 0) return [];
  const majorRelated = DATA.certs
    .filter(c => c.majors.includes(S.profile.major) && !excludeNames.includes(c.name))
    .sort((a, b) => b.credits - a.credits);
  const generalCerts = DATA.certs
    .filter(c => !c.majors.includes(S.profile.major) && !excludeNames.includes(c.name))
    .sort((a, b) => b.credits - a.credits);

  const picked = [];
  let { major, liberal, general } = needsRem;
  let generalLeft = Math.max(0, DATA.certRules.maxGeneral - slotInfo.generalUsed);
  const courseNeed = () => major + liberal + general;

  const tryAdd = (cert, target) => {
    if (picked.length >= slotInfo.slots) return;
    if (picked.some(p => p.name === cert.name)) return;
    if (target === 'major' && major > 0) {
      const used = Math.min(cert.credits, major);
      major -= used;
      picked.push({ ...cert, target: 'major', used });
    } else if (target === 'general' && general > 0 && generalLeft > 0) {
      // 전공 비연계 자격은 일반선택으로 1개까지만 인정 (공식 기준)
      generalLeft--;
      const used = Math.min(cert.credits, general);
      general -= used;
      picked.push({ ...cert, target: 'general', used });
    }
  };

  let guard = 0;
  while (courseNeed() > capacity(terms) && picked.length < slotInfo.slots && guard++ < 10) {
    const before = courseNeed();
    const nextMajor = majorRelated.find(c => !picked.some(p => p.name === c.name));
    if (nextMajor && major > 0) tryAdd(nextMajor, 'major');
    else {
      const nextGen = generalCerts.find(c => !picked.some(p => p.name === c.name));
      if (nextGen && general > 0) tryAdd(nextGen, 'general');
    }
    if (courseNeed() === before) break;
  }
  return picked;
}

/* 로드맵 생성 */
function buildRoadmap() {
  const gi = goalInfo();
  const needs = calcNeeds();
  const termCount = termCountBetween(S.profile.startDate, gi.studyEnd);

  // ① 사용자가 직접 세운 보충 계획(자격증·독학사 등, 아직 완료 전) 반영
  const myPlans = S.plans.filter(p => p.status !== 'done');
  const rem = { major: needs.major, liberal: needs.liberal, general: needs.general };
  const planSup = { major: 0, liberal: 0, general: 0 };
  for (const p of myPlans) {
    const used = Math.min(p.credits, rem[p.target] || 0);
    rem[p.target] -= used;
    planSup[p.target] += used;
  }
  const planSupTotal = planSup.major + planSup.liberal + planSup.general;

  // ② 자동 추천 자격증 (자동 모드에서, 그래도 부족할 때만)
  const slotInfo = certSlotInfo();
  const excludeNames = S.plans.map(p => p.name);
  const certs = (S.roadmapMode === 'auto' && termCount > 0)
    ? pickCerts(rem, termCount, slotInfo, excludeNames) : [];
  for (const c of certs) rem[c.target] = Math.max(0, rem[c.target] - c.used);

  const courseNeed = rem.major + rem.liberal + rem.general;

  // 학기별 총 학점
  let totals;
  if (S.roadmapMode === 'manual' && Array.isArray(S.manualTerms) && S.manualTerms.length === termCount) {
    totals = S.manualTerms.slice();
  } else {
    totals = [];
    let left = courseNeed;
    for (let i = 0; i < termCount; i++) {
      const remTerms = termCount - i;
      const t = Math.min(termCap(i), Math.ceil(left / remTerms / 3) * 3, left);
      totals.push(Math.max(0, t));
      left -= totals[i];
    }
    let i = 0;
    while (left > 0 && i < termCount) {
      const add = Math.min(left, termCap(i) - totals[i]);
      totals[i] += add; left -= add; i++;
    }
  }

  // 학기별 구분 배분 (교양은 고르게 → 전공 → 일선 순)
  const alloc = { ...rem };
  const terms = totals.map((total, i) => {
    const t = { total, major: 0, liberal: 0, general: 0 };
    let left = total;
    const remTerms = totals.length - i;
    t.liberal = Math.min(left, Math.min(alloc.liberal, Math.ceil(alloc.liberal / remTerms / 3) * 3));
    left -= t.liberal;
    t.major = Math.min(left, alloc.major);
    left -= t.major;
    t.general = Math.min(left, alloc.general);
    left -= t.general;
    if (left > 0) {
      const extra = Math.min(left, alloc.liberal - t.liberal);
      t.liberal += extra; left -= extra;
    }
    t.total = t.major + t.liberal + t.general;
    alloc.major -= t.major; alloc.liberal -= t.liberal; alloc.general -= t.general;
    return t;
  });

  const planned = terms.reduce((s, t) => s + t.total, 0);
  const shortfall = courseNeed - planned;

  // 경고 (사용자 보충 계획을 반영한 후의 진짜 부족분만 경고)
  const warnings = [];
  if (termCount === 0 && needs.total > 0) {
    warnings.push({
      level: 'danger',
      msg: `${gi.label} 수여를 받으려면 수업을 ${fmtDate(gi.studyEnd, { day: false })}까지 이수해야 하는데, 남은 기간이 없습니다. 목표를 다음 수여 시점으로 변경해 주세요.`
    });
  }
  if (shortfall > 0 && termCount > 0) {
    const minT = minTermsFor(courseNeed);
    warnings.push({
      level: 'danger',
      msg: `${gi.label} 수여 목표까지 수업만으로는 ${shortfall}학점이 부족합니다. 최소 ${minT}학기(약 ${minT * 6}개월)가 필요합니다. 자격증·독학학위제 시험을 보충 계획에 추가하거나(연 42학점 제한에 미포함), 목표 시점을 늦춰 주세요.${planSupTotal > 0 ? ` (직접 세우신 보충 계획 ${planSupTotal}학점은 이미 반영했습니다)` : ''}`
    });
  } else if (planSupTotal > 0 && needs.total > 0 && termCount > 0) {
    warnings.push({
      level: 'info',
      msg: `직접 세우신 보충 계획 ${planSupTotal}학점(자격증·독학사 등)을 반영한 로드맵입니다. 계획이 바뀌면 로드맵 화면에서 언제든 수정할 수 있어요.`
    });
  }
  terms.forEach((t, i) => {
    if (t.total > 24) warnings.push({ level: 'warn', msg: `${i + 1}학기 계획이 학기 최대 인정 학점(24학점)을 초과합니다.` });
  });
  for (let i = 0; i + 1 < terms.length; i += 2) {
    if (terms[i].total + terms[i + 1].total > 42)
      warnings.push({ level: 'warn', msg: `${i + 1}~${i + 2}학기 합계가 연간 최대 인정 학점(42학점)을 초과합니다. 자격증 학점은 이 제한에 포함되지 않습니다.` });
  }

  // 학위요건: 평가인정 학습과목·시간제등록 18학점 이상 필수
  const doneCourseCredits = S.courses.filter(c => c.status === 'done').reduce((s, c) => s + c.credits, 0);
  if (needs.total > 0 && doneCourseCredits + planned < (getReq().minBank || 18)) {
    warnings.push({ level: 'warn', msg: `학위를 받으려면 평가인정 학습과목 또는 시간제등록으로 반드시 18학점 이상을 이수해야 합니다. 자격증·전적대 학점만으로 채우지 않도록 주의하세요.` });
  }

  return { gi, needs, terms, certs, myPlans, planSup, planSupTotal, courseNeed, warnings, shortfall, termCount };
}

/* ---------- 라우팅 ---------- */

function go(tab, sub = null) {
  S.ui.tab = tab;
  S.ui.sub = sub;
  save();
  render();
  $('#main').scrollTop = 0;
  window.scrollTo(0, 0);
}

function renderNav() {
  const html = TABS.map(t => `
    <button class="nav-btn ${S.ui.tab === t.id ? 'active' : ''}" data-tab="${t.id}">
      ${ICONS[t.icon]}<span>${t.label}</span>
    </button>`).join('');
  $('#sidebar').innerHTML = `<div class="brand">학점은행 플래너</div>` + html;
  $('#tabbar').innerHTML = html;
  $$('[data-tab]').forEach(b => b.onclick = () => go(b.dataset.tab));
}

function render() {
  if (!S.profile.done) { renderOnboarding(); return; }
  $('#app').classList.remove('onboarding');
  renderNav();
  const v = $('#view');
  switch (S.ui.tab) {
    case 'home': v.innerHTML = viewHome(); bindHome(); break;
    case 'roadmap': v.innerHTML = viewRoadmap(); bindRoadmap(); break;
    case 'courses': v.innerHTML = viewCourses(); bindCourses(); break;
    case 'schedule': v.innerHTML = viewSchedule(); bindSchedule(); break;
    case 'more': renderMore(); break;
    default: v.innerHTML = viewHome(); bindHome();
  }
}

/* ---------- 공용: 색상 선택 ---------- */

function swatchesHtml(id, cur) {
  return `<div class="swatches" id="${id}">
    ${PALETTE.map(c => `<button type="button" class="sw ${c === cur ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="색상 ${c}"></button>`).join('')}
  </div>`;
}

function bindSwatches(id, onPick) {
  $$(`#${id} .sw`).forEach(b => b.onclick = () => {
    $$(`#${id} .sw`).forEach(x => x.classList.toggle('on', x === b));
    onPick(b.dataset.c);
  });
}

/* ---------- 공용: ? 도움말 ---------- */

function helpBtn(key) {
  return `<button class="help-btn" type="button" data-help="${key}" aria-label="자세한 설명 보기">${ICONS.help}</button>`;
}

function bindHelp() {
  $$('[data-help]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const h = DATA.help[b.dataset.help];
    if (!h) return;
    openModal(`
      <h3>${h.t}</h3>
      <div class="help-body">${h.body}</div>
      <div class="modal-actions"><button class="btn primary" data-close>알겠어요!</button></div>`);
  });
}

/* ---------- 온보딩 (천천히, 하나씩) ---------- */

let ob = {
  phase: 'auth',    // auth(로그인/가입) → intro(분기) → guide(초보자 설명) → plan(계획 세우기)
  guideStep: 0,
  step: 0, degree: 'bachelor', major: '',
  earned: { major: 0, liberal: 0, general: 0 },
  pending: { major: 0, liberal: 0, general: 0 },
  certsUsed: 0,
  courses: [], plans: [], goalYm: null
};

const PLAN_STEPS = () => [obStep1, obStep2, obStep3, obStep4, obStep5, obStep6];

function renderOnboarding() {
  // 온보딩 동안은 사이드바를 숨기고 화면 정중앙에 (시선 분산 방지)
  $('#app').classList.add('onboarding');
  $('#sidebar').innerHTML = '';
  $('#tabbar').innerHTML = '';

  // 서버가 없으면(설정 전 · file://) 로그인 화면은 건너뜀
  if (ob.phase === 'auth' && !(cloudConfigured() && location.protocol.startsWith('http'))) ob.phase = 'intro';

  let inner;
  if (ob.phase === 'auth') inner = obAuth();
  else if (ob.phase === 'intro') inner = obIntro();
  else if (ob.phase === 'guide') inner = obGuide();
  else {
    const steps = PLAN_STEPS();
    inner = `
      <div class="step-dots">${steps.map((_, i) => `<span class="${i <= ob.step ? 'on' : ''}"></span>`).join('')}</div>
      ${steps[ob.step]()}`;
  }
  $('#view').innerHTML = `<div class="onboard">${inner}</div>`;
  bindOnboarding();
}

/* --- 가장 첫 화면: 로그인 / 처음이에요 --- */
function obAuth() {
  return `
    <div class="intro-hero">
      <div class="intro-logo">🎓</div>
      <h1 style="text-align:center">학점은행 플래너</h1>
      <p class="sub" style="text-align:center">혼자서도 체계적인 학위 계획.<br>계정으로 시작하면 어떤 기기에서든 이어서 할 수 있어요.</p>
    </div>
    <button class="opt-card intro-card" data-auth-login>
      <div class="t">🔑 이미 계정이 있어요</div>
      <div class="d">로그인하면 저장해 둔 계획을 그대로 불러와요. 로그인은 한 번만 하면 계속 유지돼요.</div>
    </button>
    <button class="opt-card intro-card" data-auth-signup>
      <div class="t">✨ 처음이에요</div>
      <div class="d">아이디·비밀번호만 만들면 바로 시작! 이메일 인증 없이, 만드는 계획이 자동으로 저장돼요.</div>
    </button>
    <button class="btn full" data-auth-skip style="margin-top:6px;border:0;color:var(--text-3)">로그인 없이 시작하기 (이 기기에만 저장)</button>`;
}

/* --- 첫 화면: 초보자 / 바로 계획 분기 --- */
function obIntro() {
  return `
    <div class="intro-hero">
      <div class="intro-logo">🎓</div>
      <h1 style="text-align:center">반가워요!<br>학점은행 플래너예요</h1>
      <p class="sub" style="text-align:center">학점은행제 학위 취득, 혼자서도 체계적으로 할 수 있어요.<br>어떻게 시작할까요?</p>
    </div>
    <button class="opt-card intro-card" data-route="beginner">
      <div class="t">🌱 학은제, 처음이에요</div>
      <div class="d">차근차근 알려주세요 — 학점은행제가 뭔지, 학위 종류, 학점 쌓는 법부터 6개 스텝으로 쉽게 설명한 뒤 계획을 세워요.</div>
    </button>
    <button class="opt-card intro-card" data-route="direct">
      <div class="t">🚀 어느 정도 알고 있어요</div>
      <div class="d">바로 계획을 세우고 싶어요 — 내 정보를 입력하고 곧장 로드맵을 만들어요. 이미 진행 중이어도 이어서 계획할 수 있어요.</div>
    </button>
    <div class="footnote" style="text-align:center">모든 단계에서 ${ICONS.help.replace('<svg', '<svg style="width:13px;height:13px;vertical-align:-2px"')} 버튼을 누르면 자세한 설명을 볼 수 있어요.</div>`;
}

/* --- 초보자 가이드 (스텝 1~6) --- */
function obGuide() {
  const g = DATA.guide[ob.guideStep];
  const last = ob.guideStep === DATA.guide.length - 1;
  return `
    <div class="guide-progress">스텝 ${ob.guideStep + 1} / ${DATA.guide.length}</div>
    <div class="step-dots">${DATA.guide.map((_, i) => `<span class="${i <= ob.guideStep ? 'on' : ''}"></span>`).join('')}</div>
    <div class="guide-icon">${g.icon}</div>
    <h1>${g.t}</h1>
    <div class="ob-guide" style="font-size:14px">${g.body}</div>
    <div style="margin-top:24px;display:flex;gap:8px">
      <button class="btn" data-gprev>${ob.guideStep === 0 ? '처음으로' : '이전'}</button>
      <button class="btn primary" style="flex:1" data-gnext>${last ? '이제 계획 세우러 가요! ✏️' : '다음'}</button>
    </div>
    ${last ? '' : `<button class="btn full" data-gskip style="margin-top:8px;border:0;color:var(--text-3)">설명 건너뛰고 바로 계획 세우기</button>`}`;
}

function obStep1() {
  return `
    <h1>어떤 학위가 목표인가요? ${helpBtn('degree')}</h1>
    <p class="sub">학위 과정에 따라 필요한 학점이 자동으로 계산됩니다.</p>
    <div class="opt-grid" style="grid-template-columns:1fr">
      ${Object.entries(DATA.degrees).map(([k, d]) => `
        <button class="opt-card ${ob.degree === k ? 'selected' : ''}" data-degree="${k}">
          <div class="t">${d.name}</div>
          <div class="d">${d.note}</div>
        </button>`).join('')}
    </div>
    <div style="margin-top:28px;display:flex;gap:8px">
      <button class="btn" data-prev>이전</button>
      <button class="btn primary" style="flex:1" data-next>다음</button>
    </div>`;
}

function obStep2() {
  const isBachelor = ob.degree === 'bachelor' || ob.degree === 'bachelor2';
  const majors = isBachelor ? DATA.majors.bachelor : DATA.majors.associate;
  return `
    <h1>전공을 선택해 주세요 ${helpBtn('major')}</h1>
    <p class="sub">전공에 따라 필수 과목과 학점인정 자격증이 달라져요. 목록에 없으면 직접 입력할 수 있어요.</p>
    <div class="field">
      <label>전공</label>
      <select id="ob-major">
        <option value="">선택하세요</option>
        ${majors.map(m => `<option ${ob.major === m ? 'selected' : ''}>${m}</option>`).join('')}
        <option value="__custom" ${ob.major && !majors.includes(ob.major) ? 'selected' : ''}>직접 입력…</option>
      </select>
    </div>
    <div class="field" id="ob-custom-wrap" style="display:${ob.major && !majors.includes(ob.major) ? 'block' : 'none'}">
      <label>전공명 직접 입력</label>
      <input type="text" id="ob-major-custom" value="${esc(!majors.includes(ob.major) ? ob.major : '')}" placeholder="예: 문화예술경영학">
    </div>
    <div style="margin-top:28px;display:flex;gap:8px">
      <button class="btn" data-prev>이전</button>
      <button class="btn primary" style="flex:1" data-next>다음</button>
    </div>`;
}

function obStep3() {
  return `
    <h1>학점 상황을 알려주세요 ${helpBtn('credits')}</h1>
    <p class="sub">학점인정 신청은 <b>연 4회(1·4·7·10월)</b>뿐이라, 이수는 했지만 아직 신청 전인 학점이 있는 경우가 많아요. <b>인정 완료</b>와 <b>인정 예정</b>을 나눠서 입력하면 신청 시기까지 챙겨 드릴게요. 없으면 0으로 두시면 돼요.</p>

    <div class="section-title" style="margin-top:0">① 이미 인정받은 학점 <span style="font-weight:400">— 학점은행 홈페이지에서 인정 완료된 것</span></div>
    <div class="field"><label>전공 학점</label><input type="number" id="ob-e-major" min="0" max="200" value="${ob.earned.major}"></div>
    <div class="field"><label>교양 학점</label><input type="number" id="ob-e-liberal" min="0" max="200" value="${ob.earned.liberal}"></div>
    <div class="field"><label>일반선택 학점</label><input type="number" id="ob-e-general" min="0" max="200" value="${ob.earned.general}"></div>

    <div class="section-title">② 인정 받을 예정인 학점 <span style="font-weight:400">— 이수·취득했지만 아직 학점인정 신청 전</span></div>
    <div class="field"><label>전공 학점</label><input type="number" id="ob-p-major" min="0" max="200" value="${ob.pending.major}"></div>
    <div class="field"><label>교양 학점</label><input type="number" id="ob-p-liberal" min="0" max="200" value="${ob.pending.liberal}"></div>
    <div class="field"><label>일반선택 학점</label><input type="number" id="ob-p-general" min="0" max="200" value="${ob.pending.general}">
      <div class="hint">예: 지난 학기에 이수한 과목, 합격했지만 아직 신청 안 한 자격증 학점. 다음 신청 기간에 알림으로 챙겨 드려요.</div></div>

    <div class="field" style="margin-top:20px">
      <label>학점인정에 이미 사용한 자격증 수</label>
      <select id="ob-certs">${[0, 1, 2, 3].map(n => `<option value="${n}" ${ob.certsUsed === n ? 'selected' : ''}>${n}개</option>`).join('')}</select>
      <div class="hint">자격증 학점인정은 학사 3개 · 전문학사 2개 · 타전공 과정 1개까지 가능합니다. (기능사는 인정 불가)</div>
    </div>
    <div style="margin-top:28px;display:flex;gap:8px">
      <button class="btn" data-prev>이전</button>
      <button class="btn primary" style="flex:1" data-next>다음</button>
    </div>`;
}

function obStep4() {
  return `
    <h1>지금 듣고 있는 강의가 있나요? ${helpBtn('courses')}</h1>
    <p class="sub">현재 수강 중인 과목을 등록해 두면 진행률과 로드맵에 바로 반영돼요. 없으면 건너뛰어도 괜찮아요.</p>
    ${ob.courses.length ? ob.courses.map((c, i) => `
      <div class="item">
        <span class="color-dot" style="background:${CAT_COLORS[c.category]}"></span>
        <div class="grow"><div class="t">${esc(c.name)}</div>
        <div class="s">${CATS[c.category]} · ${c.credits}학점 · 수강 중</div></div>
        <button class="icon-btn" data-ob-del-course="${i}">${ICONS.trash}</button>
      </div>`).join('') : ''}
    <div class="mini-form">
      <div class="field"><label>과목명</label><input type="text" id="ob-c-name" placeholder="예: 경영학원론"></div>
      <div class="field"><label>구분</label>
        <div class="seg" id="ob-c-cat">
          ${Object.entries(CATS).map(([k, l], i) => `<button data-cat="${k}" class="${i === 0 ? 'active' : ''}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="field" style="margin-bottom:4px"><label>학점</label>
        <select id="ob-c-credits">${[1, 2, 3, 4].map(n => `<option value="${n}" ${n === 3 ? 'selected' : ''}>${n}학점</option>`).join('')}</select>
      </div>
      <button class="btn full" data-ob-add-course style="margin-top:8px">${ICONS.plus} 이 강의 추가</button>
    </div>
    <div style="margin-top:28px;display:flex;gap:8px">
      <button class="btn" data-prev>이전</button>
      <button class="btn primary" style="flex:1" data-next>${ob.courses.length ? '다음' : '지금은 없어요, 다음'}</button>
    </div>`;
}

function obStep5() {
  const isBachelor = ob.degree === 'bachelor' || ob.degree === 'bachelor2';
  const related = DATA.certs.filter(c => c.majors.includes(ob.major));
  const limit = DATA.degrees[ob.degree].certLimit;
  const slotsLeft = Math.max(0, limit - ob.certsUsed - ob.plans.filter(p => p.kind === 'cert').length);
  return `
    <h1>준비 중인 자격증이나<br>독학사 시험이 있나요? ${helpBtn('plans')}</h1>
    <p class="sub">자격증·독학학위제 시험 학점은 <b>연 42학점 제한에 포함되지 않아</b> 기간 단축의 핵심이에요. 계획에 넣어두면 로드맵이 그만큼 여유 있게 계산됩니다. 없으면 건너뛰어도 돼요.</p>

    ${ob.plans.length ? `<div class="section-title" style="margin-top:0">내 계획</div>` : ''}
    ${ob.plans.map((p, i) => `
      <div class="item">
        <div class="grow"><div class="t">${esc(p.name)}</div>
        <div class="s">${PLAN_KINDS[p.kind]} · +${p.credits}학점 · ${CATS[p.target]}</div></div>
        <button class="icon-btn" data-ob-del-plan="${i}">${ICONS.trash}</button>
      </div>`).join('')}

    ${related.length ? `
      <div class="section-title">‘${esc(ob.major)}’ 전공학점으로 인정되는 자격증 (제28차 고시 기준)</div>
      ${related.map(c => {
        const on = ob.plans.some(p => p.name === c.name);
        return `<button class="opt-card ${on ? 'selected' : ''}" data-ob-cert="${esc(c.name)}" style="width:100%;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <span><span class="t" style="font-size:14px">${esc(c.name)}</span>
          <span class="d" style="display:block">${esc(c.grade)} · 전공학점 인정</span></span>
          <span class="chip accent">+${c.credits}학점</span>
        </button>`;
      }).join('')}
      <div class="hint" style="margin-top:2px">자격증은 ${isBachelor ? '학사 최대 3개' : '전문학사 최대 2개'}까지 인정 — 지금 ${slotsLeft}개 더 넣을 수 있어요.</div>` : ''}

    <div class="mini-form">
      <div class="field"><label>직접 추가 (자격증 · 독학사 시험 등)</label>
        <div class="seg" id="ob-p-kind">
          ${Object.entries(PLAN_KINDS).map(([k, l], i) => `<button data-kind="${k}" class="${i === 0 ? 'active' : ''}">${l}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label>이름</label><input type="text" id="ob-p-name" placeholder="예: 텔레마케팅관리사 / 독학사 2단계 경영학"></div>
      <div class="field"><label>예상 인정 학점</label><input type="number" id="ob-p-credits" min="1" max="45" placeholder="예: 18">
        <div class="hint">자격증은 학점은행 홈페이지 ‘자격 검색’, 독학사는 과목당 4~5학점이 기준이에요.</div></div>
      <div class="field" style="margin-bottom:4px"><label>인정 구분</label>
        <div class="seg" id="ob-p-target">
          ${Object.entries(CATS).map(([k, l], i) => `<button data-target="${k}" class="${i === 0 ? 'active' : ''}">${l}</button>`).join('')}
        </div>
      </div>
      <button class="btn full" data-ob-add-plan style="margin-top:8px">${ICONS.plus} 계획에 추가</button>
    </div>

    <div style="margin-top:28px;display:flex;gap:8px">
      <button class="btn" data-prev>이전</button>
      <button class="btn primary" style="flex:1" data-next>${ob.plans.length ? '다음' : '지금은 없어요, 다음'}</button>
    </div>`;
}

function obStep6() {
  // 목표 시점별 달성 가능성 미리 계산
  const req = DATA.degrees[ob.degree];
  const e = {
    major: ob.earned.major + ob.pending.major,
    liberal: ob.earned.liberal + ob.pending.liberal,
    general: ob.earned.general + ob.pending.general
  };
  const totalEarned = e.major + e.liberal + e.general;
  const needMajor = Math.max(0, req.major - e.major);
  const needLiberal = Math.max(0, req.liberal - e.liberal);
  const needTotal = Math.max(0, req.total - totalEarned);
  const needGeneral = Math.max(0, needTotal - needMajor - needLiberal);
  const planSup = ob.plans.reduce((s, p) => s + p.credits, 0);
  const courseNeed = Math.max(0, needMajor + needLiberal + needGeneral - planSup);

  const opts = conferralOpts(8);
  const today = todayStr();
  let recommended = null;
  const cards = opts.map(gi => {
    const tc = termCountBetween(today, gi.studyEnd);
    const cap = capacity(tc);
    let tag, cls;
    if (cap >= courseNeed) { tag = '수업만으로 달성 가능'; cls = 'ok'; if (!recommended) recommended = gi.ym; }
    else if (cap + 45 >= courseNeed) { tag = '자격증·독학사 병행 필요'; cls = 'warn'; }
    else { tag = '기간이 부족해요'; cls = 'danger'; }
    return { gi, tc, tag, cls };
  });
  if (!ob.goalYm) ob.goalYm = recommended || opts[opts.length - 1].ym;

  return `
    <h1>언제 학위를 받고 싶으세요? ${helpBtn('goal')}</h1>
    <p class="sub">학위수여는 <b>연 2회, 2월과 8월</b>로 정해져 있어요. 그래서 목표는 “몇 개월 뒤”가 아니라 <b>수여 시점</b>으로 정합니다. 남은 학점 ${needTotal}학점${planSup ? ` (보충 계획 ${planSup}학점 반영 시 수업 ${courseNeed}학점)` : ''} 기준으로 계산해 드렸어요.</p>
    <div class="opt-grid">
      ${cards.map(({ gi, tc, tag, cls }) => `
        <button class="opt-card ${ob.goalYm === gi.ym ? 'selected' : ''}" data-goal="${gi.ym}">
          <div class="t">${gi.label} <span style="font-weight:500;color:var(--text-2);font-size:12px">${gi.half}</span></div>
          <div class="d">${tc}학기 · 수업 마감 ${fmtYM(gi.studyEnd)}</div>
          <span class="goal-tag ${cls}">${tag}</span>
          ${gi.ym === recommended ? '<span class="goal-tag ok" style="margin-left:6px">추천</span>' : ''}
        </button>`).join('')}
    </div>
    <div style="margin-top:28px;display:flex;gap:8px">
      <button class="btn" data-prev>이전</button>
      <button class="btn primary" style="flex:1" data-finish>로드맵 만들기</button>
    </div>`;
}

function bindOnboarding() {
  bindHelp();

  // 첫 화면: 로그인 / 회원가입 / 건너뛰기
  const authLogin = $('[data-auth-login]');
  if (authLogin) authLogin.onclick = () => authModal('login');
  const authSignup = $('[data-auth-signup]');
  if (authSignup) authSignup.onclick = () => authModal('signup');
  const authSkip = $('[data-auth-skip]');
  if (authSkip) authSkip.onclick = () => { ob.phase = 'intro'; renderOnboarding(); };

  // 첫 화면 분기: 초보자 가이드 / 바로 계획
  $$('[data-route]').forEach(b => b.onclick = () => {
    ob.phase = b.dataset.route === 'beginner' ? 'guide' : 'plan';
    ob.guideStep = 0;
    ob.step = 0;
    renderOnboarding();
  });

  // 초보자 가이드 이동
  const gnext = $('[data-gnext]');
  if (gnext) gnext.onclick = () => {
    if (ob.guideStep >= DATA.guide.length - 1) { ob.phase = 'plan'; ob.step = 0; }
    else ob.guideStep++;
    renderOnboarding();
  };
  const gprev = $('[data-gprev]');
  if (gprev) gprev.onclick = () => {
    if (ob.guideStep === 0) ob.phase = 'intro';
    else ob.guideStep--;
    renderOnboarding();
  };
  const gskip = $('[data-gskip]');
  if (gskip) gskip.onclick = () => { ob.phase = 'plan'; ob.step = 0; renderOnboarding(); };

  $$('[data-degree]').forEach(b => b.onclick = () => { ob.degree = b.dataset.degree; renderOnboarding(); });
  $$('[data-goal]').forEach(b => b.onclick = () => { ob.goalYm = b.dataset.goal; renderOnboarding(); });
  const majorSel = $('#ob-major');
  if (majorSel) majorSel.onchange = () => {
    $('#ob-custom-wrap').style.display = majorSel.value === '__custom' ? 'block' : 'none';
  };

  // 수강 중 강의 추가/삭제
  let obcCat = 'major';
  $$('#ob-c-cat button').forEach(b => b.onclick = () => {
    obcCat = b.dataset.cat;
    $$('#ob-c-cat button').forEach(x => x.classList.toggle('active', x === b));
  });
  const addCourse = $('[data-ob-add-course]');
  if (addCourse) addCourse.onclick = () => {
    const name = $('#ob-c-name').value.trim();
    if (!name) { toast('과목명을 입력해 주세요'); return; }
    ob.courses.push({ name, credits: Number($('#ob-c-credits').value), category: obcCat, required: false, status: 'ongoing' });
    renderOnboarding();
    toast('추가했어요! 더 있으면 계속 추가해 주세요');
  };
  $$('[data-ob-del-course]').forEach(b => b.onclick = () => {
    ob.courses.splice(Number(b.dataset.obDelCourse), 1); renderOnboarding();
  });

  // 자격증 추천 토글
  $$('[data-ob-cert]').forEach(b => b.onclick = () => {
    const name = b.dataset.obCert;
    const idx = ob.plans.findIndex(p => p.name === name);
    if (idx >= 0) { ob.plans.splice(idx, 1); renderOnboarding(); return; }
    const limit = DATA.degrees[ob.degree].certLimit;
    if (ob.certsUsed + ob.plans.filter(p => p.kind === 'cert').length >= limit) {
      toast(`자격증 학점인정은 최대 ${limit}개까지예요`); return;
    }
    const cert = DATA.certs.find(c => c.name === name);
    ob.plans.push({ kind: 'cert', name: cert.name, credits: cert.credits, target: 'major', status: 'planning' });
    renderOnboarding();
  });

  // 보충 계획 직접 추가/삭제
  let obpKind = 'cert', obpTarget = 'major';
  $$('#ob-p-kind button').forEach(b => b.onclick = () => {
    obpKind = b.dataset.kind;
    $$('#ob-p-kind button').forEach(x => x.classList.toggle('active', x === b));
  });
  $$('#ob-p-target button').forEach(b => b.onclick = () => {
    obpTarget = b.dataset.target;
    $$('#ob-p-target button').forEach(x => x.classList.toggle('active', x === b));
  });
  const addPlan = $('[data-ob-add-plan]');
  if (addPlan) addPlan.onclick = () => {
    const name = $('#ob-p-name').value.trim();
    const credits = Number($('#ob-p-credits').value);
    if (!name) { toast('이름을 입력해 주세요'); return; }
    if (!credits || credits < 1) { toast('예상 인정 학점을 입력해 주세요'); return; }
    if (obpKind === 'cert') {
      const limit = DATA.degrees[ob.degree].certLimit;
      if (ob.certsUsed + ob.plans.filter(p => p.kind === 'cert').length >= limit) {
        toast(`자격증 학점인정은 최대 ${limit}개까지예요`); return;
      }
      if (obpTarget === 'liberal') { toast('자격증은 교양 학점으로는 인정되지 않아요 (전공 또는 일반선택)'); return; }
      if (obpTarget === 'general' && ob.plans.some(p => p.kind === 'cert' && p.target === 'general')) {
        toast('전공과 무관한 자격증은 1개까지만 일반선택으로 인정돼요'); return;
      }
    }
    ob.plans.push({ kind: obpKind, name, credits, target: obpTarget, status: 'planning' });
    renderOnboarding();
    toast('계획에 추가했어요');
  };
  $$('[data-ob-del-plan]').forEach(b => b.onclick = () => {
    ob.plans.splice(Number(b.dataset.obDelPlan), 1); renderOnboarding();
  });

  const prev = $('[data-prev]');
  if (prev) prev.onclick = () => {
    saveObStep();
    if (ob.step === 0) ob.phase = 'intro'; // 첫 단계에서 이전 → 처음 화면으로
    else ob.step--;
    renderOnboarding();
  };
  const next = $('[data-next]');
  if (next) next.onclick = () => {
    if (!saveObStep()) return;
    ob.step++; renderOnboarding();
  };
  const fin = $('[data-finish]');
  if (fin) fin.onclick = () => {
    saveObStep();
    S.profile = {
      done: true,
      degree: ob.degree,
      major: ob.major || '미정',
      startDate: todayStr(),
      goalYm: ob.goalYm,
      earned: { ...ob.earned },
      pending: { ...ob.pending },
      certsUsed: ob.certsUsed
    };
    S.courses = ob.courses.map(c => ({ id: uid(), color: CAT_COLORS[c.category], ...c }));
    S.plans = ob.plans.map(p => ({ id: uid(), ...p }));
    S.roadmapMode = 'auto';
    S.manualTerms = null;
    save();
    go('roadmap');
    toast('로드맵이 생성되었습니다 🎉');
  };
}

function saveObStep() {
  if (ob.step === 1) {
    const sel = $('#ob-major');
    if (sel) {
      ob.major = sel.value === '__custom' ? ($('#ob-major-custom')?.value.trim() || '') : sel.value;
      if (!ob.major) { toast('전공을 선택하거나 입력해 주세요'); return false; }
    }
  }
  if (ob.step === 2) {
    ob.earned.major = Math.max(0, Number($('#ob-e-major')?.value) || 0);
    ob.earned.liberal = Math.max(0, Number($('#ob-e-liberal')?.value) || 0);
    ob.earned.general = Math.max(0, Number($('#ob-e-general')?.value) || 0);
    ob.pending.major = Math.max(0, Number($('#ob-p-major')?.value) || 0);
    ob.pending.liberal = Math.max(0, Number($('#ob-p-liberal')?.value) || 0);
    ob.pending.general = Math.max(0, Number($('#ob-p-general')?.value) || 0);
    ob.certsUsed = Number($('#ob-certs')?.value) || 0;
  }
  return true;
}

/* ---------- 홈 ---------- */

function viewHome() {
  const n = calcNeeds();
  const req = n.req;
  const gi = goalInfo();
  const rm = buildRoadmap();
  const bd = creditBreakdown();
  const pct = Math.min(100, Math.round(n.totalEarned / req.total * 100));
  const confPct = Math.min(100, Math.round(bd.confTotal / req.total * 100));
  const pendPct = Math.max(0, pct - confPct);

  const upcoming = S.schedules
    .filter(s => !s.done && dday(s.end) >= 0)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 4);

  const bars = [
    { k: 'major', label: '전공', earned: n.earned.major, req: req.major },
    { k: 'liberal', label: '교양', earned: n.earned.liberal, req: req.liberal },
    { k: 'general', label: '일반선택', earned: n.earned.general, req: Math.max(0, req.total - req.major - req.liberal) }
  ].filter(b => b.req > 0);

  return `
    <div class="page-head">
      <div class="page-title">안녕하세요 👋</div>
      <div class="page-sub">${esc(req.name)} · ${esc(S.profile.major)} · 목표 ${gi.label} 수여</div>
    </div>

    ${rm.warnings.length && rm.warnings[0].level !== 'info' ? `
      <div class="banner ${rm.warnings[0].level}" role="button" data-go-roadmap style="cursor:pointer">
        ${ICONS.alert}<div>${esc(rm.warnings[0].msg)}</div>
      </div>` : ''}

    ${cloudConfigured() && !sbUser && location.protocol.startsWith('http') && !S.ui.loginNudgeOff ? `
      <div class="banner info">${ICONS.person}
        <div><b>로그인하면 계획이 클라우드에 자동 저장돼요</b> — 기기를 바꾸거나 앱을 지워도 안전해요. 한 번만 로그인하면 계속 유지됩니다.<br>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn sm" data-nudge-login>로그인 · 회원가입</button>
          <button class="btn sm" data-nudge-later style="border:0;color:var(--text-3)">나중에</button>
        </div></div>
      </div>` : ''}

    ${bd.pendTotal > 0 ? `
      <div class="banner warn">${ICONS.clock}
        <div><b>학점인정 신청 대기 ${bd.pendTotal}학점</b> — 신청해야 실제 학점으로 확정돼요. 다음 신청 기간: <b>${nextRecogLabel()}</b> (연 4회: 1·4·7·10월, 학점당 1,000원)<br>
        <button class="btn sm" data-recog-done style="margin-top:8px">이번 신청을 완료했어요 ✓</button></div>
      </div>` : ''}

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:13px;color:var(--text-2);font-weight:500">전체 진행률</div>
          <div class="hero-num">${pct}<small>%</small></div>
        </div>
        <span class="chip accent">${gi.label} 학위수여 목표</span>
      </div>
      <div class="bar" style="height:8px;margin-top:14px"><span style="width:${confPct}%"></span><span class="pend" style="width:${pendPct}%"></span></div>
      <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--text-2);margin-top:8px">
        <span>인정 완료 <b>${bd.confTotal}</b>${bd.pendTotal ? ` · 인정 예정 <b>${bd.pendTotal}</b>` : ''}학점</span><span>총 ${req.total}학점</span>
      </div>
    </div>

    <div class="grid-2" style="margin-top:10px">
      <div class="card mini-stat"><div class="k">남은 학점</div><div class="v">${n.total}<small> 학점</small></div></div>
      <div class="card mini-stat">
        <div class="k">수업 마감까지 ${helpBtn('studyEnd')}</div>
        <div class="v">${Math.max(0, dday(gi.studyEnd))}<small> 일</small></div>
        <div class="k" style="margin-top:3px">학위수여까지 ${Math.max(0, dday(gi.conferDate))}일</div>
      </div>
    </div>

    <div class="section-title">구분별 진행 상황</div>
    <div class="card">
      ${bars.map((b, i) => {
        const p = Math.min(100, Math.round(b.earned / b.req * 100));
        const pend = bd.pend[b.k] || 0;
        return `${i > 0 ? '<div class="divider"></div>' : ''}
        <div class="stat-row"><span class="label">${b.label}</span>
          <span class="val"><b>${b.earned}</b> / ${b.req}학점${pend ? ` <span style="color:var(--warn)">(예정 ${pend})</span>` : ''}</span></div>
        <div class="bar"><span class="${p >= 100 ? 'done' : ''}" style="width:${p}%"></span></div>`;
      }).join('')}
    </div>

    <div class="section-title">다가오는 일정</div>
    ${upcoming.length ? upcoming.map(s => schedItem(s, { compact: true })).join('') : `
      <div class="card empty">${ICONS.calendar}<div>다가오는 일정이 없습니다.<br>일정 탭에서 시험·과제·토론을 등록해 보세요.</div></div>`}

    <div class="section-title">바로가기</div>
    <div class="grid-2">
      <button class="btn" data-go="courses">${ICONS.plus} 과목 추가</button>
      <button class="btn" data-go="schedule">${ICONS.plus} 일정 추가</button>
    </div>`;
}

function bindHome() {
  bindHelp();
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  const w = $('[data-go-roadmap]');
  if (w) w.onclick = () => go('roadmap');
  const nl = $('[data-nudge-login]');
  if (nl) nl.onclick = () => authModal('login');
  const nlater = $('[data-nudge-later]');
  if (nlater) nlater.onclick = () => { S.ui.loginNudgeOff = true; save(); render(); };
  const rd = $('[data-recog-done]');
  if (rd) rd.onclick = () => {
    if (!confirm('학점인정 신청을 완료하셨나요?\n인정 예정 학점을 모두 인정 완료로 옮깁니다.')) return;
    applyRecognition();
  };
  bindSchedItems();
}

/* ---------- 보충 계획 (자격증 · 독학사) 공용 컴포넌트 ---------- */

function planItem(p) {
  const done = p.status === 'done';
  return `
    <div class="item ${done ? 'done' : ''}">
      <button class="check ${done ? 'on' : ''}" data-toggle-plan="${p.id}" title="${done ? '완료 취소' : '합격/완료 처리'}">${ICONS.check}</button>
      <div class="grow">
        <div class="t">${esc(p.name)}</div>
        <div class="s">${PLAN_KINDS[p.kind] || '기타'} · +${p.credits}학점 · ${CATS[p.target]}${done ? (p.recognized ? ' · <b style="color:var(--ok)">인정 완료</b>' : ' · <b style="color:var(--ok)">학점 반영됨</b> · <span style="color:var(--warn)">인정 신청 대기</span>') : ' · 계획 중'}</div>
      </div>
      <button class="icon-btn" data-edit-plan="${p.id}">${ICONS.edit}</button>
      <button class="icon-btn" data-del-plan="${p.id}">${ICONS.trash}</button>
    </div>`;
}

function bindPlanItems() {
  $$('[data-toggle-plan]').forEach(b => b.onclick = () => {
    const p = S.plans.find(x => x.id === b.dataset.togglePlan);
    p.status = p.status === 'done' ? 'planning' : 'done';
    if (p.status !== 'done') p.recognized = false;
    save(); render();
    if (p.status === 'done') toast(`${p.name} 완료! +${p.credits}학점이 ${CATS[p.target]}에 반영되었어요 🎉`);
    else toast('계획 중으로 되돌렸어요');
  });
  $$('[data-edit-plan]').forEach(b => b.onclick = () => planModal(S.plans.find(x => x.id === b.dataset.editPlan)));
  $$('[data-del-plan]').forEach(b => b.onclick = () => {
    const p = S.plans.find(x => x.id === b.dataset.delPlan);
    if (!confirm(`'${p.name}' 계획을 삭제할까요?${p.status === 'done' ? '\n반영되었던 학점도 함께 제외됩니다.' : ''}`)) return;
    S.plans = S.plans.filter(x => x.id !== b.dataset.delPlan);
    save(); render(); toast('삭제되었습니다');
  });
}

function planModal(plan = null, preset = {}) {
  const p = plan || { kind: 'cert', name: preset.name || '', credits: preset.credits || '', target: preset.target || 'major', status: 'planning' };
  openModal(`
    <h3>${plan ? '보충 계획 수정' : '보충 계획 추가'}</h3>
    <div class="banner info" style="font-size:12.5px">${ICONS.info}<div>자격증·독학사 학점은 <b>연 42학점 제한에 포함되지 않아요.</b> 여기에 넣어두면 로드맵의 부족 학점 계산에 바로 반영됩니다. 언제든 수정할 수 있어요.</div></div>
    <div class="field"><label>종류</label>
      <div class="seg" id="pm-kind">
        ${Object.entries(PLAN_KINDS).map(([k, l]) => `<button data-kind="${k}" class="${p.kind === k ? 'active' : ''}">${l}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>이름</label>
      <input type="text" id="pm-name" value="${esc(p.name)}" list="pm-cert-list" placeholder="예: 텔레마케팅관리사 / 독학사 2단계 경영학">
      <datalist id="pm-cert-list">${DATA.certs.map(c => `<option value="${esc(c.name)}">`).join('')}</datalist>
      <div class="hint" id="pm-cert-hint"></div>
    </div>
    <div class="field"><label>인정 학점</label><input type="number" id="pm-credits" min="1" max="45" value="${p.credits}">
      <div class="hint">국가기술자격: 기술사 45 · 기능장 30 · 기사 20 · 산업기사 16 / 독학사: 과목당 4~5학점. 정확한 학점은 학점은행 홈페이지 ‘자격 검색’에서 확인하세요.</div></div>
    <div class="field"><label>인정 구분</label>
      <div class="seg" id="pm-target">
        ${Object.entries(CATS).map(([k, l]) => `<button data-target="${k}" class="${p.target === k ? 'active' : ''}">${l}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>상태</label>
      <div class="seg" id="pm-status">
        <button data-status="planning" class="${p.status !== 'done' ? 'active' : ''}">계획 중</button>
        <button data-status="done" class="${p.status === 'done' ? 'active' : ''}">합격 · 완료 (학점 반영)</button>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn" data-close>취소</button>
      <button class="btn primary" id="pm-save">저장</button>
    </div>`);

  let kind = p.kind, target = p.target, status = p.status;
  $$('#pm-kind button').forEach(b => b.onclick = () => {
    kind = b.dataset.kind;
    $$('#pm-kind button').forEach(x => x.classList.toggle('active', x === b));
  });
  $$('#pm-target button').forEach(b => b.onclick = () => {
    target = b.dataset.target;
    $$('#pm-target button').forEach(x => x.classList.toggle('active', x === b));
  });
  $$('#pm-status button').forEach(b => b.onclick = () => {
    status = b.dataset.status;
    $$('#pm-status button').forEach(x => x.classList.toggle('active', x === b));
  });

  // 공식 자격 목록과 매칭되면 학점·전공연계 자동 안내
  const nameInput = $('#pm-name');
  const syncCert = () => {
    const cert = DATA.certs.find(c => c.name === nameInput.value.trim());
    if (!cert) { $('#pm-cert-hint').textContent = ''; return; }
    $('#pm-credits').value = cert.credits;
    const isMajorLinked = cert.majors.includes(S.profile.major);
    $('#pm-cert-hint').innerHTML = `제28차 고시 기준 <b>+${cert.credits}학점</b> · ${isMajorLinked ? `‘${esc(S.profile.major)}’ 전공학점으로 인정돼요` : '내 전공과 연계 정보가 없어 일반선택으로 인정될 가능성이 높아요'}`;
    target = isMajorLinked ? 'major' : 'general';
    $$('#pm-target button').forEach(x => x.classList.toggle('active', x.dataset.target === target));
  };
  nameInput.oninput = syncCert;
  if (!plan && p.name) syncCert();

  $('#pm-save').onclick = () => {
    const name = nameInput.value.trim();
    const credits = Number($('#pm-credits').value);
    if (!name) { toast('이름을 입력해 주세요'); return; }
    if (!credits || credits < 1) { toast('인정 학점을 입력해 주세요'); return; }
    if (kind === 'cert') {
      if (target === 'liberal') { toast('자격증은 교양 학점으로 인정되지 않아요 (전공 또는 일반선택)'); return; }
      const others = S.plans.filter(x => x !== plan);
      const req = getReq();
      if (S.profile.certsUsed + others.filter(x => x.kind === 'cert').length >= req.certLimit) {
        toast(`자격증 학점인정은 ${req.short} 최대 ${req.certLimit}개까지예요`); return;
      }
      if (target === 'general' && others.some(x => x.kind === 'cert' && x.target === 'general')) {
        toast('전공과 무관한 자격증은 1개까지만 일반선택으로 인정돼요'); return;
      }
    }
    const data = { kind, name, credits, target, status };
    if (plan) Object.assign(plan, data);
    else {
      const np = { id: uid(), ...data };
      S.plans.push(np);
      if (preset.linkSchedId) {
        const sc = S.schedules.find(x => x.id === preset.linkSchedId);
        if (sc) sc.planId = np.id;
      }
    }
    S.manualTerms = null;
    save(); closeModal(); render();
    toast(plan ? '수정되었습니다 — 로드맵에 반영했어요' : '계획을 추가했어요 — 로드맵에 반영됩니다');
  };
}

/* ---------- 로드맵 ---------- */

function viewRoadmap() {
  const rm = buildRoadmap();
  const gi = rm.gi;
  const p = S.profile;
  const done = rm.needs.total === 0;

  let cum = rm.needs.totalEarned + rm.planSupTotal;
  const certTotal = rm.certs.reduce((s, c) => s + c.used, 0);

  const termsHtml = rm.terms.map((t, i) => {
    const start = addMonths(p.startDate, i * 6);
    const end = addMonths(p.startDate, (i + 1) * 6);
    cum += t.total;
    const parts = [];
    if (t.major) parts.push(`<span class="chip">전공 ${t.major}학점</span>`);
    if (t.liberal) parts.push(`<span class="chip">교양 ${t.liberal}학점</span>`);
    if (t.general) parts.push(`<span class="chip">일반선택 ${t.general}학점</span>`);
    const courses = Math.ceil(t.total / 3);
    return `
      <div class="card term-card">
        <div class="term-head">
          <span class="t">${i + 1}학기</span>
          <span class="d">${fmtYM(start)} – ${fmtYM(end)}</span>
        </div>
        ${S.roadmapMode === 'manual' ? `
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:13.5px;color:var(--text-2)">수업 학점</span>
            <span class="stepper">
              <button data-term-dec="${i}">−</button>
              <b>${t.total}학점</b>
              <button data-term-inc="${i}">+</button>
            </span>
          </div>` : `
          <div style="font-size:14px;margin-bottom:6px"><b>${t.total}학점</b>
            <span style="color:var(--text-2)"> · 과목 약 ${courses}개 (3학점 기준)</span></div>`}
        <div class="term-breakdown">${parts.join('') || '<span class="chip ok">여유 학기</span>'}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:10px">누적 ${Math.min(cum, rm.needs.req.total + 100)}학점 / ${rm.needs.req.total}학점</div>
      </div>`;
  }).join('');

  const nextRecog = nextRecogLabel();

  return `
    <div class="page-head">
      <div class="page-title">로드맵</div>
      <div class="page-sub">${esc(getReq().name)} · ${esc(p.major)} · ${gi.label} 수여 목표 (${gi.half})</div>
    </div>

    <div class="seg" style="margin-bottom:14px">
      <button class="${S.roadmapMode === 'auto' ? 'active' : ''}" data-mode="auto">자동 추천</button>
      <button class="${S.roadmapMode === 'manual' ? 'active' : ''}" data-mode="manual">직접 계획</button>
    </div>

    ${done ? `<div class="banner ok">${ICONS.check}<div>필요한 학점을 모두 채웠습니다! 학점인정 신청과 학위신청(${gi.applyLabel}) 일정을 확인하세요.</div></div>` : ''}
    ${rm.warnings.map(w => `<div class="banner ${w.level}">${w.level === 'info' ? ICONS.info : ICONS.alert}<div>${esc(w.msg)}</div></div>`).join('')}

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${S.plans.length ? '10px' : '0'}">
        <div style="font-size:13.5px;font-weight:600">내 보충 계획 (자격증 · 독학사)</div>
        <button class="btn sm" data-add-plan>${ICONS.plus} 추가</button>
      </div>
      ${S.plans.length ? '' : `<div style="font-size:13px;color:var(--text-3);margin-top:8px">준비 중인 자격증이나 독학사 시험을 넣어두면 로드맵의 부족 학점 계산에 바로 반영돼요.</div>`}
    </div>
    ${S.plans.map(planItem).join('')}

    ${rm.certs.length ? `
      <div class="banner info" style="margin-top:10px">${ICONS.award}
        <div><b>자격증 추가 추천</b> — 위 계획만으로는 부족해서 골라봤어요. 자격증 학점은 연 42학점 제한에 포함되지 않아요.<br>
        ${rm.certs.map(c => `<span role="button" style="text-decoration:underline;cursor:pointer" data-adopt-cert="${esc(c.name)}">${esc(c.name)}</span> (+${c.used}학점, ${c.target === 'major' ? '전공' : '일반선택'})`).join(' · ')}
        <span style="opacity:.75">— 총 +${certTotal}학점 · 이름을 누르면 내 계획에 추가돼요</span></div>
      </div>` : ''}

    ${termsHtml}

    <div class="card" style="margin-top:10px">
      <div style="font-size:13.5px;font-weight:600;margin-bottom:6px">${gi.label} 수여까지 행정 일정 체크리스트</div>
      <div style="font-size:13px;color:var(--text-2);line-height:1.8">
        ① <b>학습자 등록</b> — 연 4회(1·4·7·10월), 수수료 4,000원, 최초 1회${nextRecog ? ` · 다음 신청월: <b>${nextRecog}</b>` : ''}<br>
        ② 이수·취득할 때마다 <b>학점인정 신청</b> — 연 4회(1·4·7·10월), 학점당 1,000원<br>
        ③ <b>마지막 학점인정 신청</b> — 늦어도 <b>${gi.lastRecog}</b> 신청 기간까지<br>
        ④ <b>학위신청</b> — <b>${gi.applyLabel}</b> (온라인만 가능) → <b>${gi.year}년 ${gi.month}월 학위수여</b><br>
        ⑤ 이수 기준: 출석률 80% 이상 · 성적 60점 이상
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn sm" data-sched-recog>${ICONS.plus} 학점인정신청, 일정에 추가</button>
        <button class="btn sm" data-sched-apply>${ICONS.plus} 학위신청, 일정에 추가</button>
      </div>
      <div class="footnote" style="margin-top:10px">예상 잔여 수수료: 학점인정 신청 약 ${(rm.needs.total * DATA.limits.fees.perCredit).toLocaleString()}원(남은 ${rm.needs.total}학점 × 1,000원) + 학습자 등록 4,000원(최초 1회, 이미 등록했다면 제외) + 교육기관 수강료 별도</div>
    </div>

    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn" data-regen>${ICONS.refresh} 다시 생성</button>
      <button class="btn" data-edit-goal>${ICONS.edit} 목표 수정</button>
    </div>
    <div class="footnote">연 최대 42학점 · 학기 최대 24학점(수업 기준) 규정을 반영한 추천입니다. 한 교육기관에서는 학사 105학점 · 전문학사 60학점까지만 인정되니 기관 배분도 확인하세요. 자격증 인정 학점·전공 연계는 「제28차 자격 학점인정 기준」(2025.12.15 시행) 기준입니다.</div>`;
}

/* 다음 학점인정신청 가능 월 */
function nextRecogRange() {
  const t = parseDate(todayStr());
  for (let add = 0; add < 12; add++) {
    const d = new Date(t.getFullYear(), t.getMonth() + add, 1);
    const y = d.getFullYear(), m = d.getMonth() + 1;
    if (DATA.adminCalendar.recogMonths.includes(m)) {
      const p = n => String(n).padStart(2, '0');
      return {
        label: `${y}년 ${m}월`,
        start: `${y}-${p(m)}-01`,
        end: `${y}-${p(m)}-${new Date(y, m, 0).getDate()}`
      };
    }
  }
  return null;
}

function nextRecogLabel() {
  const r = nextRecogRange();
  return r ? r.label : '';
}

/* 행정 일정을 일정 탭에 추가 (중복 방지) */
function addAdminSchedule(title, start, end, memo) {
  if (S.schedules.some(s => s.title === title && s.start === start)) {
    toast('이미 일정에 추가되어 있어요'); return;
  }
  S.schedules.push({
    id: uid(), title, type: 'etc', subtype: '', start, end,
    time: '', memo, alarm: true, done: false, color: '#0c8599', planId: null
  });
  save(); render();
  toast(`'${title}' 일정을 추가했어요 — 일정 탭에서 확인하세요`);
}

function bindRoadmap() {
  $$('[data-mode]').forEach(b => b.onclick = () => {
    S.roadmapMode = b.dataset.mode;
    if (S.roadmapMode === 'manual' && !Array.isArray(S.manualTerms)) {
      S.manualTerms = buildRoadmapAutoTotals();
    }
    save(); render();
  });
  const regen = $('[data-regen]');
  if (regen) regen.onclick = () => { S.manualTerms = null; if (S.roadmapMode === 'manual') S.roadmapMode = 'auto'; save(); render(); toast('로드맵을 다시 생성했습니다'); };
  const eg = $('[data-edit-goal]');
  if (eg) eg.onclick = () => go('more', 'profile');
  $$('[data-term-inc]').forEach(b => b.onclick = () => bumpTerm(Number(b.dataset.termInc), 3));
  $$('[data-term-dec]').forEach(b => b.onclick = () => bumpTerm(Number(b.dataset.termDec), -3));
  const sr = $('[data-sched-recog]');
  if (sr) sr.onclick = () => {
    const r = nextRecogRange();
    if (r) addAdminSchedule(`학점인정 신청 (${r.label})`, r.start, r.end, '학점은행 홈페이지(www.cb.or.kr)에서 온라인 신청 · 학점당 1,000원');
  };
  const sa = $('[data-sched-apply]');
  if (sa) sa.onclick = () => {
    const gi = goalInfo();
    addAdminSchedule(`학위신청 (${gi.label} 수여)`, gi.applyStart, gi.applyEnd, '학점은행 홈페이지에서 온라인 신청만 가능 (방문·우편·팩스 불가)');
  };
  const ap = $('[data-add-plan]');
  if (ap) ap.onclick = () => planModal();
  $$('[data-adopt-cert]').forEach(el => el.onclick = () => {
    const cert = DATA.certs.find(c => c.name === el.dataset.adoptCert);
    if (!cert) return;
    planModal(null, { name: cert.name, credits: cert.credits, target: cert.majors.includes(S.profile.major) ? 'major' : 'general' });
  });
  bindPlanItems();
}

function buildRoadmapAutoTotals() {
  const saved = S.roadmapMode;
  S.roadmapMode = 'auto';
  const rm = buildRoadmap();
  S.roadmapMode = saved;
  return rm.terms.map(t => t.total);
}

function bumpTerm(i, delta) {
  const gi = goalInfo();
  const termCount = termCountBetween(S.profile.startDate, gi.studyEnd);
  if (!Array.isArray(S.manualTerms) || S.manualTerms.length !== termCount) {
    S.manualTerms = buildRoadmapAutoTotals();
  }
  S.manualTerms[i] = Math.max(0, Math.min(24, (S.manualTerms[i] || 0) + delta));
  save(); render();
}

/* ---------- 과목 ---------- */

/* 중복 과목 정규화 — 「중복 과목 및 대체 과목 처리 기준」 고시(제2013-16호) 반영
   · 대소문자/띄어쓰기 무시 · 관형격 조사 '의' 무시 · 문장부호·'및' 무시
   · 첫 서열 표기(전공실기 = 전공실기1 = 전공실기Ⅰ) 동일 취급 */
function normName(s) {
  return String(s)
    .toLowerCase()
    .replace(/의\s+/g, ' ')                       // '인터넷의 이해' → '인터넷 이해'
    .replace(/\s*(및|와|과)\s+/g, ' ')            // '가족상담 및 치료' → '가족상담 치료'
    .replace(/[\s·ㆍ.,/&()\-–—:'"]/g, '')          // 공백·문장부호 제거
    .replace(/(1|ⅰ|i)$/i, '');                    // 첫 서열 숫자 제거
}

/* 대체 과목 정규화 — 유사 접미어·접두어를 대표어로 치환 */
function altNormName(s) {
  let n = normName(s);
  for (const group of DATA.dupNotice.altSuffixGroups) {
    for (const w of group) {
      if (n.endsWith(w)) { n = n.slice(0, -w.length) + group[0]; break; }
    }
  }
  for (const group of DATA.dupNotice.altPrefixGroups) {
    for (const w of group) {
      const lw = w.toLowerCase();
      if (n.startsWith(lw)) { n = group[0].toLowerCase() + n.slice(lw.length); break; }
    }
  }
  return n;
}

function findDuplicates() {
  const dups = [];
  const alts = [];
  const seen = {};
  const seenAlt = {};
  for (const c of S.courses) {
    const k = normName(c.name);
    const ka = altNormName(c.name);
    if (seen[k]) dups.push(c.name);
    else if (seenAlt[ka] && seenAlt[ka] !== c.name) alts.push(`${seenAlt[ka]} ↔ ${c.name}`);
    seen[k] = true;
    if (!seenAlt[ka]) seenAlt[ka] = c.name;
  }
  return { dups, alts };
}

const STATUS = { planned: '계획', ongoing: '수강 중', done: '이수 완료' };

function viewCourses() {
  const { dups, alts } = findDuplicates();
  const filter = S.ui.filter || 'all';
  const list = S.courses
    .filter(c => filter === 'all' || c.status === filter)
    .sort((a, b) => (a.status === 'done') - (b.status === 'done'));

  const reqCourses = DATA.majorRequired[S.profile.major];

  return `
    <div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="page-title">과목</div>
        <div class="page-sub">수강 과목을 등록하면 학점이 자동 분류·집계됩니다</div>
      </div>
      <button class="btn primary sm" data-add-course>${ICONS.plus} 추가</button>
    </div>

    ${dups.length ? `<div class="banner warn">${ICONS.alert}<div><b>중복 과목 경고</b> — ${dups.map(esc).join(', ')} 과목이 중복 등록되어 있습니다. 중복 과목은 1개만 학점인정됩니다. (고시 제2013-16호)</div></div>` : ''}
    ${alts.length ? `<div class="banner warn">${ICONS.alert}<div><b>대체 과목 의심</b> — ${alts.map(esc).join(' / ')} — 과목명 의미가 유사해 같은 과목(대체 과목)으로 처리될 수 있어요. 전공필수라면 1개만 전공필수로 인정됩니다.</div></div>` : ''}

    <div class="filter-row">
      ${[['all', '전체'], ['planned', '계획'], ['ongoing', '수강 중'], ['done', '이수 완료']].map(([k, l]) =>
        `<button class="${filter === k ? 'active' : ''}" data-filter="${k}">${l}</button>`).join('')}
    </div>

    ${list.length ? list.map(c => `
      <div class="item ${c.status === 'done' ? 'done' : ''}">
        <button class="check ${c.status === 'done' ? 'on' : ''}" data-toggle-course="${c.id}" title="이수 완료 표시">${ICONS.check}</button>
        <span class="color-dot" style="background:${c.color || CAT_COLORS[c.category]}"></span>
        <div class="grow">
          <div class="t">${esc(c.name)}</div>
          <div class="s">${CATS[c.category]}${c.required ? ' · 전공필수' : ''} · ${c.credits}학점 · ${STATUS[c.status]}</div>
        </div>
        <button class="icon-btn" data-edit-course="${c.id}">${ICONS.edit}</button>
        <button class="icon-btn" data-del-course="${c.id}">${ICONS.trash}</button>
      </div>`).join('') : `
      <div class="card empty">${ICONS.book}<div>등록된 과목이 없습니다.<br>수강할 과목을 추가해 보세요.</div></div>`}

    ${reqCourses ? `
      <div class="section-title">${esc(S.profile.major)} 전공필수 참고 (표준교육과정 예시)</div>
      <div class="card" style="font-size:13.5px;color:var(--text-2);line-height:1.8">
        ${reqCourses.map(esc).join(' · ')}
        <div class="footnote" style="margin-top:8px">교육기관·연도에 따라 다를 수 있으니 표준교육과정을 확인하세요.</div>
      </div>` : ''}`;
}

function bindCourses() {
  $$('[data-filter]').forEach(b => b.onclick = () => { S.ui.filter = b.dataset.filter; save(); render(); });
  const add = $('[data-add-course]');
  if (add) add.onclick = () => courseModal();
  $$('[data-edit-course]').forEach(b => b.onclick = () => courseModal(S.courses.find(c => c.id === b.dataset.editCourse)));
  $$('[data-del-course]').forEach(b => b.onclick = () => {
    if (!confirm('이 과목을 삭제할까요?')) return;
    S.courses = S.courses.filter(c => c.id !== b.dataset.delCourse);
    save(); render(); toast('삭제되었습니다');
  });
  $$('[data-toggle-course]').forEach(b => b.onclick = () => {
    const c = S.courses.find(x => x.id === b.dataset.toggleCourse);
    c.status = c.status === 'done' ? 'ongoing' : 'done';
    if (c.status !== 'done') c.recognized = false;
    save(); render();
  });
}

function courseModal(course = null) {
  const c = course || { name: '', credits: 3, category: 'major', required: false, status: 'planned', color: CAT_COLORS.major };
  let color = c.color || CAT_COLORS[c.category];
  openModal(`
    <h3>${course ? '과목 수정' : '과목 추가'}</h3>
    <div class="field"><label>과목명</label><input type="text" id="cm-name" value="${esc(c.name)}" placeholder="예: 마케팅원론"></div>
    <div class="field"><label>구분</label>
      <div class="seg" id="cm-cat">
        ${Object.entries(CATS).map(([k, l]) => `<button data-cat="${k}" class="${c.category === k ? 'active' : ''}">${l}</button>`).join('')}
      </div>
    </div>
    <div class="field" id="cm-req-wrap" style="display:${c.category === 'major' ? 'block' : 'none'}">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="cm-req" ${c.required ? 'checked' : ''} style="width:16px;height:16px"> 전공필수 과목
      </label>
    </div>
    <div class="field"><label>학점</label>
      <select id="cm-credits">${[1, 2, 3, 4].map(n => `<option value="${n}" ${c.credits === n ? 'selected' : ''}>${n}학점</option>`).join('')}</select>
    </div>
    <div class="field"><label>상태</label>
      <div class="seg" id="cm-status">
        ${Object.entries(STATUS).map(([k, l]) => `<button data-status="${k}" class="${c.status === k ? 'active' : ''}">${l}</button>`).join('')}
      </div>
    </div>
    <div class="field"><label>색상 <span style="font-weight:400;color:var(--text-3)">— 달력·목록에 표시돼요</span></label>
      ${swatchesHtml('cm-color', color)}
    </div>
    <div id="cm-dup"></div>
    <div class="modal-actions">
      <button class="btn" data-close>취소</button>
      <button class="btn primary" id="cm-save">저장</button>
    </div>`);

  let cat = c.category, status = c.status;
  bindSwatches('cm-color', v => { color = v; });
  $$('#cm-cat button').forEach(b => b.onclick = () => {
    cat = b.dataset.cat;
    $$('#cm-cat button').forEach(x => x.classList.toggle('active', x === b));
    $('#cm-req-wrap').style.display = cat === 'major' ? 'block' : 'none';
  });
  $$('#cm-status button').forEach(b => b.onclick = () => {
    status = b.dataset.status;
    $$('#cm-status button').forEach(x => x.classList.toggle('active', x === b));
  });

  const checkDup = () => {
    const name = $('#cm-name').value.trim();
    if (!name) { $('#cm-dup').innerHTML = ''; return; }
    const others = S.courses.filter(x => x.id !== c.id);
    const dup = others.some(x => normName(x.name) === normName(name));
    const alt = !dup && others.find(x => altNormName(x.name) === altNormName(name));
    $('#cm-dup').innerHTML = dup
      ? `<div class="banner warn" style="margin-top:4px">${ICONS.alert}<div>같은 과목(중복 과목)이 이미 있습니다. 중복 과목은 1개만 학점인정됩니다.</div></div>`
      : alt
        ? `<div class="banner warn" style="margin-top:4px">${ICONS.alert}<div>‘${esc(alt.name)}’ 과목과 이름 의미가 유사해 <b>대체 과목</b>으로 처리될 수 있어요. (예: 이해≒개론≒입문≒총론≒원론)</div></div>` : '';
  };
  $('#cm-name').oninput = checkDup;
  checkDup();

  $('#cm-save').onclick = () => {
    const name = $('#cm-name').value.trim();
    if (!name) { toast('과목명을 입력해 주세요'); return; }
    const data = {
      name,
      credits: Number($('#cm-credits').value),
      category: cat,
      required: cat === 'major' && $('#cm-req').checked,
      status,
      color
    };
    if (course) Object.assign(course, data);
    else S.courses.push({ id: uid(), ...data });
    save(); closeModal(); render();
    toast(course ? '수정되었습니다' : '과목이 추가되었습니다');
  };
}

/* ---------- 일정 ---------- */

function schedItem(s, opts = {}) {
  const type = SCHED_TYPES[s.type] || SCHED_TYPES.etc;
  const sub = s.subtype ? ` · ${esc(s.subtype)}` : '';
  const doneLabel = s.type === 'discussion' ? '참석 완료' : s.type === 'assignment' ? '제출 완료' : '완료';
  const plan = s.planId ? S.plans.find(p => p.id === s.planId) : null;
  const passBtn = (s.type === 'cert' && plan && plan.status !== 'done' && !opts.compact)
    ? `<button class="btn sm" data-pass-sched="${s.id}" style="color:var(--ok);border-color:var(--ok)">합격 🎉</button>` : '';
  const passChip = (s.type === 'cert' && plan && plan.status === 'done')
    ? `<span class="chip ok">+${plan.credits}학점 반영됨</span>` : '';
  return `
    <div class="item ${s.done ? 'done' : ''}">
      <button class="check ${s.done ? 'on' : ''}" data-toggle-sched="${s.id}" title="${doneLabel}">${ICONS.check}</button>
      <span class="color-dot" style="background:${s.color || TYPE_COLORS[s.type]}"></span>
      <div class="grow">
        <div class="t">${esc(s.title)}</div>
        <div class="s">${type.label}${sub} · ${fmtRange(s)}${s.time ? ' ' + s.time : ''}${plan ? ` · ${esc(plan.name)}` : ''}</div>
      </div>
      ${passChip || schedDday(s)}
      ${passBtn}
      ${opts.compact ? '' : `
        <button class="icon-btn" data-alarm-sched="${s.id}" title="알림 ${s.alarm ? '켜짐' : '꺼짐'}" style="${s.alarm ? 'color:var(--accent)' : ''}">${s.alarm ? ICONS.bell : ICONS.bellOff}</button>
        <button class="icon-btn" data-edit-sched="${s.id}">${ICONS.edit}</button>
        <button class="icon-btn" data-del-sched="${s.id}">${ICONS.trash}</button>`}
    </div>`;
}

function viewSchedule() {
  const view = S.ui.schedView || 'list';
  return `
    <div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="page-title">일정</div>
        <div class="page-sub">시험 · 과제 · 토론은 기간으로 등록할 수 있어요</div>
      </div>
      <button class="btn primary sm" data-add-sched>${ICONS.plus} 추가</button>
    </div>

    <div class="seg" style="margin-bottom:14px;max-width:220px">
      <button class="${view === 'list' ? 'active' : ''}" data-sview="list">목록</button>
      <button class="${view === 'cal' ? 'active' : ''}" data-sview="cal">달력</button>
    </div>

    ${view === 'cal' ? viewCalendar() : viewSchedList()}`;
}

function viewSchedList() {
  const filter = S.ui.filter && SCHED_TYPES[S.ui.filter] ? S.ui.filter : 'all';
  const list = S.schedules
    .filter(s => filter === 'all' || s.type === filter)
    .sort((a, b) => a.start.localeCompare(b.start));

  const upcoming = list.filter(s => dday(s.end) >= 0);
  const past = list.filter(s => dday(s.end) < 0).reverse();

  return `
    <div class="filter-row">
      <button class="${filter === 'all' ? 'active' : ''}" data-sfilter="all">전체</button>
      ${Object.entries(SCHED_TYPES).map(([k, t]) =>
        `<button class="${filter === k ? 'active' : ''}" data-sfilter="${k}">${t.label}</button>`).join('')}
    </div>

    ${upcoming.length ? upcoming.map(s => schedItem(s)).join('') : `
      <div class="card empty">${ICONS.calendar}<div>다가오는 일정이 없습니다.</div></div>`}

    ${past.length ? `
      <div class="section-title">지난 일정</div>
      ${past.slice(0, 10).map(s => schedItem(s)).join('')}` : ''}`;
}

/* --- 월간 달력 --- */

function viewCalendar() {
  const ym = S.ui.calYm || todayStr().slice(0, 7);
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const dim = new Date(y, m, 0).getDate();
  const today = todayStr();
  const sel = S.ui.calSel;

  // 주 단위 셀 (앞뒤 빈칸은 null)
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const weeksHtml = weeks.map(week => {
    const firstIdx = week.findIndex(d => d !== null);
    const lastIdx = 6 - [...week].reverse().findIndex(d => d !== null);
    const weekStart = week[firstIdx], weekEnd = week[lastIdx];

    // 이 주에 걸치는 일정 → 레인 배정
    const evs = S.schedules
      .filter(s => s.start <= weekEnd && s.end >= weekStart)
      .sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
    const laneEnds = [];
    const bars = [];
    const overflow = {}; // dateStr → count
    for (const ev of evs) {
      let lane = laneEnds.findIndex(end => end < ev.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = ev.end;
      const sIdx = Math.max(firstIdx, week.findIndex(d => d && d >= ev.start));
      let eIdx = lastIdx;
      for (let i = lastIdx; i >= firstIdx; i--) { if (week[i] && week[i] <= ev.end) { eIdx = i; break; } }
      if (lane >= 3) {
        for (let i = sIdx; i <= eIdx; i++) { if (week[i]) overflow[week[i]] = (overflow[week[i]] || 0) + 1; }
        continue;
      }
      bars.push({
        ev, lane, sIdx, eIdx,
        clipL: ev.start < weekStart || (week[sIdx] && ev.start < week[sIdx]),
        clipR: ev.end > weekEnd
      });
    }

    return `
      <div class="cal-week">
        ${week.map((d, i) => d ? `
          <div class="cal-day ${i === 0 ? 'sun' : ''} ${d === today ? 'today' : ''} ${d === sel ? 'sel' : ''}" data-cal-day="${d}">
            <span class="n">${Number(d.slice(8))}</span>
            ${overflow[d] ? `<span class="more">+${overflow[d]}</span>` : ''}
          </div>` : `<div class="cal-day blank"></div>`).join('')}
        ${bars.map(b => {
          const l = b.sIdx / 7 * 100, w = (b.eIdx - b.sIdx + 1) / 7 * 100;
          return `<div class="cal-bar ${b.ev.done ? 'done' : ''} ${b.clipL ? 'no-start' : ''} ${b.clipR ? 'no-end' : ''}"
            style="left:calc(${l}% + 2px);width:calc(${w}% - 4px);top:${25 + b.lane * 18}px;background:${b.ev.color || TYPE_COLORS[b.ev.type]}"
            data-cal-ev="${b.ev.id}" title="${esc(b.ev.title)} (${fmtRange(b.ev)})">${esc(b.ev.title)}</div>`;
        }).join('')}
      </div>`;
  }).join('');

  // 선택한 날짜의 일정
  const selList = sel ? S.schedules
    .filter(s => s.start <= sel && s.end >= sel)
    .sort((a, b) => a.start.localeCompare(b.start)) : [];

  return `
    <div class="card cal-card">
      <div class="cal-head">
        <div class="cal-title">${y}년 ${m}월</div>
        <div class="cal-nav">
          <button class="icon-btn" data-cal-prev>${ICONS.left}</button>
          <button class="btn sm" data-cal-today>오늘</button>
          <button class="icon-btn" data-cal-next>${ICONS.right}</button>
        </div>
      </div>
      <div class="cal-wd">${WEEKDAYS.map(w => `<span>${w}</span>`).join('')}</div>
      ${weeksHtml}
    </div>

    ${sel ? `
      <div class="section-title">${fmtDate(sel)} 일정</div>
      ${selList.length ? selList.map(s => schedItem(s)).join('')
        : `<div class="card empty" style="padding:24px">${ICONS.calendar}<div>이 날짜에는 일정이 없어요.</div></div>`}
      <button class="btn full" data-add-sched-on="${sel}" style="margin-top:8px">${ICONS.plus} ${fmtDate(sel, { day: false })}에 일정 추가</button>` : `
      <div class="footnote" style="margin-top:10px">날짜를 누르면 그 날의 일정을 볼 수 있어요. 막대의 색은 일정마다 직접 정할 수 있어요.</div>`}`;
}

function bindSchedItems() {
  $$('[data-toggle-sched]').forEach(b => b.onclick = () => {
    const s = S.schedules.find(x => x.id === b.dataset.toggleSched);
    s.done = !s.done;
    save(); render();
  });
  $$('[data-pass-sched]').forEach(b => b.onclick = () => {
    const s = S.schedules.find(x => x.id === b.dataset.passSched);
    const plan = S.plans.find(p => p.id === s.planId);
    if (!plan) return;
    plan.status = 'done';
    s.done = true;
    S.manualTerms = null;
    save(); render();
    toast(`${plan.name} 합격 축하해요! 🎉 +${plan.credits}학점이 ${CATS[plan.target]}에 반영되었어요`);
  });
  $$('[data-alarm-sched]').forEach(b => b.onclick = () => {
    const s = S.schedules.find(x => x.id === b.dataset.alarmSched);
    s.alarm = !s.alarm;
    save(); render();
    if (s.alarm) ensurePermission();
  });
  $$('[data-edit-sched]').forEach(b => b.onclick = () => schedModal(S.schedules.find(x => x.id === b.dataset.editSched)));
  $$('[data-del-sched]').forEach(b => b.onclick = () => {
    if (!confirm('이 일정을 삭제할까요?')) return;
    S.schedules = S.schedules.filter(x => x.id !== b.dataset.delSched);
    save(); render(); toast('삭제되었습니다');
  });
}

function bindSchedule() {
  $$('[data-sview]').forEach(b => b.onclick = () => { S.ui.schedView = b.dataset.sview; save(); render(); });
  $$('[data-sfilter]').forEach(b => b.onclick = () => { S.ui.filter = b.dataset.sfilter; save(); render(); });
  const add = $('[data-add-sched]');
  if (add) add.onclick = () => schedModal();
  const addOn = $('[data-add-sched-on]');
  if (addOn) addOn.onclick = () => schedModal(null, { start: addOn.dataset.addSchedOn });

  // 달력 내비게이션
  const shiftMonth = delta => {
    const ym = S.ui.calYm || todayStr().slice(0, 7);
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    S.ui.calYm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    save(); render();
  };
  const cp = $('[data-cal-prev]'); if (cp) cp.onclick = () => shiftMonth(-1);
  const cn = $('[data-cal-next]'); if (cn) cn.onclick = () => shiftMonth(1);
  const ct = $('[data-cal-today]'); if (ct) ct.onclick = () => {
    S.ui.calYm = todayStr().slice(0, 7); S.ui.calSel = todayStr(); save(); render();
  };
  $$('[data-cal-day]').forEach(el => el.onclick = () => {
    S.ui.calSel = S.ui.calSel === el.dataset.calDay ? null : el.dataset.calDay;
    save(); render();
  });
  $$('[data-cal-ev]').forEach(el => el.onclick = e => {
    e.stopPropagation();
    const s = S.schedules.find(x => x.id === el.dataset.calEv);
    if (s) schedModal(s);
  });

  bindSchedItems();
}

function schedModal(sched = null, preset = {}) {
  const s = sched || {
    title: '', type: 'exam', subtype: '중간고사',
    start: preset.start || todayStr(), end: preset.start || todayStr(),
    time: '', alarm: true, done: false, memo: '', planId: null,
    color: TYPE_COLORS.exam
  };
  let color = s.color || TYPE_COLORS[s.type];
  openModal(`
    <h3>${sched ? '일정 수정' : '일정 추가'}</h3>
    <div class="field"><label>종류</label>
      <div class="seg" id="sm-type">
        ${Object.entries(SCHED_TYPES).map(([k, t]) => `<button data-type="${k}" class="${s.type === k ? 'active' : ''}">${t.label}</button>`).join('')}
      </div>
    </div>
    <div class="field" id="sm-sub-wrap"></div>
    <div class="field"><label>제목</label><input type="text" id="sm-title" value="${esc(s.title)}" placeholder="예: 경영학원론 중간고사"></div>
    <div class="grid-2" style="gap:10px">
      <div class="field"><label>시작일</label><input type="date" id="sm-start" value="${s.start}"></div>
      <div class="field"><label>종료일</label><input type="date" id="sm-end" value="${s.end}"></div>
    </div>
    <div class="hint" style="margin:-8px 0 14px">시험·과제·토론 기간처럼 여러 날에 걸친 일정은 종료일을 늘려 주세요. 하루짜리면 그대로 두면 돼요.</div>
    <div class="field" id="sm-plan-wrap"></div>
    <div class="field"><label>시간 (선택)</label><input type="time" id="sm-time" value="${s.time || ''}"></div>
    <div class="field"><label>메모 (선택)</label><input type="text" id="sm-memo" value="${esc(s.memo || '')}" placeholder="예: 3주차 범위까지"></div>
    <div class="field"><label>색상 <span style="font-weight:400;color:var(--text-3)">— 달력에 이 색으로 표시돼요</span></label>
      ${swatchesHtml('sm-color', color)}
    </div>
    <div class="field">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="sm-alarm" ${s.alarm ? 'checked' : ''} style="width:16px;height:16px"> 알림 받기 (시작 전날·당일, 마감일)
      </label>
    </div>
    <div class="modal-actions">
      <button class="btn" data-close>취소</button>
      <button class="btn primary" id="sm-save">저장</button>
    </div>`);

  let type = s.type, subtype = s.subtype || '';
  let userPickedColor = !!sched;
  bindSwatches('sm-color', v => { color = v; userPickedColor = true; });

  const renderSub = () => {
    const subs = SCHED_TYPES[type].subs;
    if (!subs.length) { $('#sm-sub-wrap').innerHTML = ''; subtype = ''; return; }
    if (!subs.includes(subtype)) subtype = subs[0];
    $('#sm-sub-wrap').innerHTML = `<label>세부 구분</label>
      <div class="seg" id="sm-sub">${subs.map(x => `<button data-sub="${x}" class="${subtype === x ? 'active' : ''}">${x}</button>`).join('')}</div>`;
    $$('#sm-sub button').forEach(b => b.onclick = () => {
      subtype = b.dataset.sub;
      $$('#sm-sub button').forEach(x => x.classList.toggle('active', x === b));
    });
  };

  // 자격증 일정 ↔ 보충 계획 연결 (합격 시 학점 자동 반영)
  const renderPlanLink = () => {
    if (type !== 'cert') { $('#sm-plan-wrap').innerHTML = ''; return; }
    const certPlans = S.plans.filter(p => p.kind === 'cert');
    $('#sm-plan-wrap').innerHTML = `
      <label>연결할 자격증 계획 <span style="font-weight:400;color:var(--text-3)">— 합격 버튼 한 번으로 학점 반영</span></label>
      <select id="sm-plan">
        <option value="">연결 안 함</option>
        ${certPlans.map(p => `<option value="${p.id}" ${s.planId === p.id ? 'selected' : ''}>${esc(p.name)} (+${p.credits}학점${p.status === 'done' ? ' · 반영됨' : ''})</option>`).join('')}
        <option value="__new">+ 새 보충 계획으로 등록…</option>
      </select>
      <div class="hint">준비 중인 자격증을 계획에 연결해 두면, 합격 발표일에 ‘합격’ 버튼만 눌러도 학점이 로드맵·진행률에 자동 반영돼요.</div>`;
  };

  $$('#sm-type button').forEach(b => b.onclick = () => {
    type = b.dataset.type;
    $$('#sm-type button').forEach(x => x.classList.toggle('active', x === b));
    if (!userPickedColor) {
      color = TYPE_COLORS[type];
      $$('#sm-color .sw').forEach(x => x.classList.toggle('on', x.dataset.c === color));
    }
    renderSub();
    renderPlanLink();
  });
  renderSub();
  renderPlanLink();

  // 종료일이 시작일보다 앞서지 않게 자동 보정
  const startInp = $('#sm-start'), endInp = $('#sm-end');
  startInp.onchange = () => { if (endInp.value < startInp.value) endInp.value = startInp.value; };
  endInp.onchange = () => { if (endInp.value < startInp.value) { endInp.value = startInp.value; toast('종료일은 시작일 이후여야 해요'); } };

  $('#sm-save').onclick = () => {
    const title = $('#sm-title').value.trim();
    const start = startInp.value;
    let end = endInp.value || start;
    if (!title) { toast('제목을 입력해 주세요'); return; }
    if (!start) { toast('시작일을 선택해 주세요'); return; }
    if (end < start) end = start;

    let planId = null, openNewPlan = false;
    const planSel = $('#sm-plan');
    if (type === 'cert' && planSel) {
      if (planSel.value === '__new') openNewPlan = true;
      else planId = planSel.value || null;
      // 제목이 기존 계획과 일치하면 자동 연결
      if (!planId && !openNewPlan) {
        const match = S.plans.find(p => p.kind === 'cert' && title.includes(p.name));
        if (match) planId = match.id;
      }
    }

    const data = {
      title, type, subtype, start, end,
      time: $('#sm-time').value,
      memo: $('#sm-memo').value.trim(),
      alarm: $('#sm-alarm').checked,
      color, planId
    };
    let target = sched;
    if (sched) Object.assign(sched, data);
    else { target = { id: uid(), done: false, ...data }; S.schedules.push(target); }
    save(); closeModal(); render();
    if (data.alarm) ensurePermission();
    if (openNewPlan) {
      // 저장한 일정과 연결되는 새 보충 계획 만들기 (공식 자격이면 학점 자동 입력)
      const cert = DATA.certs.find(c => title.includes(c.name));
      planModal(null, {
        name: cert ? cert.name : title.replace(/(원서 접수|시험일|시험 준비|합격 발표)/g, '').trim(),
        credits: cert ? cert.credits : '',
        target: cert && cert.majors.includes(S.profile.major) ? 'major' : 'general',
        linkSchedId: target.id
      });
      return;
    }
    toast(sched ? '수정되었습니다' : '일정이 추가되었습니다');
  };
}

/* ---------- 더보기 ---------- */

function renderMore() {
  const v = $('#view');
  switch (S.ui.sub) {
    case 'certs': v.innerHTML = viewCerts(); bindCerts(); break;
    case 'faq': v.innerHTML = viewFaq(); bindBack(); break;
    case 'guide': v.innerHTML = viewGuideMore(); bindBack(); break;
    case 'notif': v.innerHTML = viewNotif(); bindNotif(); break;
    case 'profile': v.innerHTML = viewProfile(); bindProfile(); break;
    case 'account': v.innerHTML = viewAccount(); bindAccount(); break;
    case 'data': v.innerHTML = viewData(); bindData(); break;
    default: v.innerHTML = viewMoreHome(); bindMoreHome();
  }
}

function viewMoreHome() {
  const acctSub = !cloudConfigured() ? '서버 연결 설정하고 기기 간 저장하기'
    : (sbUser ? `${emailToId(sbUser.email)}님 · 자동 저장 중` : '로그인하고 어디서나 이어서 하기');
  return `
    <div class="page-head">
      <div class="page-title">더보기</div>
    </div>
    <button class="link-row" data-sub="account">${ICONS.person}<span class="grow">로그인 · 클라우드 저장<span class="sub">${esc(acctSub)}</span></span></button>
    <button class="link-row" data-sub="profile">${ICONS.edit}<span class="grow">목표 · 내 정보<span class="sub">학위 과정, 전공, 수여 시점, 보유 학점 수정</span></span></button>
    <button class="link-row" data-sub="certs">${ICONS.award}<span class="grow">보충 계획 · 자격증 추천<span class="sub">자격증·독학사로 기간 단축하기</span></span></button>
    <button class="link-row" data-sub="notif">${ICONS.bell}<span class="grow">알림 설정<span class="sub">강의 듣기 알림, 일정 알림</span></span></button>
    <button class="link-row" data-sub="guide">${ICONS.book}<span class="grow">학점은행제 가이드<span class="sub">처음부터 차근차근 — 6개 스텝 다시 보기</span></span></button>
    <button class="link-row" data-sub="faq">${ICONS.help}<span class="grow">자주 묻는 질문<span class="sub">학점은행제, 이렇게 진행됩니다</span></span></button>
    <button class="link-row" data-sub="data">${ICONS.db}<span class="grow">데이터 관리<span class="sub">백업 · 복원 · 초기화</span></span></button>
    <div class="footnote">본 앱의 학점 기준은 국가평생교육진흥원 공개 자료와 「제28차 자격 학점인정 기준」 고시(2025.12.15 시행), 「중복 과목 및 대체 과목 처리 기준」 고시를 참고했습니다. 학점인정 여부의 최종 확인은 학점은행 홈페이지(www.cb.or.kr) 또는 ☎ 1600-0400에서 하세요. 모든 데이터는 이 기기에만 저장됩니다.</div>`;
}

function bindMoreHome() {
  $$('[data-sub]').forEach(b => b.onclick = () => go('more', b.dataset.sub));
}

function backBtn(title) {
  return `<div class="page-head" style="display:flex;align-items:center;gap:10px">
    <button class="icon-btn" data-back>${ICONS.left}</button>
    <div class="page-title" style="font-size:20px">${title}</div>
  </div>`;
}

function bindBack() {
  const b = $('[data-back]');
  if (b) b.onclick = () => go('more');
}

/* --- 보충 계획 · 자격증 추천 --- */

function viewCerts() {
  const slot = certSlotInfo();
  const related = DATA.certs.filter(c => c.majors.includes(S.profile.major));
  const others = DATA.certs.filter(c => !c.majors.includes(S.profile.major));

  const certRow = (c, isMajor) => {
    const added = S.plans.some(p => p.name === c.name);
    return `
    <div class="item">
      <div class="grow">
        <div class="t">${esc(c.name)}</div>
        <div class="s">${esc(c.grade)} · ${isMajor ? '전공학점 인정' : '일반선택 인정 (전공 비연계)'}</div>
      </div>
      <span class="chip ${isMajor ? 'accent' : ''}">+${c.credits}학점</span>
      ${added ? `<span class="chip ok">계획됨</span>` : `<button class="btn sm" data-plan-cert="${esc(c.name)}">${ICONS.plus} 계획</button>`}
    </div>`;
  };

  return `
    ${backBtn('보충 계획 · 자격증')}
    <div class="banner info">${ICONS.info}<div>자격증·독학사 학점은 <b>연간 42학점 제한에 포함되지 않아</b> 기간 단축의 핵심입니다. ${getReq().short} 과정은 자격증 최대 ${slot.limit}개까지 인정되며, 지금 <b>${slot.slots}개</b> 더 계획할 수 있어요. 여기 넣어둔 계획은 로드맵 부족 학점 계산에 바로 반영되고, 언제든 수정할 수 있습니다.</div></div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin:18px 0 10px">
      <div class="section-title" style="margin:0">내 보충 계획</div>
      <button class="btn sm" data-add-plan>${ICONS.plus} 직접 추가 (독학사 등)</button>
    </div>
    ${S.plans.length ? S.plans.map(planItem).join('') : `
      <div class="card empty" style="padding:24px">${ICONS.award}<div>아직 계획이 없어요.<br>아래 추천에서 고르거나 직접 추가해 보세요.</div></div>`}

    ${related.length ? `
      <div class="section-title">${esc(S.profile.major)} 전공학점으로 인정 (제28차 고시 기준)</div>
      ${related.map(c => certRow(c, true)).join('')}` : `
      <div class="section-title">전공 관련</div>
      <div class="card empty"><div>‘${esc(S.profile.major)}’ 전공과 자동 매칭되는 자격증 정보가 없습니다.<br>학점은행 홈페이지의 ‘자격 검색’에서 확인해 보세요.</div></div>`}

    <div class="section-title">그 외 자격증 — 일반선택 학점으로 인정 (1개까지)</div>
    ${others.map(c => certRow(c, false)).join('')}

    <div class="footnote">국가기술자격 등급별 인정 학점: 기술사 45 · 기능장 30 · 기사 20 · 산업기사 16학점 (기능사는 인정 불가).
    전공 연계 자격은 전공필수 학점으로, 연계 없는 자격은 일반선택 학점으로 <b>1개까지만</b> 인정되며, 동일 직무 분야 자격은 1개만, 동일 자격은 전체 학위과정에서 한 번만 인정됩니다.
    표시된 학점·전공 연계는 「제28차 자격 학점인정 기준」 고시(2025.12.15 시행)를 반영한 대표 예시이며, 최종 확인은 학점은행 홈페이지 ‘자격 검색’에서 하세요.</div>`;
}

function bindCerts() {
  bindBack();
  bindPlanItems();
  const ap = $('[data-add-plan]');
  if (ap) ap.onclick = () => planModal(null, { target: 'major' });
  $$('[data-plan-cert]').forEach(b => b.onclick = () => {
    const cert = DATA.certs.find(c => c.name === b.dataset.planCert);
    if (!cert) return;
    planModal(null, {
      name: cert.name, credits: cert.credits,
      target: cert.majors.includes(S.profile.major) ? 'major' : 'general'
    });
  });
}

/* --- FAQ --- */

function viewFaq() {
  return `
    ${backBtn('자주 묻는 질문')}
    ${DATA.faq.map(f => `
      <details class="faq">
        <summary>${esc(f.q)}</summary>
        <div class="a">${esc(f.a)}</div>
      </details>`).join('')}
    <div class="footnote">국가평생교육진흥원 학점은행 공개 자료와 공식 고시를 바탕으로 정리했습니다. 제도는 변경될 수 있으니 최신 기준은 www.cb.or.kr에서 확인하세요.</div>`;
}

/* --- 학점은행제 가이드 다시 보기 --- */

function viewGuideMore() {
  return `
    ${backBtn('학점은행제 가이드')}
    ${DATA.guide.map((g, i) => `
      <details class="faq" ${i === 0 ? 'open' : ''}>
        <summary>${g.icon} 스텝 ${i + 1}. ${esc(g.t)}</summary>
        <div class="a">${g.body}</div>
      </details>`).join('')}
    <div class="footnote">최신 기준은 학점은행 홈페이지(www.cb.or.kr) 또는 ☎ 1600-0400에서 확인하세요.</div>`;
}

/* --- 로그인 · 클라우드 저장 (Supabase) --- */

let sb = null;          // supabase 클라이언트
let sbUser = null;      // 로그인한 사용자
let syncInfo = '';      // 마지막 동기화 표시용
let pushTimer = null;
let cloudInitPromise = null;

function cloudConfigured() {
  return typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY;
}

/* 아이디 기반 로그인: 내부적으로는 '아이디@cbp-user.app' 형태로 저장
   (Supabase 인증이 이메일 형식을 요구하기 때문 — 사용자는 아이디만 보면 됨) */
const ID_DOMAIN = 'cbp-user.app';
const ID_RE = /^[a-z0-9_]{3,20}$/;

function idToEmail(v) {
  v = v.trim();
  return v.includes('@') ? v : `${v.toLowerCase()}@${ID_DOMAIN}`;
}

function emailToId(email) {
  if (!email) return '';
  return email.endsWith('@' + ID_DOMAIN) ? email.slice(0, -(ID_DOMAIN.length + 1)) : email;
}

/* Supabase 오류를 친절한 한국어로 */
function authErrorMsg(error, isLogin) {
  const m = (error.message || '').toLowerCase();
  if (m.includes('already registered') || error.code === 'user_already_exists')
    return '이미 사용 중인 아이디예요 — 다른 아이디를 골라주세요';
  if (m.includes('invalid login credentials'))
    return '아이디 또는 비밀번호가 맞지 않아요';
  if (m.includes('rate limit'))
    return '요청이 너무 잦아요 — 잠시 후 다시 시도해 주세요';
  if (m.includes('at least 6'))
    return '비밀번호는 6자 이상이어야 해요';
  return (isLogin ? '로그인 실패: ' : '회원가입 실패: ') + error.message;
}

/* 클라우드 초기화를 한 번만, 어디서든 기다릴 수 있게 */
function ensureCloud() {
  if (!cloudInitPromise) cloudInitPromise = initCloud();
  return cloudInitPromise;
}

/* 로그인 모달 (첫 화면 등 어디서든 사용)
   · 로그인은 한 번만 하면 기기에 세션이 유지되고 자동 갱신됩니다 */
function authModal(mode = 'login') {
  const isLogin = mode === 'login';
  openModal(`
    <h3>${isLogin ? '로그인' : '계정 만들기'}</h3>
    <div class="field"><label>아이디</label>
      <input type="text" id="lm-id" placeholder="영문 소문자·숫자 3~20자" autocomplete="username" autocapitalize="none" spellcheck="false">
      ${isLogin ? '' : '<div class="hint">이메일 필요 없어요! 아이디만 중복이 아니면 바로 시작돼요.</div>'}
    </div>
    <div class="field"><label>비밀번호</label><input type="password" id="lm-pw" placeholder="6자 이상" autocomplete="${isLogin ? 'current-password' : 'new-password'}"></div>
    ${isLogin ? '' : '<div class="field"><label>비밀번호 확인</label><input type="password" id="lm-pw2" placeholder="한 번 더 입력"></div>'}
    <div class="modal-actions">
      <button class="btn" data-close>취소</button>
      <button class="btn primary" id="lm-go">${isLogin ? '로그인' : '가입하고 시작하기'}</button>
    </div>
    <button class="btn full" id="lm-switch" style="border:0;color:var(--text-2);margin-top:6px">${isLogin ? '계정이 없어요 → 계정 만들기' : '이미 계정이 있어요 → 로그인'}</button>
    <div class="hint" style="margin-top:6px">로그인은 <b>한 번만</b> 하면 이 기기에 계속 유지돼요.</div>`);

  $('#lm-switch').onclick = () => authModal(isLogin ? 'signup' : 'login');

  $('#lm-go').onclick = async () => {
    const rawId = $('#lm-id').value.trim();
    const password = $('#lm-pw').value;
    if (!rawId || !password) { toast('아이디와 비밀번호를 입력해 주세요'); return; }
    if (!rawId.includes('@') && !ID_RE.test(rawId.toLowerCase())) {
      toast('아이디는 영문 소문자·숫자·_ 로 3~20자예요'); return;
    }
    if (!isLogin) {
      if (password.length < 6) { toast('비밀번호는 6자 이상이어야 해요'); return; }
      if (password !== $('#lm-pw2').value) { toast('비밀번호 확인이 일치하지 않아요'); return; }
    }
    await ensureCloud();
    if (!sb) { toast('서버에 연결할 수 없어요 — 인터넷 연결을 확인해 주세요'); return; }
    const email = idToEmail(rawId);

    if (isLogin) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { toast(authErrorMsg(error, true)); return; }
      closeModal();
      await cloudPull(false);
      if (S.profile.done) { render(); toast('돌아오신 걸 환영해요! 계획을 불러왔어요 🎉'); }
      else { ob.phase = 'intro'; renderOnboarding(); toast('로그인했어요! 이제 계획을 만들어 볼까요?'); }
    } else {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) { toast(authErrorMsg(error, false)); return; }
      if (data.session) {
        closeModal();
        if (!S.profile.done) { ob.phase = 'intro'; renderOnboarding(); }
        else render();
        toast(`${emailToId(email)}님, 환영해요! 만드는 계획이 자동 저장돼요 🎉`);
      } else {
        // 서버에 이메일 인증이 켜져 있으면 아이디 방식이 동작하지 않음 (관리자 설정 필요)
        toast('서버 설정 문제로 가입이 완료되지 않았어요 — Supabase에서 Confirm email을 꺼주세요');
      }
    }
  };
}

async function initCloud() {
  if (!cloudConfigured()) return;
  if (!location.protocol.startsWith('http')) return; // file:// 에서는 동작하지 않음
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb = mod.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    sbUser = data.session ? data.session.user : null;
    sb.auth.onAuthStateChange((_ev, session) => {
      sbUser = session ? session.user : null;
      if (S.ui.tab === 'more') render();
    });
    if (sbUser) await cloudPull(false);
    // 이미 로그인된 상태로 온보딩 첫 화면에 있다면 로그인 화면을 건너뜀
    if (sbUser && !S.profile.done && ob.phase === 'auth') { ob.phase = 'intro'; renderOnboarding(); }
  } catch (e) {
    console.warn('클라우드 초기화 실패', e);
  }
}

function scheduleCloudPush() {
  if (!sb || !sbUser) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(cloudPush, 1500);
}

async function cloudPush() {
  if (!sb || !sbUser) return;
  try {
    const { error } = await sb.from('planner_states').upsert({
      user_id: sbUser.id,
      data: S,
      updated_at: S._updatedAt || new Date().toISOString()
    });
    if (error) throw error;
    syncInfo = `마지막 저장: ${new Date().toLocaleTimeString('ko-KR')}`;
  } catch (e) {
    syncInfo = '저장 실패 — 네트워크·설정을 확인하세요';
    console.warn('클라우드 저장 실패', e);
  }
}

/* 클라우드에서 불러오기. interactive=true면 덮어쓰기 전에 확인 */
async function cloudPull(interactive = true) {
  if (!sb || !sbUser) return;
  try {
    const { data: rows, error } = await sb.from('planner_states')
      .select('data, updated_at').eq('user_id', sbUser.id).maybeSingle();
    if (error) throw error;
    if (!rows || !rows.data) { await cloudPush(); return; } // 클라우드가 비어 있으면 현재 기기 내용을 업로드
    const remoteAt = rows.data._updatedAt || rows.updated_at || '';
    const localAt = S._updatedAt || '';
    const localHasData = S.profile.done;
    if (interactive) {
      if (localHasData && !confirm(`클라우드에 저장된 데이터(${remoteAt ? new Date(remoteAt).toLocaleString('ko-KR') : '시각 미상'})로 이 기기의 데이터를 덮어쓸까요?`)) return;
    } else {
      // 자동 동기화: 더 최신인 쪽을 채택
      if (localHasData && localAt >= remoteAt) { scheduleCloudPush(); return; }
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(rows.data));
    S = loadState();
    render();
    syncInfo = `마지막 불러오기: ${new Date().toLocaleTimeString('ko-KR')}`;
    if (interactive) toast('클라우드 데이터를 불러왔습니다');
  } catch (e) {
    console.warn('클라우드 불러오기 실패', e);
    if (interactive) toast('불러오기에 실패했어요 — 네트워크를 확인해 주세요');
  }
}

function viewAccount() {
  if (!cloudConfigured()) {
    return `
      ${backBtn('로그인 · 클라우드 저장')}
      <div class="banner info">${ICONS.info}<div><b>아직 서버가 연결되지 않았어요.</b> 지금은 이 기기(브라우저)에만 저장됩니다. 무료 Supabase 서버를 연결하면 <b>이메일 로그인 + 기기 간 자동 저장</b>이 켜져요.</div></div>
      <div class="card" style="font-size:13.5px;line-height:1.9;color:var(--text-2)">
        <b style="color:var(--text)">연결 방법 (약 5분, 프로젝트의 config.js 파일 참고)</b><br>
        ① supabase.com 가입 → New Project 생성<br>
        ② Project Settings → API의 <b>Project URL</b>과 <b>anon key</b>를 config.js에 붙여넣기<br>
        ③ SQL Editor에서 config.js 안에 적어둔 테이블 생성 쿼리 실행<br>
        ④ Authentication → Providers → <b>Email</b> 켜기<br>
        ⑤ 앱을 http 서버로 열기 (예: <code>python3 -m http.server 8000</code>)<br>
      </div>
      <div class="footnote">그 전에도 ‘더보기 → 데이터 관리’의 백업 파일로 다른 기기에 옮길 수 있어요.</div>`;
  }
  if (!location.protocol.startsWith('http')) {
    return `
      ${backBtn('로그인 · 클라우드 저장')}
      <div class="banner warn">${ICONS.alert}<div>로그인은 <b>http(s)로 열었을 때만</b> 동작해요. 터미널에서 <code>python3 -m http.server 8000</code> 실행 후 <b>localhost:8000</b>으로 접속해 주세요.</div></div>`;
  }
  if (!sbUser) {
    return `
      ${backBtn('로그인 · 클라우드 저장')}
      <div class="banner info">${ICONS.info}<div>로그인하면 데이터가 클라우드에 <b>자동 저장</b>되고, 다른 기기에서 로그인해 이어서 할 수 있어요. 이메일 인증 없이 <b>아이디·비밀번호</b>만으로 시작해요.</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn" id="ac-signup" style="flex:1">계정 만들기</button>
        <button class="btn primary" id="ac-login" style="flex:1">로그인</button>
      </div>`;
  }
  return `
    ${backBtn('로그인 · 클라우드 저장')}
    <div class="banner ok">${ICONS.check}<div><b>${esc(emailToId(sbUser.email))}</b>님으로 로그인됨 — 변경 사항이 자동으로 클라우드에 저장돼요.${syncInfo ? `<br><span style="opacity:.8">${esc(syncInfo)}</span>` : ''}</div></div>
    <button class="link-row" id="ac-push">${ICONS.upload}<span class="grow">지금 클라우드에 저장<span class="sub">이 기기의 데이터를 업로드</span></span></button>
    <button class="link-row" id="ac-pull">${ICONS.download}<span class="grow">클라우드에서 불러오기<span class="sub">이 기기의 데이터를 덮어씁니다</span></span></button>
    <button class="link-row" id="ac-logout" style="color:var(--danger)">${ICONS.person}<span class="grow">로그아웃<span class="sub">이 기기의 데이터는 그대로 남아요</span></span></button>`;
}

function bindAccount() {
  bindBack();
  const login = $('#ac-login');
  if (login) login.onclick = () => authModal('login');
  const signup = $('#ac-signup');
  if (signup) signup.onclick = () => authModal('signup');
  const push = $('#ac-push');
  if (push) push.onclick = async () => { await cloudPush(); render(); toast('클라우드에 저장했습니다'); };
  const pull = $('#ac-pull');
  if (pull) pull.onclick = () => cloudPull(true);
  const logout = $('#ac-logout');
  if (logout) logout.onclick = async () => {
    await sb.auth.signOut();
    sbUser = null;
    render(); toast('로그아웃되었습니다');
  };
}

/* --- 알림 설정 --- */

function viewNotif() {
  const n = S.notif;
  const permission = ('Notification' in window) ? Notification.permission : 'unsupported';
  const permLabel = { granted: '허용됨', denied: '차단됨 — 브라우저 설정에서 허용해 주세요', default: '아직 허용하지 않음', unsupported: '이 브라우저는 알림을 지원하지 않습니다' }[permission];

  return `
    ${backBtn('알림 설정')}
    <div class="banner ${permission === 'granted' ? 'ok' : 'info'}">${ICONS.bell}<div>브라우저 알림 권한: <b>${permLabel}</b><br><span style="opacity:.8">완료 처리한 일정은 알림이 울리지 않아요.</span></div></div>

    <div class="banner info">${ICONS.info}<div><b>알림이 안 와요?</b> 체크리스트 ↓<br>
      ① 위 권한이 ‘허용됨’인지 + <b>macOS/휴대폰 시스템 설정에서 브라우저 알림</b>이 켜져 있는지 (Mac: 시스템 설정 → 알림 → 사용 중인 브라우저)<br>
      ② 앱을 <b>홈 화면에 추가(PWA 설치)</b>하면 훨씬 안정적으로 와요 — iPhone: Safari 공유 → 홈 화면에 추가 / Mac Chrome: 주소창 설치 아이콘<br>
      ③ 현재는 앱(또는 브라우저)이 실행 중일 때 울리는 방식이에요. <b>기기가 꺼져 있어도 오는 서버 푸시</b>는 로그인 서버(config.js) 연결 후 푸시 서버를 붙이면 가능해요 — 정식 출시 단계에서 함께 세팅하는 걸 추천해요.</div></div>

    ${permission !== 'granted' && permission !== 'unsupported' ? `<button class="btn primary full" data-perm style="margin-bottom:14px">알림 허용하기</button>` : ''}

    <div class="card">
      <div class="stat-row" style="margin-bottom:0"><span class="label">알림 사용</span>
        <div class="seg" style="width:130px"><button class="${n.enabled ? 'active' : ''}" data-nf="enabled-on">켬</button><button class="${!n.enabled ? 'active' : ''}" data-nf="enabled-off">끔</button></div>
      </div>
    </div>

    <div class="section-title">강의 듣기 알림</div>
    <div class="card">
      <div class="stat-row"><span class="label">사용</span>
        <div class="seg" style="width:130px"><button class="${n.studyOn ? 'active' : ''}" data-nf="study-on">켬</button><button class="${!n.studyOn ? 'active' : ''}" data-nf="study-off">끔</button></div>
      </div>
      <div class="field" style="margin:14px 0 0"><label>요일</label>
        <div style="display:flex;gap:6px">
          ${WEEKDAYS.map((w, i) => `<button class="btn sm" data-day="${i}" style="flex:1;padding:6px 0;${n.studyDays.includes(i) ? 'background:var(--accent);border-color:var(--accent);color:#fff' : ''}">${w}</button>`).join('')}
        </div>
      </div>
      <div class="field" style="margin:14px 0 0"><label>시간</label><input type="time" id="nf-study-time" value="${n.studyTime}"></div>
    </div>

    <div class="section-title">일정 알림 (시험 · 과제 · 토론 · 자격증)</div>
    <div class="card">
      <div class="stat-row"><span class="label">사용</span>
        <div class="seg" style="width:130px"><button class="${n.schedOn ? 'active' : ''}" data-nf="sched-on">켬</button><button class="${!n.schedOn ? 'active' : ''}" data-nf="sched-off">끔</button></div>
      </div>
      <div class="stat-row" style="margin:14px 0 0"><span class="label">전날에도 알림</span>
        <div class="seg" style="width:130px"><button class="${n.dayBefore ? 'active' : ''}" data-nf="before-on">켬</button><button class="${!n.dayBefore ? 'active' : ''}" data-nf="before-off">끔</button></div>
      </div>
      <div class="field" style="margin:14px 0 0"><label>알림 시각</label><input type="time" id="nf-sched-time" value="${n.schedTime}"></div>
      <div class="hint" style="margin-top:8px">기간 일정은 시작 전날·당일과 마감일 당일에 알려 드려요.</div>
    </div>

    <button class="btn full" data-test-notif style="margin-top:14px">${ICONS.bell} 알림 테스트</button>`;
}

function bindNotif() {
  bindBack();
  const set = (k, v) => { S.notif[k] = v; save(); render(); };
  const map = {
    'enabled-on': () => { set('enabled', true); ensurePermission(); },
    'enabled-off': () => set('enabled', false),
    'study-on': () => set('studyOn', true), 'study-off': () => set('studyOn', false),
    'sched-on': () => set('schedOn', true), 'sched-off': () => set('schedOn', false),
    'before-on': () => set('dayBefore', true), 'before-off': () => set('dayBefore', false)
  };
  $$('[data-nf]').forEach(b => b.onclick = map[b.dataset.nf]);
  $$('[data-day]').forEach(b => b.onclick = () => {
    const d = Number(b.dataset.day);
    const days = S.notif.studyDays;
    S.notif.studyDays = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort();
    save(); render();
  });
  const st = $('#nf-study-time');
  if (st) st.onchange = () => { S.notif.studyTime = st.value || '20:00'; save(); };
  const sc = $('#nf-sched-time');
  if (sc) sc.onchange = () => { S.notif.schedTime = sc.value || '09:00'; save(); };
  const perm = $('[data-perm]');
  if (perm) perm.onclick = () => ensurePermission(true);
  const test = $('[data-test-notif]');
  if (test) test.onclick = async () => {
    const ok = await ensurePermission(true);
    if (ok) { notify('학점은행 플래너', '알림이 정상적으로 동작합니다 ✅'); toast('테스트 알림을 보냈습니다'); }
    else toast('알림 권한이 없습니다');
  };
}

/* --- 목표 · 내 정보 --- */

function viewProfile() {
  const p = S.profile;
  const isBachelor = p.degree === 'bachelor' || p.degree === 'bachelor2';
  const majors = isBachelor ? DATA.majors.bachelor : DATA.majors.associate;
  const inList = majors.includes(p.major);
  const opts = conferralOpts(10);
  if (p.goalYm && !opts.some(o => o.ym === p.goalYm)) opts.unshift(goalInfoOf(p.goalYm));
  return `
    ${backBtn('목표 · 내 정보')}
    <div class="card">
      <div class="field"><label>학위 과정</label>
        <select id="pf-degree">${Object.entries(DATA.degrees).map(([k, d]) => `<option value="${k}" ${p.degree === k ? 'selected' : ''}>${d.name} (${d.note})</option>`).join('')}</select>
      </div>
      <div class="field"><label>전공</label>
        <select id="pf-major">
          ${majors.map(m => `<option ${p.major === m ? 'selected' : ''}>${m}</option>`).join('')}
          <option value="__custom" ${!inList ? 'selected' : ''}>직접 입력…</option>
        </select>
      </div>
      <div class="field" id="pf-custom-wrap" style="display:${inList ? 'none' : 'block'}">
        <label>전공명 직접 입력</label>
        <input type="text" id="pf-major-custom" value="${esc(inList ? '' : p.major)}">
      </div>
      <div class="field"><label>시작일</label><input type="date" id="pf-start" value="${p.startDate}"></div>
      <div class="field"><label>목표 학위수여 시점 <span style="font-weight:400;color:var(--text-3)">— 수여는 연 2회(2월·8월)</span></label>
        <select id="pf-goal">${opts.map(o => `<option value="${o.ym}" ${p.goalYm === o.ym ? 'selected' : ''}>${o.label} (${o.half} · 학위신청 ${o.applyLabel})</option>`).join('')}</select>
      </div>
      <div class="divider"></div>
      <div style="font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:12px">이미 인정받은 학점 (과목·보충 계획 등록분 제외)</div>
      <div class="field"><label>전공</label><input type="number" id="pf-e-major" min="0" value="${p.earned.major}"></div>
      <div class="field"><label>교양</label><input type="number" id="pf-e-liberal" min="0" value="${p.earned.liberal}"></div>
      <div class="field"><label>일반선택</label><input type="number" id="pf-e-general" min="0" value="${p.earned.general}"></div>
      <div class="divider"></div>
      <div style="font-size:13px;font-weight:600;color:var(--text-2);margin-bottom:12px">인정 받을 예정인 학점 (이수했지만 학점인정 신청 전)</div>
      <div class="field"><label>전공</label><input type="number" id="pf-p-major" min="0" value="${p.pending.major || 0}"></div>
      <div class="field"><label>교양</label><input type="number" id="pf-p-liberal" min="0" value="${p.pending.liberal || 0}"></div>
      <div class="field"><label>일반선택</label><input type="number" id="pf-p-general" min="0" value="${p.pending.general || 0}">
        <div class="hint">다음 학점인정 신청 기간(${nextRecogLabel()})에 홈 화면 배너로 챙겨 드려요.</div></div>
      <div class="field"><label>학점인정에 이미 사용한 자격증 수</label>
        <select id="pf-certs">${[0, 1, 2, 3].map(x => `<option value="${x}" ${p.certsUsed === x ? 'selected' : ''}>${x}개</option>`).join('')}</select>
      </div>
      <button class="btn primary full" id="pf-save">저장하고 로드맵 갱신</button>
    </div>`;
}

function bindProfile() {
  bindBack();
  const sel = $('#pf-major');
  sel.onchange = () => { $('#pf-custom-wrap').style.display = sel.value === '__custom' ? 'block' : 'none'; };
  $('#pf-degree').onchange = () => {
    S.profile.degree = $('#pf-degree').value;
    save(); render();
  };
  $('#pf-save').onclick = () => {
    const p = S.profile;
    p.degree = $('#pf-degree').value;
    p.major = sel.value === '__custom' ? ($('#pf-major-custom').value.trim() || p.major) : sel.value;
    p.startDate = $('#pf-start').value || p.startDate;
    p.goalYm = $('#pf-goal').value;
    p.earned.major = Math.max(0, Number($('#pf-e-major').value) || 0);
    p.earned.liberal = Math.max(0, Number($('#pf-e-liberal').value) || 0);
    p.earned.general = Math.max(0, Number($('#pf-e-general').value) || 0);
    p.pending.major = Math.max(0, Number($('#pf-p-major').value) || 0);
    p.pending.liberal = Math.max(0, Number($('#pf-p-liberal').value) || 0);
    p.pending.general = Math.max(0, Number($('#pf-p-general').value) || 0);
    p.certsUsed = Number($('#pf-certs').value) || 0;
    S.manualTerms = null;
    save(); go('roadmap'); toast('로드맵이 갱신되었습니다');
  };
}

/* --- 데이터 관리 --- */

function viewData() {
  return `
    ${backBtn('데이터 관리')}
    <div class="banner info">${ICONS.info}<div>모든 데이터는 이 기기의 브라우저에만 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우면 사라질 수 있으니 주기적으로 백업하세요.</div></div>
    <button class="link-row" data-export>${ICONS.download}<span class="grow">백업 파일 내려받기<span class="sub">JSON 파일로 저장</span></span></button>
    <button class="link-row" data-import>${ICONS.upload}<span class="grow">백업 파일 불러오기<span class="sub">기존 데이터를 덮어씁니다</span></span></button>
    <input type="file" id="import-file" accept=".json" style="display:none">
    <div class="section-title">위험 구역</div>
    <button class="link-row" data-reset style="color:var(--danger)">${ICONS.trash}<span class="grow">모든 데이터 초기화<span class="sub">과목·일정·계획·설정이 모두 삭제됩니다</span></span></button>`;
}

function bindData() {
  bindBack();
  $('[data-export]').onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `학점은행플래너_백업_${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('백업 파일을 내려받았습니다');
  };
  const fileInput = $('#import-file');
  $('[data-import]').onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const f = fileInput.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.profile) throw new Error('bad');
        if (!confirm('현재 데이터를 백업 파일 내용으로 덮어쓸까요?')) return;
        localStorage.setItem(STORE_KEY, JSON.stringify(data));
        S = loadState();
        save();
        render(); toast('복원되었습니다');
      } catch (e) { toast('올바른 백업 파일이 아닙니다'); }
    };
    r.readAsText(f);
  };
  $('[data-reset]').onclick = () => {
    if (!confirm('정말 모든 데이터를 삭제할까요? 되돌릴 수 없습니다.')) return;
    localStorage.removeItem(STORE_KEY);
    S = defaultState();
    ob = { phase: 'auth', guideStep: 0, step: 0, degree: 'bachelor', major: '', earned: { major: 0, liberal: 0, general: 0 }, pending: { major: 0, liberal: 0, general: 0 }, certsUsed: 0, courses: [], plans: [], goalYm: null };
    render();
  };
}

/* ---------- 모달 ---------- */

function openModal(html) {
  $('#modal-root').innerHTML = `
    <div class="modal-back" id="modal-back">
      <div class="modal">${html}</div>
    </div>`;
  $('#modal-back').onclick = e => { if (e.target.id === 'modal-back') closeModal(); };
  $$('[data-close]').forEach(b => b.onclick = closeModal);
}

function closeModal() {
  $('#modal-root').innerHTML = '';
}

/* ---------- 알림 ---------- */

async function ensurePermission(explicit = false) {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  if (explicit || S.notif.enabled) {
    const p = await Notification.requestPermission();
    if (S.ui.tab === 'more' && S.ui.sub === 'notif') render();
    return p === 'granted';
  }
  return false;
}

function notify(title, body) {
  // 서비스 워커가 있으면 SW 알림 사용 (모바일 브라우저는 new Notification()이 막혀 있음)
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then(r => r.showNotification(title, { body, icon: 'icon-192.png', badge: 'icon-192.png' }))
        .catch(() => { try { new Notification(title, { body }); } catch (e) { /* 무시 */ } });
      return;
    }
    new Notification(title, { body });
  } catch (e) { /* 무시 */ }
}

function pruneFired() {
  const f = S.notif.fired;
  for (const k of Object.keys(f)) {
    if (dday(f[k]) < -7) delete f[k];
  }
}

function notifTick() {
  const n = S.notif;
  if (!n.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = todayStr();
  let changed = false;

  // 강의 듣기 알림
  if (n.studyOn && n.studyDays.includes(now.getDay()) && hhmm >= n.studyTime) {
    const key = `study-${today}`;
    if (!n.fired[key]) {
      notify('강의 들을 시간이에요 📚', '오늘 계획한 강의를 수강해 보세요.');
      n.fired[key] = today; changed = true;
    }
  }

  // 일정 알림 (기간 일정: 시작 전날·당일 + 마감일 당일)
  if (n.schedOn && hhmm >= n.schedTime) {
    for (const s of S.schedules) {
      if (!s.alarm || s.done) continue;
      // 이미 합격/완료 처리된 자격증 계획에 연결된 일정은 울리지 않음
      if (s.planId) {
        const plan = S.plans.find(p => p.id === s.planId);
        if (plan && plan.status === 'done') continue;
      }
      const ds = dday(s.start);
      const de = dday(s.end);
      const type = SCHED_TYPES[s.type]?.label || '일정';
      if (ds === 0) {
        const key = `sd-${s.id}-${today}`;
        if (!n.fired[key]) {
          notify(`오늘 시작: ${s.title}`, `${type}${s.subtype ? ' · ' + s.subtype : ''}${s.time ? ' · ' + s.time : ''}${s.end !== s.start ? ` · ${fmtDate(s.end, { day: false })}까지` : ''}`);
          n.fired[key] = today; changed = true;
        }
      } else if (ds === 1 && n.dayBefore) {
        const key = `sb-${s.id}-${today}`;
        if (!n.fired[key]) {
          notify(`내일 시작: ${s.title}`, `${type} 하루 전 알림입니다.`);
          n.fired[key] = today; changed = true;
        }
      }
      if (s.end !== s.start && de === 0) {
        const key = `se-${s.id}-${today}`;
        if (!n.fired[key]) {
          notify(`오늘 마감: ${s.title}`, `${type} 마감일입니다. 잊지 않으셨죠?`);
          n.fired[key] = today; changed = true;
        }
      }
    }
  }

  if (changed) { pruneFired(); save(); }
}

/* ---------- 시작 ---------- */

// 서비스 워커 등록 (오프라인 · 홈 화면 설치 · 안정적인 알림)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* file:// 등에서는 무시 */ });
}

render();
ensureCloud();
setInterval(notifTick, 20000);
notifTick();
