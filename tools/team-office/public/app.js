'use strict';
// Concord 지휘본부 v4 — military pixel base: seated work, 연병장 muster, subagents, all sessions, interactive

const T = 32;
const GW = 28, GH = 17;
const $ = (s) => document.querySelector(s);

// ---------- military palette ----------
// muted olive-drab regrade (refs: olive drab #556B2F, drab army #524D3B, military scheme #8E8868/#BEAB8A)
const PAL = {
  outside: '#241f18',
  wood: '#C4B183', woodLine: '#b3a06f',
  woodDark: '#BCA278', woodDarkLine: '#ab9066',   // 문서고
  mint: '#C6CBA4', mintDot: '#b6bc92',            // 공병 막사
  peach: '#CBB79A', peachDot: '#bba586',          // 검열소
  peri: '#AFBCB6', periDot: '#9daba4',            // 브리핑실
  butter: '#CFC194', butterDot: '#bfaf7e',        // 지휘통제실
  slate: '#ACB6BC', slateDot: '#9aa5ad',          // 전략상황실
  copper: '#C2AB89', copperDot: '#b09873',        // 통신소
  dirt: '#A98452', dirtDot: '#98733F',            // 연병장/야외: mud
  wallFace: '#C9B488', wallCap: '#D4C29A', base: '#7d5740', seam: '#4A3826',
  glass: 'rgba(150, 170, 160, 0.45)', glassFrame: '#7a9284',
  labelBg: '#D9CFA8', labelEdge: '#4A4226', label: '#3E381F',
  shadow: 'rgba(60, 45, 30, 0.3)',
};
const DOORS = [[4, 5], [13, 5], [22, 5], [13, 7], [4, 11], [13, 11], [22, 11]];

const FLOORS = [
  { x: 1,  y: 1,  w: 8,  h: 4, f: 'mint',    label: '공병 막사' },
  { x: 10, y: 1,  w: 8,  h: 4, f: 'butter',  label: '지휘통제실' },
  { x: 19, y: 1,  w: 8,  h: 4, f: 'peach',   label: '헌병 검열소' },
  { x: 1,  y: 6,  w: 26, h: 5, f: 'dirt',    label: '' },
  { x: 10, y: 7,  w: 8,  h: 4, f: 'peri',    label: '작전 브리핑실' },
  { x: 19, y: 6,  w: 8,  h: 5, f: 'dirt',    label: '연병장' },
  { x: 1,  y: 12, w: 8,  h: 4, f: 'slate',   label: '전략상황실' },
  { x: 10, y: 12, w: 8,  h: 4, f: 'woodDark', label: '문서고 · 사령관실' },
  { x: 19, y: 12, w: 8,  h: 4, f: 'copper',  label: '통신소' },
];

// ---------- walls ----------
const wallSet = new Set();
const glassSet = new Set();
const K = (x, y) => x + ',' + y;
function hwall(y, x1, x2, doors = [], glass = false) {
  for (let x = x1; x <= x2; x++) if (!doors.includes(x)) { wallSet.add(K(x, y)); if (glass) glassSet.add(K(x, y)); }
}
function vwall(x, y1, y2, doors = [], glass = false) {
  for (let y = y1; y <= y2; y++) if (!doors.includes(y)) { wallSet.add(K(x, y)); if (glass) glassSet.add(K(x, y)); }
}
hwall(0, 0, GW - 1); hwall(GH - 1, 0, GW - 1); vwall(0, 0, GH - 1); vwall(GW - 1, 0, GH - 1);
vwall(9, 1, 4); vwall(18, 1, 4);
hwall(5, 1, 26, [4, 13, 22]);
hwall(7, 10, 17, [13], true);
vwall(10, 8, 9, [], true); vwall(17, 8, 9, [], true);
hwall(11, 1, 26, [4, 13, 22]);
vwall(9, 12, 15); vwall(18, 12, 15);

