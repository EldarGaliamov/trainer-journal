'use strict';

/* =========================================================
   Журнал тренера — веб-прототип
   Данные хранятся в localStorage этого браузера.
   ========================================================= */

const KEY = 'trainer-journal-v1';
const PRICE_SINGLE = 900;
const SUB_COUNT = 8;
const SUB_PRICE = 7200;
const SUB_DAYS = 30;

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const todayISO = () => iso(new Date());
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const NB = ' ';
const money = n => Math.round(n).toLocaleString('ru-RU').replace(/\s/g, NB) + NB + '₽';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WD_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const WD_ACC = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];

const dayMonth = s => { const d = parseISO(s); return `${d.getDate()}${NB}${MONTHS_G[d.getMonth()]}`; };
const longDate = s => { const d = parseISO(s); return `${WD_FULL[d.getDay()]}, ${d.getDate()}${NB}${MONTHS_G[d.getMonth()]}`; };

/* Russian typography: glue short words to the next one */
const SHORT = /(^|[\s(«])(в|во|к|ко|с|со|у|о|об|и|а|но|на|по|до|за|из|от|не|ни|без|для|при|под|над|про|или|что|как)\s+/giu;
function typo(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.parentElement && /^(SCRIPT|STYLE|INPUT|TEXTAREA)$/.test(n.parentElement.tagName)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const v = n.nodeValue;
    if (!/\s/.test(v)) continue;
    const nv = v.replace(SHORT, (m, p, w) => p + w + NB).replace(SHORT, (m, p, w) => p + w + NB);
    if (nv !== v) n.nodeValue = nv;
  }
}

function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* ---------- icons ---------- */
const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5a3 3 0 0 0-6 0v5.5H5.5A1.5 1.5 0 0 1 4 19z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="5.5" width="16" height="14.5" rx="4"/><path d="M8 3.5v3M16 3.5v3M4 10h16M9 14.5l2 2 4-4"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9.5" cy="8" r="3.5"/><path d="M3 19.5c.6-3.3 3.2-5.5 6.5-5.5s5.9 2.2 6.5 5.5"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c1.6.8 2.7 2.7 3 5.1"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6-6 6 6 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 6 6 6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9.5 6 6 6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5.5 12.5 4 4 9-9"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5z"/><path d="M10 9.5v5M14 9.5v5" stroke-linecap="round"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3.5" y="6" width="17" height="12" rx="3.5"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9.5v5M17 9.5v5" stroke-linecap="round"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c.8-3.6 3.8-6 7.5-6s6.7 2.4 7.5 6"/></svg>',
  spin: '<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/></svg>',
};

/* ---------- data ---------- */
let db;

function seededRandom(seed) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}

function seed() {
  const today = todayISO();
  const rnd = seededRandom(20261020);
  const names = [
    ['Анна Сергеева', { left: 3, total: 8, until: addDays(today, 18) }],
    ['Мария Ковалёва', null],
    ['Илья Петров', null],
    ['Ольга Волкова', { left: 5, total: 8, until: addDays(today, 22) }],
    ['Егор Лебедев', { left: 1, total: 8, until: addDays(today, 6) }],
    ['Дарья Никитина', { left: 6, total: 8, until: addDays(today, 25) }],
    ['Софья Морозова', { left: 0, total: 8, until: addDays(today, 3) }],
    ['Кира Белова', { left: 4, total: 8, until: addDays(today, 14) }],
    ['Полина Орлова', { left: 7, total: 8, until: addDays(today, 28) }],
    ['Виктория Зайцева', { left: 2, total: 8, until: addDays(today, 9) }],
    ['Алина Соколова', { left: 5, total: 8, until: addDays(today, 20) }],
    ['Тимур Ахмедов', null],
    ['Ева Смирнова', { left: 3, total: 8, until: addDays(today, -2) }],
    ['Яна Кузнецова', { left: 8, total: 8, until: addDays(today, 30) }],
  ];
  const students = names.map(([name, plan], i) => ({ id: 's' + (i + 1), name, phone: '', plan }));
  const ids = students.map(s => s.id);
  const groups = [
    { title: 'Группа BASIC', start: '10:00', end: '11:00', room: 'Большой зал', days: [1, 3, 5], sids: ids.slice(3, 14) },
    { title: 'Группа ANGFUNK', start: '18:00', end: '19:00', room: 'Малый зал', days: [2, 4], sids: ids.slice(0, 8) },
    { title: 'Группа HEELS', start: '20:00', end: '21:00', room: 'Малый зал', days: [1, 2, 4], sids: [ids[0], ids[3], ids[6], ids[8], ids[9], ids[12]] },
    { title: 'Растяжка', start: '12:00', end: '13:00', room: 'Большой зал', days: [6], sids: ids.slice(5, 12) },
  ];
  const lessons = [];
  for (let off = -21; off <= 35; off++) {
    const date = addDays(today, off);
    const wd = parseISO(date).getDay();
    for (const g of groups) {
      if (!g.days.includes(wd)) continue;
      const rsvp = {};
      g.sids.forEach(sid => { const r = rnd(); if (r < .55) rsvp[sid] = 'yes'; else if (r < .7) rsvp[sid] = 'no'; });
      const l = { id: uid(), title: g.title, date, start: g.start, end: g.end, room: g.room, studentIds: [...g.sids], rsvp, record: null };
      const isPast = off < 0 || (off === 0 && toMin(g.end) < nowMin());
      // most past lessons are already recorded; a couple are left for the demo
      if (isPast && !(off >= -2)) {
        const attended = g.sids.filter(() => rnd() < .7);
        const billing = {};
        attended.forEach(sid => billing[sid] = { kind: 'sub' });
        l.record = { attended, billing, effects: [], savedAt: Date.now() };
      }
      lessons.push(l);
    }
  }
  return { v: 1, students, lessons, payments: [
    { id: uid(), sid: 's3', lessonId: null, amount: PRICE_SINGLE, method: 'later', status: 'expected', date: addDays(today, -7), what: 'Разовое занятие' },
  ] };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.v === 1) return d; }
  } catch (e) { /* storage unavailable */ }
  return seed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ } }

db = load();
save();

const student = id => db.students.find(s => s.id === id);
const lesson = id => db.lessons.find(l => l.id === id);
const lessonsOn = date => db.lessons.filter(l => l.date === date).sort((a, b) => toMin(a.start) - toMin(b.start));
const hasActiveSub = (s, date) => !!(s && s.plan && s.plan.left > 0 && s.plan.until >= date);
const isOverdue = l => !l.record && (l.date < todayISO() || (l.date === todayISO() && toMin(l.end) <= nowMin()));
const groupTitles = () => Array.from(new Set(db.lessons.map(l => l.title))).sort();
const unpaidOf = sid => db.payments.filter(p => p.sid === sid && p.status === 'expected');

function studentStatus(s, date) {
  if (!s) return 'Удалён';
  if (hasActiveSub(s, date)) return `Абонемент, ${plural(s.plan.left, 'осталось', 'осталось', 'осталось')} ${s.plan.left}`;
  if (s.plan) return 'Абонемент закончился';
  return 'Нет абонемента';
}

/* ---------- accounting ---------- */
function revertRecord(l) {
  if (!l.record) return;
  const effects = l.record.effects || [];
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    const s = student(e.sid);
    if (!s) continue;
    if (e.t === 'sub' && s.plan) s.plan.left += 1;
    if (e.t === 'newsub') s.plan = e.prev ? { ...e.prev } : null;
  }
  db.payments = db.payments.filter(p => p.lessonId !== l.id);
}

function applyRecord(l, draft) {
  revertRecord(l);
  const effects = [];
  const attended = [...draft.attended];
  const billing = {};
  for (const sid of attended) {
    const s = student(sid);
    const b = draft.billing[sid];
    if (!s || !b) continue;
    billing[sid] = { ...b };
    if (b.kind === 'sub') {
      if (s.plan && s.plan.left > 0) { s.plan.left -= 1; effects.push({ sid, t: 'sub' }); }
    } else if (b.kind === 'newsub') {
      effects.push({ sid, t: 'newsub', prev: s.plan ? { ...s.plan } : null });
      s.plan = { left: SUB_COUNT - 1, total: SUB_COUNT, until: addDays(l.date, SUB_DAYS) };
      db.payments.push({ id: uid(), sid, lessonId: l.id, amount: SUB_PRICE, method: b.pay, status: 'paid', date: l.date, what: 'Абонемент' });
    } else if (b.kind === 'single') {
      db.payments.push({ id: uid(), sid, lessonId: l.id, amount: PRICE_SINGLE, method: b.pay, status: b.pay === 'later' ? 'expected' : 'paid', date: l.date, what: 'Разовое занятие' });
    }
  }
  l.record = { attended, billing, effects, savedAt: Date.now() };
  save();
}

function summarize(l, draft) {
  let sub = 0, single = 0, newsub = 0, paid = 0, expected = 0;
  for (const sid of draft.attended) {
    const b = draft.billing[sid];
    if (!b) continue;
    if (b.kind === 'sub') sub++;
    if (b.kind === 'single') { single++; if (b.pay === 'later') expected += PRICE_SINGLE; else paid += PRICE_SINGLE; }
    if (b.kind === 'newsub') { newsub++; paid += SUB_PRICE; }
  }
  return { sub, single, newsub, paid, expected };
}