// ---------- furniture ----------
const FURN = [
  { s: 'desk-monitor', x: 2.5,  y: 1.5, w: 1.4, h: 1.4, solid: [[2, 2], [3, 2]] },
  { s: 'desk-monitor', x: 5.5,  y: 1.5, w: 1.4, h: 1.4, solid: [[5, 2], [6, 2]] },
  { s: 'whiteboard',   x: 3.2,  y: 0.15, w: 2.2, h: 1.1, solid: [] },
  { s: 'plant-small',  x: 7.5,  y: 1.2,  w: 0.7, h: 0.7, solid: [] },
  { s: 'desk-command', x: 12.4, y: 1.5, w: 2.4, h: 1.6, solid: [[12, 2], [13, 2], [14, 2]] },
  { s: 'flag',         x: 15.3, y: 1.15, w: 0.8, h: 0.8, solid: [] },
  { s: 'bookshelf',    x: 16.2, y: 1.4,  w: 1.1, h: 1.5, solid: [[16, 2]] },
  { s: 'rug-round',    x: 12.5, y: 3,    w: 2,   h: 1.3, solid: [] },
  { s: 'desk-monitor', x: 20.5, y: 1.5, w: 1.4, h: 1.4, solid: [[20, 2], [21, 2]] },
  { s: 'desk-monitor', x: 23.5, y: 1.5, w: 1.4, h: 1.4, solid: [[23, 2], [24, 2]] },
  { s: 'wall-clock',   x: 22.2, y: 0.2, w: 0.8, h: 0.8, solid: [] },
  { s: 'water-cooler', x: 19.3, y: 3,    w: 1,   h: 1.2, solid: [[19, 4]] },
  { s: 'meeting-table', x: 11.4, y: 7.7, w: 3.4, h: 1.8, solid: [[12, 8], [13, 8], [14, 8], [12, 9], [13, 9], [14, 9]] },
  { s: 'whiteboard',    x: 14.9, y: 6.2, w: 2.2, h: 1.1, solid: [] },
  // 보급소 (left wing lounge)
  { s: 'rug-round',      x: 3.6, y: 8.1, w: 2.2, h: 1.5, solid: [] },
  { s: 'sofa',           x: 2.2, y: 7.2, w: 1.9, h: 1.3, solid: [[2, 8], [3, 8]] },
  { s: 'coffee-machine', x: 1.2, y: 9.4, w: 1.1, h: 1.1, solid: [[1, 10]] },
  { s: 'plant-big',      x: 7.6, y: 9.4, w: 1.1, h: 1.1, solid: [[7, 10]] },
  // 연병장 + 캠프 구조물 (sprites3 도착 시 표시)
  { s: 'flagpole',   x: 22.1, y: 5.6,  w: 0.75, h: 2,   solid: [] },
  { s: 'watchtower', x: 25.2, y: 5.7,  w: 1.5,  h: 2.2, solid: [[25, 7]] },
  { s: 'jeep',       x: 19.4, y: 9.4,  w: 1.6,  h: 1.1, solid: [[19, 10], [20, 10]] },
  { s: 'tent-hq',    x: 11.6, y: 0.2,  w: 3.2,  h: 2,   solid: [] },
  { s: 'tent-small', x: 4.2,  y: 0.2,  w: 2.2,  h: 1.6, solid: [] },
  { s: 'tent-small', x: 21.8, y: 0.2,  w: 2.2,  h: 1.6, solid: [] },
  { s: 'camo-net',   x: 2.2,  y: 11.5, w: 2.8,  h: 1.6, solid: [] },
  { s: 'crate-stack', x: 6.5, y: 7.3,  w: 1,    h: 1,   solid: [[6, 8]] },
  { s: 'barrel',     x: 7.4,  y: 7.5,  w: 0.5,  h: 0.5, solid: [] },
  { s: 'ammo-box',   x: 6.6,  y: 8.5,  w: 0.5,  h: 0.5, solid: [] },
  { s: 'campfire',   x: 5.9,  y: 9.4,  w: 1,    h: 1,   solid: [[6, 10]] },
  { s: 'radar-dish', x: 25.2, y: 11.5, w: 1.2,  h: 1.6, solid: [[25, 12]] },
  // bottom rooms
  { s: 'map-table',   x: 2.4,  y: 12.3, w: 2.4, h: 1.6, solid: [[2, 13], [3, 13], [4, 13]] },
  { s: 'whiteboard',  x: 5.4,  y: 11.2, w: 2.2, h: 1.1, solid: [] },
  { s: 'plant-big',   x: 7.4,  y: 12.2, w: 1.1, h: 1.1, solid: [[7, 13]] },
  { s: 'bookshelf',   x: 10.3, y: 11.6, w: 1.1, h: 1.5, solid: [[10, 12]] },
  { s: 'bookshelf',   x: 11.5, y: 11.6, w: 1.1, h: 1.5, solid: [[11, 12]] },
  { s: 'bookshelf',   x: 12.7, y: 11.6, w: 1.1, h: 1.5, solid: [[12, 12]] },
  { s: 'owner-desk',  x: 14.6, y: 12.4, w: 2.2, h: 1.5, solid: [[14, 13], [15, 13], [16, 13]] },
  { s: 'wall-clock',  x: 16.6, y: 11.3, w: 0.8, h: 0.8, solid: [] },
  { s: 'rug-round',   x: 14.2, y: 13.9, w: 2,   h: 1.3, solid: [] },
  { s: 'radio-console', x: 20.4, y: 12.3, w: 2.2, h: 1.5, solid: [[20, 13], [21, 13]] },
  { s: 'desk-monitor',  x: 23.8, y: 12.3, w: 1.4, h: 1.4, solid: [[24, 13]] },
  { s: 'coffee-machine', x: 25.6, y: 14.4, w: 1.1, h: 1.1, solid: [[25, 15]] },
  { s: 'plant-small',   x: 25.6, y: 12.2, w: 0.7, h: 0.7, solid: [] },
];
const SHELF_ZONE = { x: 10, y: 11.4, w: 4, h: 2.4 };
const OWNER_SPOT = { x: 15, y: 14 };

const AGENTS = {
  LEAD:                 { label: '지휘관',      sprite: 'char-lead',     home: [13, 3], seat: [13.1, 1.75], room: [10, 1, 17, 4], color: '#F6D979' },
  'web-implementer':    { label: '웹 공병',     sprite: 'char-web',      home: [3, 3],  seat: [2.7, 1.65],  room: [1, 1, 8, 4],   color: '#9FD4EC' },
  'mobile-implementer': { label: '모바일 공병', sprite: 'char-mobile',   home: [6, 3],  seat: [5.7, 1.65],  room: [1, 1, 8, 4],   color: '#4EAAA4' },
  reviewer:             { label: '검열관',      sprite: 'char-reviewer', home: [21, 3], seat: [20.7, 1.65], room: [19, 1, 26, 4], color: '#D96D6D' },
  'qa-verifier':        { label: '검증반',      sprite: 'char-qa',       home: [24, 3], seat: [23.7, 1.65], room: [19, 1, 26, 4], color: '#72B887' },
  'codex-operator':     { label: '통신병',      sprite: 'char-codex',    home: [22, 14], seat: [21.2, 12.5], room: [19, 12, 26, 15], color: '#E99261' },
  'biz-strategist':     { label: '전략참모',    sprite: 'char-biz',      home: [4, 14], seat: [3.3, 12.55], room: [1, 12, 8, 15],  color: '#C6B6E3' },
};
const MEET_SEATS = [[11, 8], [11, 9], [15, 8], [15, 9], [16, 8], [16, 9]];
// 연병장 formation slots (subagents + other sessions)
const MUSTER = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) MUSTER.push([19.9 + c * 1.35, 7.6 + r * 1.25]);
let musterIdx = 0;
const MUSTER_ROOM = [19, 6, 26, 10];

// ---------- solid + BFS ----------
const solid = Array.from({ length: GH }, () => new Array(GW).fill(false));
wallSet.forEach((k) => { const [x, y] = k.split(',').map(Number); solid[y][x] = true; });
FURN.forEach((f) => f.solid.forEach(([x, y]) => { solid[y][x] = true; }));