/* ---------- UI state ---------- */
let booted = false;
const haptic = (p = 8) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* unsupported */ } };
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

const ui = {
  date: todayISO(),
  drafts: {},
  studentQuery: '',
};

/* ---------- router ---------- */
const app = $('#app');
const nav = $('#nav');
let current = null; // { el, route }
const stack = [];

function parseRoute(hash) {
  const raw = (hash || '').replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  const name = parts[0] || 'home';
  return { name, id: parts[1], q, key: '#/' + raw };
}
const TABS = ['home', 'schedule', 'students'];
const isTab = r => TABS.includes(r.name);

function go(hash) { location.hash = hash; }
function replace(hash) {
  stack.pop();
  _replacing = true;
  location.replace(hash);
}
let _replacing = false;

function back(fallback = '#/') {
  if (stack.length > 1) history.back();
  else go(fallback);
}

let skipRender = false;
function render() {
  if (skipRender) { skipRender = false; return; }
  const r = parseRoute(location.hash);
  let dir;
  const prevKey = stack[stack.length - 1];
  if (_replacing) {
    _replacing = false;
    dir = 'push';
    stack.push(r.key);
  } else if (isTab(r)) {
    const wasTab = current && isTab(current.route);
    dir = !current ? 'none' : wasTab ? 'fade' : 'pop';
    stack.length = 0; stack.push(r.key);
  } else if (stack.length > 1 && stack[stack.length - 2] === r.key) {
    stack.pop(); dir = 'pop';
  } else if (prevKey === r.key) {
    dir = 'none';
  } else {
    stack.push(r.key); dir = current ? 'push' : 'none';
  }

  const builder = SCREENS[r.name] || SCREENS.home;
  const screen = builder(r);
  if (!screen) return;
  const el = screen.el;
  typo(el);
  mount(el, dir);
  current = { el, route: r };
  screen.mounted && screen.mounted();

  // nav
  nav.classList.toggle('hidden', !isTab(r));
  if (isTab(r)) setNav(r.name);
  booted = true;
}

function mount(el, dir) {
  const old = current && current.el;
  if (reduceMotion() && dir !== 'none') dir = 'fade';
  app.appendChild(el);
  if (!old || dir === 'none') { if (old) old.remove(); return; }
  el.classList.add('enter-' + dir, 'animating');
  old.classList.add('leave-' + dir, 'animating');
  old.style.pointerEvents = 'none';
  const done = () => { old.remove(); el.classList.remove('enter-' + dir, 'animating'); };
  el.addEventListener('animationend', function f(e) { if (e.target === el) { el.removeEventListener('animationend', f); done(); } });
  setTimeout(() => { if (old.isConnected) done(); }, 600);
}

function setNav(name) {
  const tabs = $$('.nav-tab', nav);
  const i = TABS.indexOf(name);
  tabs.forEach((t, j) => { t.classList.toggle('on', j === i); t.setAttribute('aria-current', j === i ? 'page' : 'false'); });
  $('.nav-indicator', nav).style.transform = `translateX(${i * 88}px)`;
}

/* ---------- shared pieces ---------- */
function weekStrip(selected, onSelect) {
  const today = todayISO();
  const start = addDays(selected < today ? selected : today, -14);
  const end = addDays(selected > today ? selected : today, 35);
  let html = '';
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const dt = parseISO(d);
    const cls = ['day', 'press'];
    if (d === selected) cls.push('sel');
    if (d === today) cls.push('today');
    if (d < today) cls.push('past');
    const has = db.lessons.some(l => l.date === d);
    html += `<button class="${cls.join(' ')}" data-d="${d}" aria-pressed="${d === selected}" aria-label="${longDate(d)}"><b>${dt.getDate()}</b><small>${WD[dt.getDay()]}</small>${has ? '<i></i>' : ''}</button>`;
  }
  const el = h(`<div class="strip" role="group" aria-label="Дни">${html}</div>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('.day'); if (!b) return;
    const d = b.dataset.d;
    if (d === ui.date) return;
    $$('.day', el).forEach(x => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', x === b); });
    ui.date = d;
    onSelect(d);
    centerDay(el, b, true);
  });
  return el;
}
// On open: the selected day sits second, after the previous day (as in the mockup).
// On tap: scroll only if the day is partly hidden.
function centerDay(strip, btn, smooth) {
  const behavior = smooth && !reduceMotion() ? 'smooth' : 'auto';
  if (!smooth) {
    // start the visible row on Monday of the selected week, keeping the selected day in view
    const d = parseISO(btn.dataset.d);
    const mon = iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
    const monBtn = strip.querySelector(`[data-d="${mon}"]`);
    let left = monBtn ? monBtn.offsetLeft - 16 : btn.offsetLeft - 72;
    if (btn.offsetLeft + 92 - left > strip.clientWidth - 16) left = btn.offsetLeft - 72;
    strip.scrollTo({ left: Math.max(0, left) });
    return;
  }
  const l = btn.offsetLeft - strip.scrollLeft, r = l + 92;
  if (l < 16) strip.scrollTo({ left: btn.offsetLeft - 16 - 56, behavior });
  else if (r > strip.clientWidth - 16) strip.scrollTo({ left: btn.offsetLeft + 92 - strip.clientWidth + 16 + 56, behavior });
}

function lessonChips(l) {
  const n = l.studentIds.length;
  let status = '';
  if (l.record) status = '<span class="chip ok">Учтено</span>';
  else if (isOverdue(l)) status = '<span class="chip warn">Не учтено</span>';
  return `<span class="chip">${esc(l.room || 'Зал не указан')}</span><span class="chip">${n} ${plural(n, 'ученик', 'ученика', 'учеников')}</span>${status}`;
}
function lessonRow(l, i = 0) {
  const href = l.record ? `#/done/${l.id}` : `#/lesson/${l.id}`;
  return `<a class="lrow" href="${href}" style="--i:${i}">
    <div class="lrow-time tnum"><b>${l.start}</b><span>${l.end}</span></div>
    <div class="lrow-card">
      <div class="lrow-top"><span class="lrow-title t-h4">${esc(l.title)}</span><span class="go-dot">${I.chev}</span></div>
      <div class="chips">${lessonChips(l)}</div>
    </div></a>`;
}

function nextLessonFor(date) {
  const list = lessonsOn(date);
  if (!list.length) return null;
  if (date === todayISO()) {
    const now = nowMin();
    return list.find(l => !l.record && toMin(l.end) > now) || list.find(l => !l.record) || list[list.length - 1];
  }
  return list.find(l => !l.record) || list[0];
}

function nearestDayWithLessons(from) {
  for (let i = 1; i <= 60; i++) { const d = addDays(from, i); if (db.lessons.some(l => l.date === d)) return d; }
  return null;
}

/* ---------- screens ---------- */
const SCREENS = {};

SCREENS.home = () => {
  // Home always opens on today: "Ближайшее занятие" must match the highlighted date.
  ui.date = todayISO();
  const el = h(`<section class="screen tab-screen has-grad">
    <div class="screen-bg"></div>
    <div class="scroll">
      <h1 class="month-title t-h1" data-month></h1>
      <div data-strip></div>
      <div data-day class="day-switch"></div>
    </div>
  </section>`);
  const dayBox = $('[data-day]', el);

  function fillDay(date, initial) {
    $('[data-month]', el).textContent = MONTHS[parseISO(date).getMonth()];
    const isToday = date === todayISO();
    const next = nextLessonFor(date);
    const rest = lessonsOn(date).filter(l => l !== next);
    let html = `<div class="${initial ? 'stagger' : ''}">`;
    html += `<h2 class="label t-lm" style="--i:0">${isToday ? 'Ближайшее занятие' : longDate(date)}</h2>`;
    if (next) {
      const yes = next.studentIds.filter(id => next.rsvp && next.rsvp[id] === 'yes').length;
      const no = next.studentIds.filter(id => next.rsvp && next.rsvp[id] === 'no').length;
      const none = next.studentIds.length - yes - no;
      const href = next.record ? `#/done/${next.id}` : `#/lesson/${next.id}`;
      html += `<div class="next" style="--i:1">
        <div class="next-inner">
          <div class="next-time t-lr tnum">${next.start}–${next.end}</div>
          <div class="next-title t-h3">${esc(next.title)}</div>
          <div class="next-meta t-meta"><span>${esc(next.room || '')}</span><span>${next.studentIds.length} ${plural(next.studentIds.length, 'ученик', 'ученика', 'учеников')}</span>${next.record ? '<span class="chip ok">Учтено</span>' : ''}</div>
          <div class="rsvp tnum"><div><b>${yes}</b><span>Будут</span></div><div><b>${no}</b><span>Не будут</span></div><div><b>${none}</b><span>Без ответа</span></div></div>
        </div>
        <a class="next-go" href="${href}">${next.record ? 'Открыть итог' : 'Перейти к занятию'}<span class="arrow">${I.arrow}</span></a>
      </div>`;
    } else {
      html += `<div class="next" style="--i:1"><div class="next-inner next-empty">
        <div class="next-title t-h3">Занятий нет</div>
        <p>Можно добавить занятие на этот день</p>
        <a class="btn" href="#/edit/new?date=${date}">Добавить занятие</a>
      </div></div>`;
    }
    if (rest.length) {
      html += `<div class="sheet-panel" style="--i:2">
        <div class="sec-head"><h2 class="t-lm">${isToday ? 'Занятия сегодня' : 'Другие занятия'}</h2><span class="badge tnum">${rest.length}</span></div>
        <div class="lrows">${rest.map((l, i) => lessonRow(l, i)).join('')}</div>
      </div>`;
    }
    html += '</div>';
    dayBox.innerHTML = html;
    typo(dayBox);
  }

  const strip = weekStrip(ui.date, d => switchDay(dayBox, () => fillDay(d)));
  $('[data-strip]', el).replaceWith(strip);
  fillDay(ui.date, !booted);
  return { el, mounted: () => { const s = $('.day.sel', strip); s && centerDay(strip, s, false); } };
};