function bfs(sx, sy, tx, ty) {
  sx = Math.round(sx); sy = Math.round(sy); tx = Math.round(tx); ty = Math.round(ty);
  if (sx === tx && sy === ty) return [];
  const key = (x, y) => y * GW + x;
  const prev = new Map([[key(sx, sy), null]]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || prev.has(key(nx, ny))) continue;
      if (solid[ny][nx] && !(nx === tx && ny === ty)) continue;
      prev.set(key(nx, ny), [x, y]);
      if (nx === tx && ny === ty) {
        const path = [[nx, ny]];
        let cur = [x, y];
        while (cur) { path.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
        path.shift();
        return path;
      }
      q.push([nx, ny]);
    }
  }
  return [[tx, ty]];
}

// ---------- sprites ----------
const sprImgs = {};
async function loadSprites() {
  for (const file of ['sprites3.svg', 'sprites2.svg', 'sprites.svg']) {
    try {
      const res = await fetch(file);
      if (!res.ok) continue;
      const doc = new DOMParser().parseFromString(await res.text(), 'image/svg+xml');
      const jobs = [];
      doc.querySelectorAll('symbol').forEach((sym) => {
        if (sprImgs[sym.id]) return;
        const vb = sym.getAttribute('viewBox') || '0 0 32 32';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" shape-rendering="crispEdges">${sym.innerHTML}</svg>`;
        const img = new Image();
        jobs.push(new Promise((r) => { img.onload = r; img.onerror = r; }));
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        sprImgs[sym.id] = img;
      });
      await Promise.all(jobs);
    } catch { /* ignore */ }
  }
}

// ---------- characters ----------
const chars = new Map();          // key → char (key: agent name | 'sub:<session>:<id>')
const agentEvents = new Map();    // key → recent events ring (detail drawer)
function remember(key, ev) {
  if (!agentEvents.has(key)) agentEvents.set(key, []);
  const a = agentEvents.get(key);
  a.push(ev);
  if (a.length > 20) a.shift();
}

function ensureChar(key, opts = {}) {
  if (chars.has(key)) return chars.get(key);
  const cfg = AGENTS[key];
  let home, room, scale = 1, color = cfg ? cfg.color : '#cfcfcf';
  if (cfg) { home = cfg.home; room = cfg.room; }
  else {
    home = MUSTER[musterIdx++ % MUSTER.length];
    room = MUSTER_ROOM;
    scale = opts.sub ? 0.78 : 0.92;
    if (opts.color) color = opts.color;
  }
  const c = {
    key, agent: key,
    label: opts.label || (cfg ? cfg.label : key),
    sprite: cfg ? cfg.sprite : (sprImgs['char-private'] ? 'char-private' : 'char-web'),
    generic: !cfg, sub: !!opts.sub, scale, color,
    x: home[0], y: home[1], home, room,
    seat: cfg ? cfg.seat : null,
    path: [], speed: 3.4, state: 'idle', stateUntil: 0, lastActive: Date.now(),
    afterWalk: null, meeting: false, flip: false, bob: 0, bubbleUntil: 0, seated: false,
  };
  const b = document.createElement('div');
  b.className = 'w-bubble'; b.hidden = true;
  $('#world-overlay').appendChild(b); c.bubbleEl = b;
  const n = document.createElement('div');
  n.className = 'w-name' + (c.sub ? ' sub' : ''); n.textContent = c.label;
  $('#world-overlay').appendChild(n); c.nameEl = n;
  chars.set(key, c);
  return c;
}
function removeChar(key) {
  const c = chars.get(key);
  if (!c) return;
  c.bubbleEl.remove(); c.nameEl.remove();
  chars.delete(key);
}
function walkTo(c, tx, ty, after) {
  c.seated = false;
  c.path = bfs(c.x, c.y, tx, ty);
  c.afterWalk = after || null;
  if (c.path.length) c.state = 'walk';
  else if (after) after();
}
function setState(c, st, ms) { c.state = st; c.stateUntil = performance.now() + ms; c.lastActive = Date.now(); }
function sitAndWork(c, ms) {
  if (!c.seat) { setState(c, 'work', ms); return; }
  const done = () => { c.x = c.seat[0]; c.y = c.seat[1]; c.seated = true; c.path = []; setState(c, 'work', ms); };
  if (Math.abs(c.x - c.seat[0]) + Math.abs(c.y - c.seat[1]) < 0.6) done();
  else walkTo(c, Math.round(c.seat[0]), Math.round(c.seat[1] + 1), done); // walk to front of desk, then slide in
}
function standUpHome(c) {
  c.seated = false;
  walkTo(c, c.home[0], c.home[1], () => { c.state = 'idle'; });
}
function speak(key, text, ms = 5000) {
  const c = chars.get(key);
  if (!c) return;
  c.bubbleEl.textContent = text;
  c.bubbleEl.hidden = false;
  c.bubbleUntil = performance.now() + ms;
}

// ---------- behaviors ----------
function keyFor(ev) { return ev.sub ? `sub:${ev.agent}:${ev.sub}` : ev.agent; }