function switchDay(box, fill) {
  if (reduceMotion()) { fill(); return; }
  box.classList.add('out');
  setTimeout(() => { fill(); requestAnimationFrame(() => box.classList.remove('out')); }, 140);
}

SCREENS.schedule = () => {
  const el = h(`<section class="screen tab-screen has-grad">
    <div class="screen-bg"></div>
    <div class="scroll">
      <div class="pad" style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px">
        <button class="month-btn t-h3 press" data-month aria-haspopup="dialog" style="display:inline-flex;align-items:center;gap:4px"></button>
        <button class="chip press t-action" data-today style="height:36px;padding:0 12px">Сегодня</button>
      </div>
      <div data-strip></div>
      <div class="sheet-panel" style="margin-top:14px">
        <div data-day class="day-switch"></div>
      </div>
    </div>
  </section>`);
  const dayBox = $('[data-day]', el);
  const monthBtn = $('[data-month]', el);

  function fillDay(date, initial) {
    const d = parseISO(date);
    monthBtn.innerHTML = `${MONTHS[d.getMonth()]} ${d.getFullYear()} ${I.down}`;
    const list = lessonsOn(date);
    let html = `<div class="sec-head"><h2 class="t-h4">${dayMonth(date)}</h2>${list.length ? `<span class="badge tnum">${list.length}</span>` : ''}</div>`;
    if (list.length) {
      html += `<div class="lrows ${initial ? 'stagger' : ''}">${list.map((l, i) => lessonRow(l, i)).join('')}</div>`;
    } else {
      const nd = nearestDayWithLessons(date);
      const ndd = nd && parseISO(nd);
      html += `<div class="empty">
        <h3 class="t-lm">В этот день занятий нет</h3>
        <p class="t-mr">${nd ? `Ближайшее — ${WD_ACC[ndd.getDay()]}, ${dayMonth(nd)}` : 'Добавьте занятие через «+»'}</p>
        ${nd ? `<button class="btn secondary" data-jump="${nd}">Открыть ${dayMonth(nd)}</button>` : `<a class="btn secondary" href="#/edit/new?date=${date}">Добавить занятие</a>`}
      </div>`;
    }
    dayBox.innerHTML = html;
    typo(dayBox);
  }

  let strip;
  function setDate(dd, rebuildStrip) {
    ui.date = dd;
    if (rebuildStrip) {
      const ns = weekStrip(ui.date, d => switchDay(dayBox, () => fillDay(d)));
      strip.replaceWith(ns); strip = ns;
      requestAnimationFrame(() => { const s = $('.day.sel', strip); s && centerDay(strip, s, false); });
    }
    switchDay(dayBox, () => fillDay(dd));
  }
  strip = weekStrip(ui.date, d => switchDay(dayBox, () => fillDay(d)));
  $('[data-strip]', el).replaceWith(strip);
  fillDay(ui.date, !booted);

  dayBox.addEventListener('click', e => {
    const j = e.target.closest('[data-jump]');
    if (j) setDate(j.dataset.jump, true);
  });
  $('[data-today]', el).addEventListener('click', () => setDate(todayISO(), true));
  monthBtn.addEventListener('click', () => openMonthSheet(ui.date, d => setDate(d, true)));

  return { el, mounted: () => { const s = $('.day.sel', strip); s && centerDay(strip, s, false); } };
};

/* lesson attendance */
function getDraft(l) {
  if (!ui.drafts[l.id]) {
    ui.drafts[l.id] = l.record
      ? { attended: new Set(l.record.attended), billing: JSON.parse(JSON.stringify(l.record.billing || {})) }
      : { attended: new Set(), billing: {} };
  }
  return ui.drafts[l.id];
}
const needsChoice = (l, sid, draft) => {
  const b = draft.billing[sid];
  return draft.attended.has(sid) && !b;
};

function lessonHero(l) {
  return `<div class="hero">
    <small>${longDate(l.date)}</small>
    <h2 class="t-h3">${esc(l.title)}</h2>
    <div class="meta tnum"><span>${l.start}–${l.end}</span><span>${esc(l.room || '')}</span></div>
  </div>`;
}

// shortcuts: #/lesson/next opens today's upcoming lesson, #/done/last the latest recorded one
const resolveLesson = id => {
  if (id === 'next') return nextLessonFor(todayISO()) || db.lessons.find(l => l.date >= todayISO() && !l.record);
  if (id === 'last') return db.lessons.filter(l => l.record).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))[0];
  return lesson(id);
};