// per-agent model + token stats (server-uptime cumulative)
const agentStats = {};
function fmtTok(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n); }
function shortModel(m) { return (m || '').replace(/^claude-/, '').replace(/-\d{8}$/, ''); }
function applyStats(stats) {
  Object.assign(agentStats, stats);
  chars.forEach((c) => {
    const s = agentStats[c.key];
    if (!s) return;
    c.nameEl.innerHTML = `${esc(c.label)}<span class="w-stat">${esc(shortModel(s.model))} · ${fmtTok(s.in + s.out)}</span>`;
  });
}
function ensureFromEvent(ev) {
  if (ev.sub) {
    const parent = AGENTS[ev.agent];
    return ensureChar(keyFor(ev), { sub: true, label: (parent ? parent.label : ev.agent) + '·' + ev.sub.slice(0, 4), color: parent ? parent.color : '#cfcfcf' });
  }
  if (AGENTS[ev.agent]) return ensureChar(ev.agent);
  return ensureChar(ev.agent, { label: (ev.proj ? ev.proj + '·' : '') + ev.agent.replace('session-', '') });
}
function onActivity(ev) {
  const c = ensureFromEvent(ev);
  remember(c.key, ev);
  if (c.meeting) { speak(c.key, ev.text ? `⚙ ${ev.text}` : '…', 2500); return; }
  if (c.seat) sitAndWork(c, 30000);
  else setState(c, 'work', 30000);
  if (ev.text) speak(c.key, `⚙ ${ev.text}`, 3200);
}
function onMessage(ev) {
  const from = ensureFromEvent(ev);
  remember(from.key, ev);
  const toCfg = AGENTS[ev.to];
  const to = toCfg ? ensureChar(ev.to) : null;
  speak(from.key, `→ ${toCfg ? toCfg.label : ev.to}: ${ev.text}`, 5500);
  if (!to || from.meeting) return;
  walkTo(from, Math.round(to.x), Math.round(to.y) + 1, () => {
    setState(from, 'talk', 4000);
    setState(to, 'alert', 4000);
    remember(to.key, ev);
    setTimeout(() => { if (!from.meeting) standUpHome(from); }, 4200);
  });
}
function onDecision(ev) {
  const c = ensureFromEvent(ev);
  remember(c.key, ev);
  speak(c.key, '📋 결재 요청', 4000);
  walkTo(c, OWNER_SPOT.x, OWNER_SPOT.y, () => {
    setState(c, 'alert', 30000);
    speak(c.key, `📋 ${ev.text}`, 9000);
    setTimeout(() => { if (!c.meeting) standUpHome(c); }, 30000);
  });
}
const COMMANDERS = ['LEAD', 'web-implementer', 'mobile-implementer', 'reviewer', 'biz-strategist'];
let meetingOn = false;
function setMeeting(on) {
  if (on === meetingOn) return;
  meetingOn = on;
  $('#meeting-banner').hidden = !on;
  document.body.classList.toggle('meeting', on);
  COMMANDERS.forEach((a, i) => {
    const c = chars.get(a);
    if (!c) return;
    c.meeting = on;
    if (on) walkTo(c, MEET_SEATS[i][0], MEET_SEATS[i][1], () => setState(c, 'talk', 999999));
    else standUpHome(c);
  });
}
const recentMsgs = [];
let meetingUntil = 0;
function maybeMeeting() {
  const now = Date.now();
  recentMsgs.push(now);
  while (recentMsgs.length && now - recentMsgs[0] > 60000) recentMsgs.shift();
  if (recentMsgs.length >= 3) meetingUntil = now + 45000;
}
setInterval(() => setMeeting(Date.now() < meetingUntil), 2000);

// idle: small moves INSIDE own room only
setInterval(() => {
  const now = Date.now();
  chars.forEach((c) => {
    if (c.state !== 'idle' || c.meeting || c.seated || now - c.lastActive < 45000) return;
    if (Math.random() < 0.3 && c.room) {
      const [x1, y1, x2, y2] = c.room;
      for (let tries = 0; tries < 8; tries++) {
        const tx = x1 + Math.floor(Math.random() * (x2 - x1 + 1));
        const ty = y1 + Math.floor(Math.random() * (y2 - y1 + 1));
        if (!solid[ty] || solid[ty][tx]) continue;
        walkTo(c, tx, ty, () => { c.state = 'idle'; });
        break;
      }
    }
  });
}, 7000);
// subagent despawn after 3min silence
setInterval(() => {
  const now = Date.now();
  chars.forEach((c) => { if (c.sub && now - c.lastActive > 180000) removeChar(c.key); });
}, 30000);