SCREENS.lesson = r => {
  const l = resolveLesson(r.id);
  if (!l) { replace('#/schedule'); return null; }
  const draft = getDraft(l);
  // students list for this lesson: current members plus anyone recorded earlier
  const sids = Array.from(new Set([...l.studentIds, ...draft.attended]));
  const total = sids.length;

  const el = h(`<section class="screen has-grad">
    <div class="screen-bg"></div>
    <div class="scroll">
      <header class="topbar">
        <button class="icon-btn" data-back aria-label="Назад">${I.back}</button>
        <h1 class="t-h3">Занятие</h1>
        <a class="icon-btn" href="#/edit/${l.id}" aria-label="Изменить занятие">${I.edit}</a>
      </header>
      ${lessonHero(l)}
      <section class="panel lesson-panel">
        <div class="att-head"><h2 class="t-h2">Пришли <span class="roll tnum" data-count><span>${draft.attended.size}</span></span> из ${total}</h2><button class="link-btn" data-reset ${draft.attended.size ? '' : 'hidden'}>Сбросить</button></div>
        ${total <= 14 ? `<div class="dots" aria-hidden="true">${sids.map(() => '<i></i>').join('')}</div>` : '<div class="bar" aria-hidden="true"><i></i></div>'}
        ${total ? '' : `<div class="empty"><h3 class="t-lm">В занятии пока нет учеников</h3><p>Добавьте их в настройках занятия</p><a class="btn" href="#/edit/${l.id}">Добавить учеников</a></div>`}
        <ul class="att-list"></ul>
      </section>
    </div>
    <footer class="dock">
      <div class="dock-sum" aria-live="polite"></div>
      <button class="btn" data-main></button>
    </footer>
  </section>`);

  const list = $('.att-list', el);
  sids.forEach((sid, i) => {
    const s = student(sid);
    const li = h(`<li class="att-row" data-sid="${sid}" style="--i:${i}" role="checkbox" tabindex="0">
      <span class="avatar">${esc(initials(s ? s.name : '?'))}</span>
      <div class="att-main"><div class="att-name">${esc(s ? s.name : 'Удалённый ученик')}</div><div class="att-sub"></div></div>
      <span class="check">${I.check}</span>
    </li>`);
    list.appendChild(li);
  });

  function subFor(sid) {
    const s = student(sid);
    const on = draft.attended.has(sid);
    const b = draft.billing[sid];
    if (!on) return `<span>${esc(studentStatus(s, l.date))}</span>`;
    if (!b) return `<button class="chip status" data-bill="${sid}">Выбрать учёт ${I.chev}</button>`;
    if (b.kind === 'sub') {
      const applied = l.record && (l.record.effects || []).some(e => e.sid === sid && e.t === 'sub');
      const left = s && s.plan ? (applied ? s.plan.left : s.plan.left - 1) : 0;
      return `<span>Абонемент, останется ${Math.max(0, left)}</span>`;
    }
    if (b.kind === 'single') {
      if (b.pay === 'later') return `<button class="chip warn" data-bill="${sid}">К оплате ${money(PRICE_SINGLE)} ${I.chev}</button>`;
      return `<button class="sub-link" data-bill="${sid}">Разовое, ${b.pay === 'cash' ? 'наличные' : 'перевод'} ${I.chev}</button>`;
    }
    if (b.kind === 'newsub') return `<button class="sub-link" data-bill="${sid}">Новый абонемент, ${b.pay === 'cash' ? 'наличные' : 'перевод'} ${I.chev}</button>`;
    return '';
  }

  function updateRow(sid, animate) {
    const li = $(`.att-row[data-sid="${sid}"]`, list);
    if (!li) return;
    const on = draft.attended.has(sid);
    li.classList.toggle('on', on);
    li.setAttribute('aria-checked', on);
    const sub = $('.att-sub', li);
    sub.innerHTML = subFor(sid);
    typo(sub);
    if (animate) { li.classList.remove('flash'); void li.offsetWidth; }
  }

  let lastCount = draft.attended.size;
  function updateTop() {
    const n = draft.attended.size;
    const c = $('[data-count]', el);
    if (n !== lastCount) {
      c.innerHTML = `<span class="${n > lastCount ? 'up' : ''}">${n}</span>`;
      lastCount = n;
    }
    $('[data-reset]', el).hidden = n === 0;
    const dots = $$('.dots i', el);
    dots.forEach((d, i) => {
      const was = d.classList.contains('on');
      const on = i < n;
      d.classList.toggle('on', on);
      if (on && !was) { d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse'); }
    });
    const bar = $('.bar i', el);
    if (bar) bar.style.transform = `scaleX(${total ? n / total : 0})`;
  }

  const mainBtn = $('[data-main]', el);
  const sumBox = $('.dock-sum', el);
  let lastSum = '';
  function updateDock() {
    const unresolved = [...draft.attended].filter(sid => needsChoice(l, sid, draft));
    const s = summarize(l, draft);
    let b = '', sp = '';
    const parts = [];
    if (s.sub) parts.push(`${s.sub} по абонементу`);
    if (s.single) parts.push(`${s.single} ${plural(s.single, 'разовое', 'разовых', 'разовых')}`);
    if (s.newsub) parts.push(`${s.newsub} ${plural(s.newsub, 'новый абонемент', 'новых абонемента', 'новых абонементов')}`);
    if (unresolved.length) {
      b = `Выберите учёт для ${unresolved.length} ${plural(unresolved.length, 'ученика', 'учеников', 'учеников')}`;
      sp = parts.join(', ');
    } else if (draft.attended.size === 0) {
      b = 'Никто не пришёл'; sp = 'Списаний не будет';
    } else {
      b = parts.join(', ');
      const m = [];
      if (s.paid) m.push(`получено ${money(s.paid)}`);
      if (s.expected) m.push(`ожидается ${money(s.expected)}`);
      sp = m.length ? m.join(', ').replace(/^./, c => c.toUpperCase()) : 'Без оплат';
    }
    const html = `<div class="swap-in"><b>${b}</b>${sp ? `<span>${sp}</span>` : ''}</div>`;
    if (html !== lastSum) { sumBox.innerHTML = html; typo(sumBox); lastSum = html; }
    mainBtn.innerHTML = `<span class="btn-label">${unresolved.length ? 'Выбрать учёт' : (l.record ? 'Сохранить изменения' : 'Сохранить занятие')}</span>`;
    mainBtn.dataset.mode = unresolved.length ? 'choose' : 'save';
    mainBtn.disabled = total === 0;
  }

  function toggle(sid) {
    const s = student(sid);
    if (draft.attended.has(sid)) {
      draft.attended.delete(sid);
      delete draft.billing[sid];
    } else {
      draft.attended.add(sid);
      const prev = l.record && l.record.billing && l.record.billing[sid];
      if (prev) draft.billing[sid] = { ...prev };
      else if (hasActiveSub(s, l.date)) draft.billing[sid] = { kind: 'sub' };
    }
    haptic();
    updateRow(sid);
    updateTop();
    updateDock();
  }

  sids.forEach(sid => updateRow(sid));
  updateTop();
  updateDock();

  list.addEventListener('click', e => {
    const bill = e.target.closest('[data-bill]');
    if (bill) { e.stopPropagation(); openBilling(l, bill.dataset.bill, draft, done); return; }
    const row = e.target.closest('.att-row');
    if (row) toggle(row.dataset.sid);
  });
  list.addEventListener('keydown', e => {
    if ((e.key === ' ' || e.key === 'Enter') && e.target.classList.contains('att-row')) { e.preventDefault(); toggle(e.target.dataset.sid); }
  });
  function done(sid) {
    updateRow(sid);
    const li = $(`.att-row[data-sid="${sid}"]`, list);
    if (li && !reduceMotion()) { li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash'); }
    updateDock();
  }

  $('[data-reset]', el).addEventListener('click', () => {
    const prevAtt = new Set(draft.attended), prevBill = { ...draft.billing };
    draft.attended.clear(); draft.billing = {};
    sids.forEach(sid => updateRow(sid)); updateTop(); updateDock();
    toast('Отметки сброшены', 'Вернуть', () => {
      draft.attended = prevAtt; draft.billing = prevBill;
      sids.forEach(sid => updateRow(sid)); updateTop(); updateDock();
    });
  });
  $('[data-back]', el).addEventListener('click', () => back('#/schedule'));

  mainBtn.addEventListener('click', () => {
    if (mainBtn.dataset.mode === 'choose') {
      const first = [...draft.attended].find(sid => needsChoice(l, sid, draft));
      if (first) openBilling(l, first, draft, done);
      return;
    }
    mainBtn.disabled = true;
    mainBtn.classList.add('swap');
    setTimeout(() => { mainBtn.innerHTML = `${I.spin}<span class="btn-label">Сохраняем…</span>`; mainBtn.classList.remove('swap'); }, 120);
    setTimeout(() => {
      applyRecord(l, draft);
      haptic([10, 50, 14]);
      delete ui.drafts[l.id];
      replace(`#/done/${l.id}`);
    }, 1000);
  });

  return { el };
};

SCREENS.done = r => {
  const l = resolveLesson(r.id);
  if (!l) { replace('#/schedule'); return null; }
  if (!l.record) { replace(`#/lesson/${l.id}`); return null; }
  const rec = l.record;
  const draft = { attended: new Set(rec.attended), billing: rec.billing };
  const s = summarize(l, draft);
  const total = Array.from(new Set([...l.studentIds, ...rec.attended])).length;
  const n = rec.attended.length;
  const per = false && rec.attended.map(sid => {
    const st = student(sid); const b = rec.billing[sid] || {};
    let t = '';
    if (b.kind === 'sub') t = st && st.plan ? `Списано 1 занятие, ${plural(st.plan.left, 'остался', 'осталось', 'осталось')} ${st.plan.left}` : 'Списано 1 занятие';
    else if (b.kind === 'single') t = b.pay === 'later' ? `Разовое, к оплате ${money(PRICE_SINGLE)}` : `Разовое, ${b.pay === 'cash' ? 'наличные' : 'перевод'}`;
    else if (b.kind === 'newsub') t = `Новый абонемент, ${b.pay === 'cash' ? 'наличные' : 'перевод'}`;
    return `<li><b>${esc(st ? st.name : 'Удалённый ученик')}</b><span>${t}</span></li>`;
  }).join('');

  const el = h(`<section class="screen has-grad">
    <div class="screen-bg"></div>
    <div class="scroll">
      <header class="topbar">
        <button class="icon-btn" data-back aria-label="Назад">${I.back}</button>
        <h1 class="t-h3">Занятие</h1>
      </header>
      ${lessonHero(l)}
      <section class="panel done-panel">
        <div class="done-icon">${I.check}</div>
        <h2 class="done-title t-h2">${n ? 'Занятие учтено' : 'Посещаемость сохранена'}</h2>
        <p class="done-sub t-meta">Пришли ${n} из ${total}</p>
        <div class="kv tnum">
          <div style="--i:0"><span>Абонемент</span><b>${s.sub} ${plural(s.sub, 'занятие', 'занятия', 'занятий')}</b></div>
          ${s.newsub ? `<div style="--i:1"><span>Новые абонементы</span><b>${s.newsub}</b></div>` : ''}
          <div style="--i:2"><span>Получено</span><b>${money(s.paid)}</b></div>
          <div style="--i:3"><span>К оплате</span><b>${money(s.expected)}</b></div>
        </div>
        ${n ? '' : '<p class="done-sub t-mr" style="margin-top:24px">Абонементы и оплаты не изменились</p>'}
      </section>
    </div>
    <footer class="dock">
      <button class="btn secondary" data-edit>Редактировать</button>
      <a class="btn" href="#/schedule">К занятиям</a>
    </footer>
  </section>`);
  $('[data-back]', el).addEventListener('click', () => back('#/schedule'));
  $('[data-edit]', el).addEventListener('click', () => replace(`#/lesson/${l.id}`));
  return { el };
};

/* ---------- students ---------- */
SCREENS.students = () => {
  const el = h(`<section class="screen tab-screen has-grad">
    <div class="screen-bg" style="height:260px"></div>
    <div class="scroll">
      <h1 class="page-title t-h1">Ученики</h1>
      <label class="search"><span class="sr">Поиск</span>${I.search}<input type="search" placeholder="Имя ученика" autocomplete="off" value="${esc(ui.studentQuery)}"></label>
      <div class="sheet-panel" style="margin-top:14px;padding-top:12px">
        <ul class="srows"></ul>
        <div class="foot-note"><button class="btn ghost" data-reset style="color:var(--muted);font-size:14px;width:auto;margin:0 auto">Сбросить демо-данные</button></div>
      </div>
    </div>
  </section>`);
  const listEl = $('.srows', el);
  function fill(initial) {
    const q = ui.studentQuery.trim().toLowerCase();
    const list = db.students.filter(s => !q || s.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    if (!list.length) {
      listEl.innerHTML = db.students.length
        ? `<li class="empty"><h3 class="t-lm">Никого не нашли</h3><p>Проверьте написание или добавьте ученика</p><a class="btn" href="#/student/new">Добавить ученика</a></li>`
        : `<li class="empty"><h3 class="t-lm">Учеников пока нет</h3><p>Добавьте первого ученика</p><a class="btn" href="#/student/new">Добавить ученика</a></li>`;
    } else {
      listEl.innerHTML = list.map((s, i) => {
        const debt = unpaidOf(s.id).reduce((a, p) => a + p.amount, 0);
        let status = studentStatus(s, todayISO());
        if (hasActiveSub(s, todayISO())) status += `, до ${dayMonth(s.plan.until)}`;
        return `<li style="--i:${Math.min(i, 12)}"><a class="srow" href="#/student/${s.id}">
          <span class="avatar">${esc(initials(s.name))}</span>
          <div class="att-main"><div class="att-name">${esc(s.name)}</div><div class="att-sub"><span>${status}</span></div>${debt ? `<span class="chip warn">К оплате ${money(debt)}</span>` : ''}</div>
          ${I.chev}</a></li>`;
      }).join('');
    }
    listEl.classList.toggle('stagger', !!initial);
    typo(listEl);
  }
  fill(!booted);
  $('input', el).addEventListener('input', e => { ui.studentQuery = e.target.value; fill(false); });
  const rb = $('[data-reset]', el);
  let armed = false;
  rb.addEventListener('click', () => {
    if (!armed) { armed = true; rb.textContent = 'Нажмите ещё раз, чтобы сбросить всё'; setTimeout(() => { armed = false; rb.textContent = 'Сбросить демо-данные'; }, 3000); return; }
    db = seed(); save(); ui.drafts = {}; ui.date = todayISO();
    fill(true);
    toast('Демо-данные восстановлены');
  });
  return { el };
};

SCREENS.student = r => {
  const isNew = r.id === 'new';
  const s0 = isNew ? { id: uid(), name: '', phone: '', plan: null } : student(r.id);
  if (!s0) { replace('#/students'); return null; }
  const st = JSON.parse(JSON.stringify(s0));
  const titles = groupTitles();
  const today = todayISO();
  const inGroup = t => db.lessons.some(l => l.title === t && l.date >= today && l.studentIds.includes(st.id));
  const groupsSel = new Set(isNew ? [] : titles.filter(inGroup));
  let planOn = !!st.plan;
  let left = st.plan ? st.plan.left : SUB_COUNT;
  let until = st.plan ? st.plan.until : addDays(today, SUB_DAYS);

  const el = h(`<section class="screen">
    <div class="scroll">
      <header class="topbar">
        <button class="icon-btn" data-back aria-label="Назад">${I.back}</button>
        <h1 class="t-h3">${isNew ? 'Новый ученик' : 'Ученик'}</h1>
      </header>
      <form class="form" novalidate>
        <label class="field" data-f="name"><span>Имя и фамилия</span><input name="name" autocomplete="off" value="${esc(st.name)}" placeholder="Например, Анна Сергеева" maxlength="60"></label>
        <label class="field"><span>Телефон или Telegram</span><input name="phone" autocomplete="off" inputmode="text" value="${esc(st.phone || '')}" placeholder="Необязательно" maxlength="40"></label>
        <div class="field"><span>Абонемент</span>
          <div class="seg" data-v="${planOn ? 1 : 0}" role="radiogroup"><span class="seg-ind"></span><button type="button" data-seg="0" role="radio">Нет</button><button type="button" data-seg="1" role="radio">Есть</button></div>
        </div>
        <div class="collapse ${planOn ? '' : 'closed'}" data-plan><div>
          <div class="row2">
            <div class="field"><span>Осталось занятий</span><div class="stepper"><button type="button" data-step="-1" aria-label="Меньше">${I.minus}</button><output class="tnum" data-left>${left}</output><button type="button" data-step="1" aria-label="Больше">${I.plus}</button></div></div>
            <label class="field"><span>Действует до</span><input type="date" name="until" value="${until}"></label>
          </div>
        </div></div>
        ${titles.length ? `<div class="field"><span>Группы</span><div class="group-chips">${titles.map(t => `<button type="button" class="gchip ${groupsSel.has(t) ? 'on' : ''}" data-g="${esc(t)}" aria-pressed="${groupsSel.has(t)}">${esc(t)}</button>`).join('')}</div><span class="hint">Изменения применятся к будущим занятиям группы</span></div>` : ''}
        ${!isNew ? `<div class="field" data-pays><span>Ожидаемые оплаты</span><div class="pay-list"></div></div>` : ''}
        ${!isNew ? '<button type="button" class="btn danger" data-del>Удалить ученика</button>' : ''}
      </form>
    </div>
    <footer class="dock"><button class="btn" data-save>${isNew ? 'Добавить ученика' : 'Сохранить'}</button></footer>
  </section>`);

  const form = $('form', el);
  const seg = $('.seg', el);
  seg.addEventListener('click', e => {
    const b = e.target.closest('[data-seg]'); if (!b) return;
    planOn = b.dataset.seg === '1';
    seg.dataset.v = planOn ? 1 : 0;
    $('[data-plan]', el).classList.toggle('closed', !planOn);
  });
  el.addEventListener('click', e => {
    const sb = e.target.closest('[data-step]');
    if (sb) { left = Math.max(0, Math.min(99, left + Number(sb.dataset.step))); $('[data-left]', el).textContent = left; }
    const g = e.target.closest('[data-g]');
    if (g) { const t = g.dataset.g; groupsSel.has(t) ? groupsSel.delete(t) : groupsSel.add(t); g.classList.toggle('on'); g.setAttribute('aria-pressed', groupsSel.has(t)); }
  });

  function fillPays() {
    const box = $('[data-pays]', el); if (!box) return;
    const pays = unpaidOf(st.id);
    if (!pays.length) { box.style.display = 'none'; return; }
    $('.pay-list', box).innerHTML = pays.map(p => `<div class="pay-item" data-p="${p.id}"><div><b>${money(p.amount)}</b><span>${esc(p.what)}, ${dayMonth(p.date)}</span></div><button type="button" data-paid="${p.id}">Получено</button></div>`).join('');
    typo(box);
  }
  fillPays();
  el.addEventListener('click', e => {
    const pb = e.target.closest('[data-paid]'); if (!pb) return;
    const p = db.payments.find(x => x.id === pb.dataset.paid); if (!p) return;
    p.status = 'paid'; p.method = 'cash'; save();
    const item = pb.closest('.pay-item'); item.classList.add('leaving');
    setTimeout(fillPays, 280);
    toast(`Оплата ${money(p.amount)} отмечена`, 'Отменить', () => { p.status = 'expected'; p.method = 'later'; save(); fillPays(); const box = $('[data-pays]', el); if (box) box.style.display = ''; });
  });

  $('[data-back]', el).addEventListener('click', () => back('#/students'));

  $('[data-save]', el).addEventListener('click', () => {
    const name = form.name.value.trim().replace(/\s+/g, ' ');
    const f = $('[data-f="name"]', el);
    $('.err-text', f)?.remove();
    if (!name) {
      f.classList.add('err');
      f.appendChild(h('<span class="err-text">Введите имя</span>'));
      form.name.focus();
      return;
    }
    f.classList.remove('err');
    st.name = name;
    st.phone = form.phone.value.trim();
    st.plan = planOn ? { left, total: Math.max(left, (s0.plan && s0.plan.total) || SUB_COUNT), until: form.until.value || addDays(today, SUB_DAYS) } : null;
    if (isNew) db.students.push(st);
    else Object.assign(s0, st);
    // groups → future lessons
    for (const l of db.lessons) {
      if (l.date < today) continue;
      const want = groupsSel.has(l.title);
      const has = l.studentIds.includes(st.id);
      if (want && !has) l.studentIds.push(st.id);
      if (!want && has && titles.includes(l.title)) l.studentIds = l.studentIds.filter(x => x !== st.id);
    }
    save();
    toast(isNew ? 'Ученик добавлен' : 'Изменения сохранены');
    back('#/students');
  });

  const del = $('[data-del]', el);
  if (del) {
    let armed = false;
    del.addEventListener('click', () => {
      if (!armed) { armed = true; del.textContent = 'Нажмите ещё раз, чтобы удалить'; setTimeout(() => { if (del.isConnected) { armed = false; del.textContent = 'Удалить ученика'; } }, 3000); return; }
      const snapshot = JSON.stringify(db);
      db.students = db.students.filter(x => x.id !== s0.id);
      db.lessons.forEach(l => { l.studentIds = l.studentIds.filter(x => x !== s0.id); });
      save();
      back('#/students');
      setTimeout(() => toast(`${s0.name} удалён из списка`, 'Вернуть', () => { db = JSON.parse(snapshot); save(); rerender(); }), 200);
    });
  }
  return { el, mounted: () => { if (isNew) setTimeout(() => form.name.focus({ preventScroll: true }), 450); } };
};

/* ---------- lesson editor ---------- */
SCREENS.edit = r => {
  const isNew = r.id === 'new';
  const l0 = isNew ? null : lesson(r.id);
  if (!isNew && !l0) { replace('#/schedule'); return null; }
  const base = l0 || { title: '', date: r.q.date || ui.date, start: '18:00', end: '19:00', room: '', studentIds: [] };
  const sel = new Set(base.studentIds);
  let repeat = false;
  const titles = groupTitles();

  const el = h(`<section class="screen">
    <div class="scroll">
      <header class="topbar">
        <button class="icon-btn" data-back aria-label="Назад">${I.back}</button>
        <h1 class="t-h3">${isNew ? 'Новое занятие' : 'Изменить занятие'}</h1>
      </header>
      <form class="form" novalidate>
        <label class="field" data-f="title"><span>Название</span><input name="title" list="titles" autocomplete="off" value="${esc(base.title)}" placeholder="Например, Группа BASIC" maxlength="50"></label>
        <datalist id="titles">${titles.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
        <label class="field"><span>Дата</span><input type="date" name="date" value="${base.date}"></label>
        <div class="row2">
          <label class="field"><span>Начало</span><input type="time" name="start" value="${base.start}"></label>
          <label class="field" data-f="end"><span>Конец</span><input type="time" name="end" value="${base.end}"></label>
        </div>
        <label class="field"><span>Зал</span><input name="room" list="rooms" autocomplete="off" value="${esc(base.room)}" placeholder="Например, Малый зал" maxlength="40"></label>
        <datalist id="rooms">${Array.from(new Set(db.lessons.map(l => l.room).filter(Boolean))).map(t => `<option value="${esc(t)}">`).join('')}</datalist>
        ${isNew ? `<div class="toggle-row"><span>Повторять каждую неделю<br><span class="hint" style="padding:0">8 недель вперёд</span></span><button type="button" class="switch" role="switch" aria-checked="false" data-repeat aria-label="Повторять каждую неделю"></button></div>` : ''}
        <div class="field"><span data-cnt></span>
          <label class="search" style="margin:0 0 6px;background:var(--surface-2)"><span class="sr">Поиск учеников</span>${I.search}<input type="search" data-q placeholder="Найти ученика" autocomplete="off"></label>
          <div class="pick-list" role="group"></div>
          ${isNew ? '' : '<span class="hint">Изменится только это занятие</span>'}
        </div>
        ${!isNew ? '<button type="button" class="btn danger" data-del>Удалить занятие</button>' : ''}
      </form>
    </div>
    <footer class="dock"><button class="btn" data-save>${isNew ? 'Добавить занятие' : 'Сохранить'}</button></footer>
  </section>`);

  const form = $('form', el);
  const pick = $('.pick-list', el);
  function fillPick() {
    const q = ($('[data-q]', el).value || '').trim().toLowerCase();
    const list = db.students.filter(s => !q || s.name.toLowerCase().includes(q)).sort((a, b) => (sel.has(b.id) - sel.has(a.id)) || a.name.localeCompare(b.name, 'ru'));
    pick.innerHTML = list.length ? list.map(s => `<div class="pick ${sel.has(s.id) ? 'on' : ''}" data-s="${s.id}" role="checkbox" aria-checked="${sel.has(s.id)}" tabindex="0"><span class="avatar">${esc(initials(s.name))}</span><span class="n">${esc(s.name)}</span><span class="check">${I.check}</span></div>`).join('')
      : '<div class="hint" style="padding:14px">Никого не нашли</div>';
    updCnt();
  }
  function updCnt() { $('[data-cnt]', el).textContent = `Ученики, выбрано ${sel.size}`; }
  fillPick();
  $('[data-q]', el).addEventListener('input', fillPick);
  pick.addEventListener('click', e => {
    const p = e.target.closest('.pick'); if (!p) return;
    const id = p.dataset.s;
    sel.has(id) ? sel.delete(id) : sel.add(id);
    p.classList.toggle('on', sel.has(id)); p.setAttribute('aria-checked', sel.has(id));
    updCnt();
  });
  pick.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && e.target.classList.contains('pick')) { e.preventDefault(); e.target.click(); } });

  const rep = $('[data-repeat]', el);
  rep && rep.addEventListener('click', () => { repeat = !repeat; rep.setAttribute('aria-checked', repeat); });

  // keep end after start when start changes
  form.start.addEventListener('change', () => {
    if (form.end.value && toMin(form.end.value) <= toMin(form.start.value)) {
      const m = toMin(form.start.value) + 60; form.end.value = `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
    }
  });

  $('[data-back]', el).addEventListener('click', () => back('#/schedule'));

  $('[data-save]', el).addEventListener('click', () => {
    $$('.err-text', el).forEach(x => x.remove()); $$('.field.err', el).forEach(x => x.classList.remove('err'));
    const title = form.title.value.trim();
    let bad = false;
    if (!title) { const f = $('[data-f="title"]', el); f.classList.add('err'); f.appendChild(h('<span class="err-text">Введите название</span>')); bad = true; }
    if (!form.start.value || !form.end.value || toMin(form.end.value) <= toMin(form.start.value)) { const f = $('[data-f="end"]', el); f.classList.add('err'); f.appendChild(h('<span class="err-text">Позже начала</span>')); bad = true; }
    if (!form.date.value) bad = true;
    if (bad) return;
    const data = { title, date: form.date.value, start: form.start.value, end: form.end.value, room: form.room.value.trim(), studentIds: [...sel] };
    if (isNew) {
      const n = repeat ? 8 : 1;
      for (let i = 0; i < n; i++) db.lessons.push({ id: uid(), ...data, studentIds: [...sel], date: addDays(data.date, i * 7), rsvp: {}, record: null });
      ui.date = data.date;
      save();
      toast(n > 1 ? `Добавлено ${n} ${plural(n, 'занятие', 'занятия', 'занятий')}` : 'Занятие добавлено');
      back('#/schedule');
    } else {
      Object.assign(l0, data);
      ui.date = data.date;
      save();
      toast('Занятие обновлено');
      back('#/schedule');
    }
  });

  const del = $('[data-del]', el);
  if (del) {
    let armed = false;
    del.addEventListener('click', () => {
      if (!armed) { armed = true; del.textContent = l0.record ? 'Учёт тоже отменится, нажмите ещё раз' : 'Нажмите ещё раз, чтобы удалить'; setTimeout(() => { if (del.isConnected) { armed = false; del.textContent = 'Удалить занятие'; } }, 3000); return; }
      const snapshot = JSON.stringify(db);
      revertRecord(l0);
      db.lessons = db.lessons.filter(x => x.id !== l0.id);
      delete ui.drafts[l0.id];
      save();
      ui.date = l0.date;
      stack.length = 0;
      go('#/schedule');
      setTimeout(() => toast('Занятие удалено', 'Вернуть', () => { db = JSON.parse(snapshot); save(); rerender(); }), 200);
    });
  }
  return { el, mounted: () => { if (isNew) setTimeout(() => form.title.focus({ preventScroll: true }), 450); } };
};

function rerender() {
  if (!current) return;
  const r = current.route;
  const screen = (SCREENS[r.name] || SCREENS.home)(r);
  if (!screen) return;
  typo(screen.el);
  const old = current.el;
  app.appendChild(screen.el);
  old.remove();
  current = { el: screen.el, route: r };
  screen.mounted && screen.mounted();
}

/* ---------- sheet ---------- */
const sheetRoot = $('#sheetRoot');
let activeSheet = null;

function openSheet(firstPage) {
  if (activeSheet) activeSheet.close(true);
  const bd = h('<div class="backdrop"></div>');
  const sh = h(`<div class="sheet" role="dialog" aria-modal="true" tabindex="-1"><div class="grab"><i></i><i class="off"></i></div><div class="sheet-viewport"></div></div>`);
  sheetRoot.append(bd, sh);
  const vp = $('.sheet-viewport', sh);
  const pages = [];
  const prevFocus = document.activeElement;
  let closed = false;

  const api = {
    push(pageFn) { show(pageFn, 'fwd'); pages.push(pageFn); setGrab(); },
    pop() { if (pages.length < 2) return api.close(); pages.pop(); show(pages[pages.length - 1], 'back'); setGrab(); },
    depth: () => pages.length,
    close(instant) {
      if (closed) return; closed = true;
      document.removeEventListener('keydown', onKey);
      activeSheet = null;
      if (instant) { bd.remove(); sh.remove(); return; }
      sh.classList.remove('show'); sh.style.transform = '';
      bd.classList.remove('show');
      setTimeout(() => { bd.remove(); sh.remove(); }, 450);
      prevFocus && prevFocus.focus && prevFocus.focus({ preventScroll: true });
    }
  };

  function show(pageFn, dir) {
    const oldPage = vp.firstElementChild;
    const page = h('<div class="sheet-page"></div>');
    page.appendChild(pageFn(api));
    typo(page);
    const isFirst = !oldPage;
    if (isFirst) { vp.appendChild(page); return; }
    const h0 = vp.offsetHeight;
    vp.appendChild(page);
    oldPage.classList.add(dir === 'fwd' ? 'out-fwd' : 'out-back');
    page.classList.add(dir === 'fwd' ? 'in-fwd' : 'in-back');
    const h1 = page.offsetHeight;
    vp.style.height = h0 + 'px';
    requestAnimationFrame(() => { vp.style.height = h1 + 'px'; });
    setTimeout(() => { oldPage.remove(); page.classList.remove('in-fwd', 'in-back'); vp.style.height = ''; }, 420);
  }
  function setGrab() {
    $$('.grab i', sh)[1].classList.toggle('off', pages.length < 2);
  }

  function onKey(e) { if (e.key === 'Escape') api.close(); }
  document.addEventListener('keydown', onKey);
  bd.addEventListener('click', () => api.close());

  // drag to dismiss
  let startY = 0, lastY = 0, lastT = 0, vel = 0, dragging = false;
  sh.addEventListener('pointerdown', e => {
    if (!e.target.closest('.grab, .sheet-head') || e.target.closest('button')) return;
    dragging = true; startY = lastY = e.clientY; lastT = performance.now(); vel = 0;
    sh.classList.add('dragging');
    sh.setPointerCapture(e.pointerId);
  });
  sh.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    const now = performance.now();
    vel = (e.clientY - lastY) / Math.max(1, now - lastT);
    lastY = e.clientY; lastT = now;
    const y = dy > 0 ? dy : dy * 0.15; // rubber-band upward
    sh.style.transform = `translate(-50%, ${y}px)`;
    bd.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / 500));
  });
  const end = e => {
    if (!dragging) return;
    dragging = false;
    sh.classList.remove('dragging');
    const dy = e.clientY - startY;
    bd.style.opacity = '';
    if (dy > 120 || vel > 0.5) api.close();
    else sh.style.transform = '';
  };
  sh.addEventListener('pointerup', end);
  sh.addEventListener('pointercancel', end);

  pages.push(firstPage);
  show(firstPage, 'fwd');
  requestAnimationFrame(() => requestAnimationFrame(() => { bd.classList.add('show'); sh.classList.add('show'); }));
  setTimeout(() => sh.focus({ preventScroll: true }), 60);
  activeSheet = api;
  return api;
}

function sheetHead(title, api, withBack) {
  const head = h(`<div class="sheet-head">${withBack ? `<button class="icon-btn" data-sback aria-label="Назад">${I.back}</button>` : ''}<h3 class="t-h4">${title}</h3><button class="icon-btn" data-sclose aria-label="Закрыть">${I.close}</button></div>`);
  head.querySelector('[data-sclose]').addEventListener('click', () => api.close());
  const b = head.querySelector('[data-sback]');
  b && b.addEventListener('click', () => api.pop());
  return head;
}

/* billing flow */
function openBilling(l, sid, draft, onDone) {
  const s = student(sid);
  const cur = draft.billing[sid];
  const status = s && s.plan ? (s.plan.left <= 0 ? 'Абонемент закончился' : s.plan.until < l.date ? 'Срок абонемента истёк' : 'Есть абонемент') : 'Нет действующего абонемента';
  const canSub = hasActiveSub(s, l.date) || (cur && cur.kind === 'sub');

  const choose = api => {
    const wrap = document.createElement('div');
    wrap.appendChild(sheetHead('Учёт посещения', api, false));
    wrap.appendChild(h(`<div class="sheet-sub"><b>${esc(s ? s.name : '')}</b><span>${status}</span></div>`));
    const opts = h(`<div>
      ${canSub ? `<button class="opt" data-k="sub"><span class="ico">${I.card}</span><b>Списать с абонемента</b><span>${s.plan ? `Осталось ${s.plan.left}` : ''}</span></button>` : ''}
      <button class="opt" data-k="single"><span class="ico">${I.ticket}</span><b>Разовое занятие</b><span>${money(PRICE_SINGLE)}</span></button>
      <button class="opt" data-k="newsub"><span class="ico">${I.card}</span><b>Новый абонемент</b><span>${SUB_COUNT} занятий, ${money(SUB_PRICE)}</span></button>
    </div>`);
    opts.addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      if (b.dataset.k === 'sub') { draft.billing[sid] = { kind: 'sub' }; api.close(); onDone(sid); return; }
      api.push(b.dataset.k === 'single' ? single : newsub);
    });
    wrap.appendChild(opts);
    return wrap;
  };

  const single = api => {
    let pay = cur && cur.kind === 'single' ? cur.pay : 'cash';
    const wrap = document.createElement('div');
    wrap.appendChild(sheetHead('Разовое занятие', api, api.depth() >= 1));
    const body = h(`<div>
      <div class="sheet-sub" style="margin-bottom:0"><span>${esc(s ? s.name : '')}</span></div>
      <div class="amount t-display tnum">${money(PRICE_SINGLE)}</div>
      <div class="radios" role="radiogroup" style="margin-top:12px">
        <button class="radio" data-p="cash" role="radio"><span class="dot"></span><b>Наличные</b><span>Получено сейчас</span></button>
        <button class="radio" data-p="transfer" role="radio"><span class="dot"></span><b>Перевод</b><span>Получено сейчас</span></button>
        <div class="or">или</div>
        <button class="radio wide" data-p="later" role="radio"><span class="dot"></span><div><b>Ещё не оплачено</b><span>Останется в ожидаемых оплатах</span></div></button>
      </div>
      <div class="sheet-actions"><button class="btn" data-ok></button></div>
    </div>`);
    const upd = () => {
      $$('.radio', body).forEach(r => { r.classList.toggle('on', r.dataset.p === pay); r.setAttribute('aria-checked', r.dataset.p === pay); });
      const lbl = pay === 'cash' ? `Записать ${money(PRICE_SINGLE)} наличными` : pay === 'transfer' ? `Записать ${money(PRICE_SINGLE)} переводом` : 'Записать без оплаты';
      $('[data-ok]', body).innerHTML = `<span class="btn-label">${lbl}</span>`;
    };
    body.addEventListener('click', e => {
      const r = e.target.closest('[data-p]'); if (r) { pay = r.dataset.p; upd(); }
      if (e.target.closest('[data-ok]')) { draft.billing[sid] = { kind: 'single', pay }; api.close(); onDone(sid); }
    });
    upd();
    wrap.appendChild(body);
    return wrap;
  };

  const newsub = api => {
    let pay = cur && cur.kind === 'newsub' ? cur.pay : 'cash';
    const wrap = document.createElement('div');
    wrap.appendChild(sheetHead('Новый абонемент', api, api.depth() >= 1));
    const body = h(`<div>
      <div class="sheet-sub" style="margin-bottom:0"><span>${esc(s ? s.name : '')}</span></div>
      <div class="amount t-display tnum">${money(SUB_PRICE)}</div>
      <div class="amount-meta"><span class="chip soft">${SUB_COUNT} занятий</span><span class="chip soft">до ${dayMonth(addDays(l.date, SUB_DAYS))}</span></div>
      <div class="radios" role="radiogroup">
        <button class="radio" data-p="cash" role="radio"><span class="dot"></span><b>Наличные</b><span>Получено сейчас</span></button>
        <button class="radio" data-p="transfer" role="radio"><span class="dot"></span><b>Перевод</b><span>Получено сейчас</span></button>
      </div>
      <div class="sheet-actions"><button class="btn" data-ok>Оформить абонемент за ${money(SUB_PRICE)}</button></div>
    </div>`);
    const upd = () => $$('.radio', body).forEach(r => { r.classList.toggle('on', r.dataset.p === pay); r.setAttribute('aria-checked', r.dataset.p === pay); });
    body.addEventListener('click', e => {
      const r = e.target.closest('[data-p]'); if (r) { pay = r.dataset.p; upd(); }
      if (e.target.closest('[data-ok]')) { draft.billing[sid] = { kind: 'newsub', pay }; api.close(); onDone(sid); }
    });
    upd();
    wrap.appendChild(body);
    return wrap;
  };

  // open straight on the chosen method when editing
  const api = openSheet(choose);
  if (cur && cur.kind === 'single') api.push(single);
  else if (cur && cur.kind === 'newsub') api.push(newsub);
}

/* month sheet */
function openMonthSheet(date, onPick) {
  let view = parseISO(date); view.setDate(1);
  const page = api => {
    const wrap = document.createElement('div');
    const head = h(`<div class="sheet-head"><h3 class="t-h3" data-t></h3><button class="icon-btn" data-prev aria-label="Предыдущий месяц">${I.back}</button><button class="icon-btn" data-next aria-label="Следующий месяц" style="transform:scaleX(-1)">${I.back}</button><button class="icon-btn" data-sclose aria-label="Закрыть">${I.close}</button></div>`);
    const grid = h('<div class="mgrid"></div>');
    const legend = h('<div class="legend"><span><i></i>Есть занятия</span><span><i class="warn"></i>Не учтено</span></div>');
    function fill() {
      $('[data-t]', head).textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
      const first = new Date(view); const startWd = (first.getDay() + 6) % 7;
      const start = new Date(first); start.setDate(1 - startWd);
      let html = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(w => `<div class="wd">${w}</div>`).join('');
      const today = todayISO();
      for (let i = 0; i < 42; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const s = iso(d);
        const ls = db.lessons.filter(l => l.date === s);
        const warn = ls.some(isOverdue);
        const cls = ['mday'];
        if (d.getMonth() !== view.getMonth()) cls.push('other');
        if (s === today) cls.push('today');
        if (s === date) cls.push('sel');
        html += `<button class="${cls.join(' ')}" data-d="${s}" aria-label="${longDate(s)}">${d.getDate()}${ls.length ? `<i class="${warn ? 'warn' : ''}"></i>` : ''}</button>`;
      }
      grid.innerHTML = html;
    }
    fill();
    head.addEventListener('click', e => {
      if (e.target.closest('[data-prev]')) { view.setMonth(view.getMonth() - 1); fill(); }
      if (e.target.closest('[data-next]')) { view.setMonth(view.getMonth() + 1); fill(); }
      if (e.target.closest('[data-sclose]')) api.close();
    });
    grid.addEventListener('click', e => {
      const b = e.target.closest('[data-d]'); if (!b) return;
      date = b.dataset.d;
      $$('.mday', grid).forEach(x => x.classList.toggle('sel', x === b));
      setTimeout(() => { api.close(); onPick(date); }, 120);
    });
    wrap.append(head, grid, legend);
    wrap.style.paddingBottom = '8px';
    return wrap;
  };
  openSheet(page);
}

/* add menu */
function openAddSheet() {
  openSheet(api => {
    const wrap = document.createElement('div');
    wrap.appendChild(sheetHead('Добавить', api, false));
    const opts = h(`<div style="padding-top:6px">
      <button class="opt" data-a="lesson"><span class="ico">${I.cal}</span><b>Занятие</b><span>Разовое или каждую неделю</span></button>
      <button class="opt" data-a="student"><span class="ico">${I.person}</span><b>Ученик</b><span>С абонементом или без</span></button>
    </div>`);
    opts.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      api.close();
      setTimeout(() => go(b.dataset.a === 'lesson' ? `#/edit/new?date=${ui.date}` : '#/student/new'), 180);
    });
    wrap.appendChild(opts);
    return wrap;
  });
}