// ---------- SSE + panels ----------
function label(agent) { return (AGENTS[agent] && AGENTS[agent].label) || agent; }
function esc(s) { const d = document.createElement('span'); d.textContent = s || ''; return d.innerHTML; }
function projTag(ev) { return ev.proj && ev.proj !== 'premium-tutoring' ? `<span class="proj-tag">${esc(ev.proj)}</span> ` : ''; }
let logFilter = 'all';
const FILTER_MAP = { message: ['message', 'owner', 'order', 'say'], alert: ['error', 'spawn'], tool: ['tool'] };
function rowVisible(cls) {
  if (logFilter === 'all') return true;
  return (FILTER_MAP[logFilter] || []).some((k) => cls.includes(k));
}
function log(ev, cls, line) {
  const box = $('#comm-log');
  const row = document.createElement('div');
  row.className = 'log-row ' + cls;
  row.dataset.agent = keyFor(ev);
  if (!rowVisible(cls)) row.style.display = 'none';
  row.innerHTML = `<span class="log-time">${new Date(ev.ts).toTimeString().slice(0, 8)}</span> ${projTag(ev)}${line}`;
  row.onclick = () => { const c = chars.get(row.dataset.agent); if (c) openDetail(c); };
  box.appendChild(row);
  while (box.children.length > 300) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
}
document.querySelectorAll('.log-tab').forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll('.log-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    logFilter = tab.dataset.f;
    document.querySelectorAll('#comm-log .log-row').forEach((r) => {
      r.style.display = rowVisible(r.className) ? '' : 'none';
    });
    const box = $('#comm-log');
    box.scrollTop = box.scrollHeight;
  };
});
const seenDecisions = new Set(JSON.parse(localStorage.getItem('seenDecisions') || '[]'));
function renderDecision(d) {
  const board = $('#decision-board');
  const empty = board.querySelector('.empty-note');
  if (empty) empty.remove();
  if (board.querySelector(`[data-id="${d.id}"]`)) return;
  const item = document.createElement('div');
  item.className = 'decision-item' + (seenDecisions.has(d.id) ? ' seen' : '');
  item.dataset.id = d.id;
  item.innerHTML = `<span class="d-from">${esc(label(d.agent))}</span><span class="d-time">${new Date(d.ts).toTimeString().slice(0, 5)}</span><br>${esc(d.text)}`;
  item.onclick = () => {
    item.classList.toggle('seen');
    if (item.classList.contains('seen')) seenDecisions.add(d.id); else seenDecisions.delete(d.id);
    localStorage.setItem('seenDecisions', JSON.stringify([...seenDecisions]));
    updateDecisionCount();
  };
  board.prepend(item);
  updateDecisionCount();
}
function updateDecisionCount() {
  const n = document.querySelectorAll('.decision-item:not(.seen)').length;
  const el = $('#decision-count');
  el.textContent = n;
  el.classList.toggle('zero', n === 0);
}
function renderTasks(tasks) {
  const board = $('#task-board');
  board.innerHTML = '';
  const order = { in_progress: 0, pending: 1, completed: 2 };
  [...tasks].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3) || Number(a.id) - Number(b.id))
    .slice(0, 24).forEach((t) => {
      const chip = document.createElement('div');
      chip.className = 'task-chip ' + (t.status || 'pending');
      chip.title = t.subject;
      chip.innerHTML = `<span class="task-id">#${esc(t.id)}</span> ${esc(t.subject && t.subject.slice(0, 34))}`;
      board.appendChild(chip);
    });
}
function handle(ev, replay) {
  switch (ev.kind) {
    case 'hello':
      (ev.recent || []).forEach((e) => handle(e, true));
      if (ev.tasks) renderTasks(ev.tasks);
      (ev.decisions || []).forEach(renderDecision);
      if (ev.stats) applyStats(ev.stats);
      break;
    case 'stats':
      applyStats(ev.stats || {});
      break;
    case 'tool':
      if (replay) { const c = ensureFromEvent(ev); remember(c.key, ev); }
      else onActivity(ev);
      log(ev, 'tool', `<b>${esc(label(ev.agent))}${ev.sub ? '·' + esc(ev.sub.slice(0, 4)) : ''}</b> ⚙ ${esc(ev.tool)} — ${esc(ev.text)}`);
      break;
    case 'say': {
      const c = ensureFromEvent(ev);
      remember(c.key, ev);
      if (!replay) { setState(c, 'talk', 4000); speak(c.key, ev.text, 4500); }
      log(ev, 'say', `<b>${esc(label(ev.agent))}</b> 💬 ${esc(ev.text)}`);
      break;
    }
    case 'message':
      if (!replay) { onMessage(ev); maybeMeeting(); } else { const c = ensureFromEvent(ev); remember(c.key, ev); }
      log(ev, 'message', `<b>${esc(label(ev.agent))}</b> ▶ <b>${esc(label(ev.to))}</b> — ${esc(ev.text)}`);
      break;
    case 'spawn': {
      const c = ensureFromEvent(ev);
      remember(c.key, ev);
      if (!replay) speak(c.key, `★ 병력 투입: ${ev.agentType}`, 3500);
      log(ev, 'spawn', `<b>${esc(label(ev.agent))}</b> ★ 병력 투입 [${esc(ev.agentType)}] ${esc(ev.text)}`);
      break;
    }
    case 'order': {
      const c = ensureFromEvent(ev);
      remember(c.key, ev);
      if (!replay) { setState(c, 'talk', 3000); speak(c.key, `⚑ ${ev.text}`, 4000); }
      log(ev, 'order', `<b>${esc(label(ev.agent))}</b> ⚑ 명령 하달 — ${esc(ev.text)}`);
      break;
    }
    case 'error': {
      const c = ensureFromEvent(ev);
      remember(c.key, ev);
      if (!replay) { setState(c, 'alert', 6000); speak(c.key, `⚠ ${ev.text}`, 6000); }
      log(ev, 'error', `<b>${esc(label(ev.agent))}</b> ⚠ ${esc(ev.text)}`);
      break;
    }
    case 'decision':
      renderDecision(ev);
      if (!replay) onDecision(ev);
      log(ev, 'error', `<b>${esc(label(ev.agent))}</b> 📋 결재 요청 — ${esc(ev.text)}`);
      break;
    case 'owner-order': {
      log(ev, 'owner', `<b>★ 사령관</b> ▶ <b>${esc(ev.to)}</b> — ${esc(ev.text)}`);
      if (!replay) {
        const bn = $('#order-banner');
        bn.textContent = `★ 사령관 명령 하달 → ${ev.to}`;
        bn.hidden = false;
        setTimeout(() => { bn.hidden = true; }, 5000);
        const lead = chars.get('LEAD');
        if (lead) { setState(lead, 'alert', 6000); speak('LEAD', `★ 명령 수신: ${ev.text}`, 6000); }
      }
      break;
    }
    case 'tasks': renderTasks(ev.tasks || []); break;
  }
}
function connect() {
  if (location.search.includes('shot')) { // headless screenshot mode: one snapshot, no SSE
    fetch('/state').then((r) => r.json()).then((s) => {
      (s.events || []).forEach((e) => handle(e, true));
      renderTasks(s.tasks || []);
      applyStats(s.stats || {});
    });
    return;
  }
  const es = new EventSource('/events');
  es.onmessage = (m) => { try { handle(JSON.parse(m.data), false); } catch { /* ignore */ } };
  es.onerror = () => $('#conn-dot').classList.add('down');
  es.onopen = () => $('#conn-dot').classList.remove('down');
}

// ---------- command bar ----------
async function sendOrder() {
  const input = $('#cmd-input');
  const text = input.value.trim();
  if (!text) return;
  const to = $('#cmd-to').value;
  try {
    await fetch('/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, to }) });
    input.value = '';
  } catch { /* server down: conn dot already red */ }
}
$('#cmd-send').onclick = sendOrder;
$('#cmd-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendOrder(); });

// ---------- detail drawer ----------
function openDetail(c) {
  $('#detail-drawer').hidden = false;
  $('#detail-title').textContent = c.label;
  const st = { idle: '대기', walk: '이동 중', work: '작업 중', talk: '교신 중', alert: '경보' }[c.state] || c.state;
  const orderBtn = AGENTS[c.key] ? `<button class="mini-order" data-agent="${c.key}">▶ 이 대원에게 명령</button>` : '';
  const s = agentStats[c.key];
  const statLine = s ? `<br>모델: <b>${esc(shortModel(s.model))}</b> · 토큰(기동 후): 입력 ${fmtTok(s.in)} / 출력 ${fmtTok(s.out)}` : '';
  $('#detail-meta').innerHTML =
    `상태: <b>${st}</b> · 마지막 활동: ${c.lastActive ? new Date(c.lastActive).toTimeString().slice(0, 8) : '—'}` +
    (c.sub ? '<br>유형: 서브에이전트 (연병장 소속)' : (c.generic ? '<br>유형: 외부 세션' : '<br>유형: 팀 편제')) +
    statLine +
    (orderBtn ? '<br>' + orderBtn : '');
  const ob = $('#detail-meta .mini-order');
  if (ob) ob.onclick = () => {
    $('#cmd-to').value = ob.dataset.agent;
    $('#cmd-input').focus();
    $('#detail-drawer').hidden = true;
  };
  const box = $('#detail-log');
  box.innerHTML = '';
  const evs = agentEvents.get(c.key) || [];
  if (!evs.length) box.innerHTML = '<div class="empty-note">기록 없음</div>';
  [...evs].reverse().forEach((ev) => {
    const row = document.createElement('div');
    row.className = 'log-row ' + (ev.kind === 'tool' ? 'tool' : ev.kind === 'message' ? 'message' : ev.kind === 'error' || ev.kind === 'decision' ? 'error' : 'say');
    row.innerHTML = `<span class="log-time">${new Date(ev.ts).toTimeString().slice(0, 8)}</span> [${ev.kind}${ev.tool ? ':' + esc(ev.tool) : ''}] ${esc(ev.text || '')}`;
    box.appendChild(row);
  });
}
$('#detail-close').onclick = () => { $('#detail-drawer').hidden = true; };

// ---------- archive modal ----------
async function openArchive() {
  $('#archive-modal').hidden = false;
  const tree = $('#doc-tree');
  if (tree.childElementCount) return;
  const groups = await (await fetch('/docs')).json();
  groups.forEach((g) => {
    const h = document.createElement('div');
    h.className = 'doc-group';
    h.textContent = '▸ ' + g.label;
    tree.appendChild(h);
    g.files.forEach((f) => {
      const el = document.createElement('div');
      el.className = 'doc-file';
      el.textContent = f;
      el.onclick = async () => {
        tree.querySelectorAll('.doc-file.open').forEach((x) => x.classList.remove('open'));
        el.classList.add('open');
        $('#doc-view').textContent = '불러오는 중…';
        $('#doc-view').textContent = await (await fetch(`/doc?dir=${encodeURIComponent(g.dir)}&f=${encodeURIComponent(f)}`)).text();
        $('#doc-view').scrollTop = 0;
      };
      tree.appendChild(el);
    });
  });
}
$('#archive-close').onclick = () => { $('#archive-modal').hidden = true; };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('#archive-modal').hidden = true; $('#detail-drawer').hidden = true; } });

// ---------- render ----------
const canvas = $('#world');
const ctx = canvas.getContext('2d');
let cam = { x: 0, y: 0, scale: 2 };
let fitted = false;
function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  canvas.width = r.width * devicePixelRatio;
  canvas.height = r.height * devicePixelRatio;
  canvas.style.width = r.width + 'px';
  canvas.style.height = r.height + 'px';
  if (!fitted) {
    cam.scale = Math.min(r.width / (GW * T), r.height / (GH * T)) * 0.92; // leave terrain ring visible
    fitScale = cam.scale;
    cam.x = (r.width - GW * T * cam.scale) / 2;
    cam.y = (r.height - GH * T * cam.scale) / 2;
    fitted = true;
  }
}
window.addEventListener('resize', () => { fitted = false; resize(); });

// no drag-pan (was pointless). wheel = cursor-anchored zoom, clamped to map. dblclick = reset.
let fitScale = 1;
function clampCam() {
  const r = canvas.getBoundingClientRect();
  const mw = GW * T * cam.scale, mh = GH * T * cam.scale;
  cam.x = mw <= r.width ? (r.width - mw) / 2 : Math.min(0, Math.max(r.width - mw, cam.x));
  cam.y = mh <= r.height ? (r.height - mh) / 2 : Math.min(0, Math.max(r.height - mh, cam.y));
}
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const f = e.deltaY < 0 ? 1.12 : 0.9;
  const ns = Math.max(fitScale, Math.min(4.5, cam.scale * f));
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left, my = e.clientY - r.top;
  cam.x = mx - (mx - cam.x) * (ns / cam.scale);
  cam.y = my - (my - cam.y) * (ns / cam.scale);
  cam.scale = ns;
  clampCam();
}, { passive: false });
canvas.addEventListener('dblclick', () => { fitted = false; resize(); });

// hover highlight
let hoverKey = null;
function charAt(e) {
  const r = canvas.getBoundingClientRect();
  const wx = (e.clientX - r.left - cam.x) / cam.scale / T;
  const wy = (e.clientY - r.top - cam.y) / cam.scale / T;
  let hit = null;
  chars.forEach((c) => {
    if (Math.abs(wx - (c.x + 0.5)) < 0.55 && Math.abs(wy - (c.y + 0.5)) < 0.7) hit = c;
  });
  return { hit, wx, wy };
}
function inZone(wx, wy, z) { return wx >= z.x && wx <= z.x + z.w && wy >= z.y && wy <= z.y + z.h; }
const OWNER_DESK_ZONE = { x: 14.4, y: 12.2, w: 2.6, h: 2 };
canvas.addEventListener('mousemove', (e) => {
  const { hit, wx, wy } = charAt(e);
  hoverKey = hit ? hit.key : null;
  canvas.style.cursor = (hit || inZone(wx, wy, SHELF_ZONE) || inZone(wx, wy, OWNER_DESK_ZONE)) ? 'pointer' : 'default';
});
canvas.addEventListener('click', (e) => {
  const { hit, wx, wy } = charAt(e);
  if (hit) {
    // salute reaction
    speak(hit.key, '경례! ✋', 1500);
    const keep = hit.state;
    hit.bob = -4;
    if (keep === 'idle') setState(hit, 'talk', 1500);
    openDetail(hit);
    return;
  }
  if (inZone(wx, wy, SHELF_ZONE)) { openArchive(); return; }
  if (inZone(wx, wy, OWNER_DESK_ZONE)) {
    const board = $('#decision-board');
    board.scrollIntoView({ behavior: 'smooth' });
    board.classList.add('flash');
    setTimeout(() => board.classList.remove('flash'), 1600);
  }
});