/* ---------- toast ---------- */
const toastRoot = $('#toastRoot');
function toast(text, actionLabel, action) {
  toastRoot.innerHTML = '';
  const t = h(`<div class="toast ${actionLabel ? '' : 'no-act'}" role="status"><span>${esc(text)}</span>${actionLabel ? `<button>${esc(actionLabel)}</button>` : ''}</div>`);
  typo(t);
  toastRoot.appendChild(t);
  let timer = setTimeout(hide, actionLabel ? 5000 : 2200);
  function hide() { clearTimeout(timer); t.classList.add('out'); setTimeout(() => t.remove(), 260); }
  t.addEventListener('pointerenter', () => clearTimeout(timer));
  t.addEventListener('pointerleave', () => { timer = setTimeout(hide, 2000); });
  const b = t.querySelector('button');
  b && b.addEventListener('click', () => { hide(); action && action(); });
}

/* ---------- boot ---------- */
$$('.nav-tab', nav).forEach(t => { t.innerHTML = I[{ home: 'home', schedule: 'cal', students: 'users' }[t.dataset.tab]]; });
$('#navAdd').innerHTML = I.plus;
$('#navAdd').addEventListener('click', () => {
  if (current && current.route.name === 'students') go('#/student/new');
  else openAddSheet();
});
window.addEventListener('hashchange', () => { if (activeSheet) activeSheet.close(true); render(); });
if (!location.hash) history.replaceState(null, '', '#/');
render();
initSwipeBack();
initPWA();