function floorStyle(f) {
  return {
    wood: [PAL.wood, PAL.woodLine], woodDark: [PAL.woodDark, PAL.woodDarkLine],
    mint: [PAL.mint, PAL.mintDot], peach: [PAL.peach, PAL.peachDot],
    peri: [PAL.peri, PAL.periDot], butter: [PAL.butter, PAL.butterDot],
    slate: [PAL.slate, PAL.slateDot], copper: [PAL.copper, PAL.copperDot],
    dirt: [PAL.dirt, PAL.dirtDot],
  }[f];
}
// surrounding terrain: grass field + pine forest ring (Advance Wars map edge feel)
const GRASS = '#6E7A4D', GRASS_DARK = '#5F6B42', PINE = ['#45573A', '#37472F'], TRUNK = '#5A4530';
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
function drawPine(px, py, s) {
  ctx.fillStyle = TRUNK;
  ctx.fillRect(px + 13 * s, py + 24 * s, 6 * s, 6 * s);
  ctx.fillStyle = PINE[1];
  ctx.fillRect(px + 6 * s, py + 16 * s, 20 * s, 9 * s);
  ctx.fillStyle = PINE[0];
  ctx.fillRect(px + 9 * s, py + 9 * s, 14 * s, 9 * s);
  ctx.fillRect(px + 12 * s, py + 3 * s, 8 * s, 7 * s);
}
function drawSurroundings() {
  const M = 8;
  ctx.fillStyle = GRASS;
  ctx.fillRect(-M * T, -M * T, (GW + 2 * M) * T, (GH + 2 * M) * T);
  for (let y = -M; y < GH + M; y++) {
    for (let x = -M; x < GW + M; x++) {
      const inside = x >= 0 && x < GW && y >= 0 && y < GH;
      if (inside) continue;
      const h = hash2(x, y);
      if (h < 0.18) { ctx.fillStyle = GRASS_DARK; ctx.fillRect(x * T + 4, y * T + 4, T - 8, T - 8); }
      const ring = Math.max(x < 0 ? -x : x - GW + 1, y < 0 ? -y : y - GH + 1);
      if (ring >= 2 ? h > 0.45 : h > 0.82) drawPine(x * T, y * T, 1); // denser forest further out
      else if (h > 0.3 && h < 0.36 && sprImgs['ground-grass']) ctx.drawImage(sprImgs['ground-grass'], x * T, y * T, T, T);
    }
  }
  ctx.strokeStyle = 'rgba(60,45,25,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(-1.5, -1.5, GW * T + 3, GH * T + 3);
}

function drawFloors() {
  drawSurroundings();
  ctx.fillStyle = PAL.dirt;
  ctx.fillRect(T, T, (GW - 2) * T, (GH - 2) * T);
  FLOORS.forEach((r) => {
    const [base, acc] = floorStyle(r.f);
    ctx.fillStyle = base;
    ctx.fillRect(r.x * T, r.y * T, r.w * T, r.h * T);
    if (r.f === 'wood' || r.f === 'woodDark') {
      ctx.fillStyle = acc;
      for (let y = 0; y < r.h; y++) {
        ctx.fillRect(r.x * T, (r.y + y) * T + T - 1.5, r.w * T, 1.5);
        for (let x = 0; x < r.w; x += 2) ctx.fillRect((r.x + x) * T + ((y % 2) ? T : 0), (r.y + y) * T, 1.5, T);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let y = 0; y < r.h; y += 2) ctx.fillRect(r.x * T, (r.y + y) * T, r.w * T, T);
    } else if (r.f === 'dirt') {
      ctx.fillStyle = acc;
      for (let y = 0; y < r.h; y++)
        for (let x = 0; x < r.w; x++)
          if ((x * 3 + y * 5) % 7 === 0) ctx.fillRect((r.x + x) * T + ((x * 7) % 20) + 4, (r.y + y) * T + ((y * 11) % 20) + 4, 4, 3);
      // grass tufts + tire tracks (sprites3)
      const tuft = sprImgs['ground-grass'], track = sprImgs['tire-track'];
      if (tuft) for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++)
        if ((x * 5 + y * 3) % 9 === 0) ctx.drawImage(tuft, (r.x + x) * T, (r.y + y) * T, T, T);
      if (track && r.w > 10) for (let x = 1; x < r.w - 1; x++) ctx.drawImage(track, (r.x + x) * T, (r.y + 0) * T, T, T);
      // formation ground lines
      ctx.strokeStyle = 'rgba(95,70,50,0.25)';
      ctx.setLineDash([6, 6]);
      for (let row = 0; row < 3; row++) {
        ctx.beginPath();
        ctx.moveTo(19.6 * T, (8.4 + row * 1.25) * T);
        ctx.lineTo(26.4 * T, (8.4 + row * 1.25) * T);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = acc;
      for (let y = 0; y < r.h; y++)
        for (let x = 0; x < r.w; x++)
          if ((x + y * 2) % 4 === 0) ctx.fillRect((r.x + x) * T + T / 2 - 1, (r.y + y) * T + T / 2 - 1, 3, 3);
    }
  });
  ctx.fillStyle = PAL.seam;
  DOORS.forEach(([x, y]) => ctx.fillRect(x * T + 2, y * T + T - 3, T - 4, 3));
  ctx.font = 'bold 8px ui-monospace, monospace';
  FLOORS.forEach((r) => {
    if (!r.label) return;
    const w = ctx.measureText(r.label).width + 12;
    const lx = r.x * T + 6, ly = r.y * T + 6;
    ctx.fillStyle = PAL.labelEdge;
    ctx.fillRect(lx - 2, ly - 2, w + 4, 18);
    ctx.fillStyle = PAL.labelBg;
    ctx.fillRect(lx, ly, w, 14);
    ctx.fillStyle = PAL.label;
    ctx.fillText(r.label, lx + 6, ly + 10);
  });
}
function drawWalls() {
  wallSet.forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    const px = x * T, py = y * T;
    if (glassSet.has(k)) {
      ctx.fillStyle = PAL.glass;
      ctx.fillRect(px, py + 4, T, T - 8);
      ctx.fillStyle = PAL.glassFrame;
      ctx.fillRect(px, py + 4, T, 3);
      ctx.fillRect(px, py + T - 7, T, 3);
      ctx.fillRect(px + T / 2 - 1, py + 4, 2, T - 8);
    } else if (sprImgs.sandbag) {
      ctx.drawImage(sprImgs.sandbag, px, py, T, T); // camp walls = sandbag lines
    } else {
      ctx.fillStyle = PAL.wallFace;
      ctx.fillRect(px, py + T * 0.28, T, T * 0.72);
      ctx.fillStyle = PAL.wallCap;
      ctx.fillRect(px, py, T, T * 0.28);
      ctx.fillStyle = PAL.seam;
      ctx.fillRect(px, py, T, 1.5);
      ctx.fillRect(px, py + T * 0.28, T, 1.5);
      ctx.fillStyle = PAL.base;
      ctx.fillRect(px, py + T - 4, T, 4);
      ctx.fillStyle = PAL.seam;
      ctx.fillRect(px, py + T - 1, T, 1);
    }
  });
}
function drawChar(c, now) {
  const img = sprImgs[c.sprite];
  const size = T * c.scale;
  const px = c.x * T + (T - size) / 2, py = c.y * T + c.bob + (T - size);
  ctx.fillStyle = PAL.shadow;
  ctx.beginPath();
  ctx.ellipse(c.x * T + T / 2, c.y * T + T - 2, 9 * c.scale, 3.5 * c.scale, 0, 0, Math.PI * 2);
  ctx.fill();
  if (img) {
    ctx.save();
    let filt = '';
    if (c.generic && !c.sub) filt = 'grayscale(0.55) brightness(0.95)';
    else if (c.state === 'idle') filt = 'saturate(0.75)';
    if (filt) ctx.filter = filt;
    if (c.flip) { ctx.translate(px + size, py); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, size, size); }
    else ctx.drawImage(img, px, py, size, size);
    ctx.restore();
  }
  // commander-color chevron for subs / muster chars
  if (c.sub || c.generic) {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x * T + T / 2 - 4, py - 5, 8, 3);
  }
  // hover ring
  if (hoverKey === c.key) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px - 2, py - 2, size + 4, size + 4);
  }
  const dot = { work: '#e8a33d', walk: '#5ea8dc', talk: '#5ea8dc', alert: '#d9534f', idle: 'rgba(0,0,0,0.25)' }[c.state];
  ctx.fillStyle = dot;
  ctx.fillRect(c.x * T + T / 2 - 2, py - 10, 4, 4);
  c.nameEl.style.transform = `translate(${cam.x + (c.x * T + T / 2) * cam.scale}px, ${cam.y + (c.y * T + T + 1) * cam.scale}px) translateX(-50%)`;
  if (!c.bubbleEl.hidden) {
    if (now > c.bubbleUntil) c.bubbleEl.hidden = true;
    else c.bubbleEl.style.transform = `translate(${cam.x + (c.x * T + T / 2) * cam.scale}px, ${cam.y + py * cam.scale - 8}px) translate(-50%, -100%)`;
  }
}

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  chars.forEach((c) => {
    if (c.path.length) {
      const [tx, ty] = c.path[0];
      const dx = tx - c.x, dy = ty - c.y;
      const dist = Math.hypot(dx, dy);
      const step = c.speed * dt;
      if (dist <= step) {
        c.x = tx; c.y = ty; c.path.shift();
        if (!c.path.length) { const f = c.afterWalk; c.afterWalk = null; if (c.state === 'walk') c.state = 'idle'; if (f) f(); }
      } else { c.x += (dx / dist) * step; c.y += (dy / dist) * step; if (Math.abs(dx) > 0.05) c.flip = dx < 0; }
      c.bob = Math.abs(Math.sin(now / 110)) * -3;
    } else if (c.state === 'work') { c.bob = Math.sin(now / 140) * 1.2; if (now > c.stateUntil) { c.state = 'idle'; } }
    else if (c.state === 'talk' || c.state === 'alert') { c.bob = Math.sin(now / 220) * 1; if (now > c.stateUntil) c.state = 'idle'; }
    else c.bob = 0;
  });

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.scale, cam.scale);
  ctx.imageSmoothingEnabled = false;

  drawFloors();
  drawWalls();

  // y-sorted draw: furniture + characters together → sitting chars get occluded by desk fronts
  const items = [];
  FURN.forEach((f) => {
    const img = sprImgs[f.s];
    if (!img) return;
    items.push({ base: (f.y + f.h) * T, draw: () => {
      ctx.fillStyle = PAL.shadow;
      ctx.beginPath();
      ctx.ellipse((f.x + f.w / 2) * T, (f.y + f.h) * T - 3, f.w * T * 0.4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(img, f.x * T, f.y * T, f.w * T, f.h * T);
    } });
  });
  chars.forEach((c) => items.push({ base: (c.y + (c.seated ? 0.55 : 1)) * T, draw: () => drawChar(c, now) }));
  items.sort((a, b) => a.base - b.base).forEach((i) => i.draw());

  requestAnimationFrame(frame);
}

// ---------- boot ----------
(async () => {
  await loadSprites();
  resize();
  Object.keys(AGENTS).forEach((a) => ensureChar(a));
  connect();
  requestAnimationFrame(frame);
  if (location.hash === '#archive') openArchive();
})();