/* ---------- edge swipe back (like a native stack) ---------- */
function initSwipeBack() {
  let g = null;
  const W = () => app.clientWidth;
  app.addEventListener('pointerdown', e => {
    if (!current || isTab(current.route) || activeSheet || stack.length < 2) return;
    if (e.pointerType === 'mouse') return;
    const x = e.clientX - app.getBoundingClientRect().left;
    if (x > 28) return;
    g = { x0: e.clientX, y0: e.clientY, id: e.pointerId, started: false, lastX: e.clientX, lastT: performance.now(), v: 0 };
  });
  app.addEventListener('pointermove', e => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.started) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g = null; return; }
      if (dx < 10) return;
      const r = parseRoute(stack[stack.length - 2]);
      const scr = (SCREENS[r.name] || SCREENS.home)(r);
      if (!scr) { g = null; return; }
      typo(scr.el);
      g.prev = scr; g.route = r; g.cur = current.el;
      scr.el.style.transform = 'translate3d(-30%,0,0)';
      scr.el.style.opacity = '.85';
      app.insertBefore(scr.el, g.cur);
      g.cur.classList.add('swiping', 'animating');
      scr.el.classList.add('animating');
      try { app.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      g.started = true;
    }
    const now = performance.now();
    g.v = (e.clientX - g.lastX) / Math.max(1, now - g.lastT);
    g.lastX = e.clientX; g.lastT = now;
    const p = Math.max(0, Math.min(1, dx / W()));
    g.cur.style.transform = `translate3d(${p * 100}%,0,0)`;
    g.prev.el.style.transform = `translate3d(${-30 * (1 - p)}%,0,0)`;
    g.prev.el.style.opacity = String(.85 + .15 * p);
  });
  const end = e => {
    if (!g || e.pointerId !== g.id) return;
    const st = g; g = null;
    if (!st.started) return;
    const p = (e.clientX - st.x0) / W();
    const commit = p > .35 || st.v > .45;
    const ease = 'transform .3s cubic-bezier(0.32, 0.72, 0, 1), opacity .3s ease';
    st.cur.style.transition = ease; st.prev.el.style.transition = ease;
    requestAnimationFrame(() => {
      st.cur.style.transform = commit ? 'translate3d(100%,0,0)' : 'none';
      st.prev.el.style.transform = commit ? 'none' : 'translate3d(-30%,0,0)';
      st.prev.el.style.opacity = commit ? '1' : '.85';
    });
    setTimeout(() => {
      st.prev.el.style.transition = st.prev.el.style.transform = st.prev.el.style.opacity = '';
      st.prev.el.classList.remove('animating');
      if (commit) {
        st.cur.remove();
        current = { el: st.prev.el, route: st.route };
        st.prev.mounted && st.prev.mounted();
        stack.pop();
        skipRender = true;
        history.back();
        nav.classList.toggle('hidden', !isTab(st.route));
        if (isTab(st.route)) setNav(st.route.name);
      } else {
        st.prev.el.remove();
        st.cur.style.transition = st.cur.style.transform = '';
        st.cur.classList.remove('swiping', 'animating');
      }
    }, 320);
  };
  app.addEventListener('pointerup', end);
  app.addEventListener('pointercancel', end);
}

/* ---------- installable web app ---------- */
function initPWA() {
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  const splash = document.getElementById('splash');
  if (splash) setTimeout(() => { splash.classList.add('hide'); setTimeout(() => splash.remove(), 350); }, isStandalone() ? 450 : 0);

  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  const KEY_DISMISS = 'tj-install-dismissed';
  let dismissed = false;
  try { dismissed = localStorage.getItem(KEY_DISMISS) === '1'; } catch (e) { /* ignore */ }
  const mobile = matchMedia('(pointer: coarse)').matches;
  if (isStandalone() || dismissed || !mobile) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  setTimeout(() => {
    if (activeSheet || !current || !isTab(current.route)) return;
    openSheet(api => {
      const wrap = document.createElement('div');
      wrap.appendChild(sheetHead('Установите приложение', api, false));
      const body = h(`<div>
        <p class="t-mr muted" style="margin:4px 0 20px">Журнал откроется с экрана «Домой» на весь экран и будет работать без интернета</p>
        ${ios ? `<ol class="steps" style="padding:0;list-style:none">
          <li><i>1</i><span>Нажмите «Поделиться» в панели Safari</span></li>
          <li><i>2</i><span>Выберите «На экран “Домой”»</span></li>
          <li><i>3</i><span>Нажмите «Добавить»</span></li>
        </ol>` : ''}
        <div class="sheet-actions">
          ${!ios ? '<button class="btn" data-install>Установить</button>' : ''}
          <button class="btn secondary" data-later>Не сейчас</button>
        </div>
      </div>`);
      const close = () => { try { localStorage.setItem(KEY_DISMISS, '1'); } catch (e) { /* ignore */ } api.close(); };
      body.addEventListener('click', async e => {
        if (e.target.closest('[data-later]')) close();
        if (e.target.closest('[data-install]')) {
          if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch (err) { /* ignore */ } deferred = null; close(); }
          else { close(); toast('Откройте меню браузера и выберите «Установить приложение»'); }
        }
      });
      wrap.appendChild(body);
      return wrap;
    });
  }, 1600);
}
