#!/usr/bin/env node
// Concord War Room — agent team activity monitor (read-only).
// Usage: node server.js   →  http://localhost:4777
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 4777;
const PROJECTS_ROOT = path.join(os.homedir(), '.claude', 'projects');
const TASKS_ROOT = path.join(os.homedir(), '.claude', 'tasks');
const ORDERS_FILE = '/Users/mac/Documents/premium-tutoring/OWNER_ORDERS.md';
function projName(dir) {
  const b = path.basename(dir);
  const m = b.replace(/^-Users-mac-?/, '').replace(/^Documents-/, '');
  return m || 'home';
}
const PUBLIC_DIR = path.join(__dirname, 'public');
const POLL_MS = 700;
const RING_MAX = 600;
const ACTIVE_WINDOW_MS = 3 * 60 * 60 * 1000; // sessions/tasks touched within 3h

const ROSTER = ['web-implementer', 'mobile-implementer', 'reviewer', 'qa-verifier', 'codex-operator', 'biz-strategist'];

// archive room: browsable doc roots (read-only, relative to project)
const PROJECT = '/Users/mac/Documents/premium-tutoring';
const DOC_ROOTS = [
  { label: '핸드오프', dir: PROJECT, pattern: /^(CLAUDE_HANDOFF|HANDOFF|README|CLAUDE)\.md$/ },
  { label: '사업 문서', dir: path.join(PROJECT, 'docs'), pattern: /\.md$/ },
  { label: '외부 제출', dir: path.join(PROJECT, 'docs', 'external'), pattern: /\.md$/ },
  { label: '내부 문서', dir: path.join(PROJECT, 'docs', 'internal'), pattern: /\.md$/ },
  { label: '팀 편제(스킬)', dir: path.join(PROJECT, '.claude', 'agents'), pattern: /\.md$/ },
  { label: '워룸 디자인', dir: path.join(PROJECT, 'tools', 'team-office', 'design'), pattern: /\.md$/ },
];

// ---- state ----
const fileOffsets = new Map();   // file → byte offset
const partialLine = new Map();   // file → trailing partial line
const sessionAgent = new Map();  // sessionId → agent name | 'LEAD'
const events = [];               // ring buffer
let tasksSnapshot = '';
let tasks = [];
const usageStats = new Map(); // rawKey(session|session#sub) → { model, in, out, sub, session }
let statsDirty = false;
const decisions = [];            // items needing owner judgment
const sseClients = new Set();

function pushDecision(d) {
  decisions.push(d);
  if (decisions.length > 100) decisions.splice(0, decisions.length - 100);
  push({ kind: 'decision', ...d });
  slackNotify(`📋 *결재 요청* — ${d.agent}${d.proj ? ` (${d.proj})` : ''}\n${d.text}`);
}

// Slack: put webhook URL in slack.json → {"webhook":"https://hooks.slack.com/services/..."}
function slackNotify(text) {
  let webhook;
  try { webhook = JSON.parse(fs.readFileSync(path.join(__dirname, 'slack.json'), 'utf8')).webhook; } catch { return; }
  if (!webhook || !webhook.startsWith('https://hooks.slack.com/')) return;
  const body = JSON.stringify({ text });
  const req = https.request(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } });
  req.on('error', () => {});
  req.end(body);
}

const LOG_FILE = path.join(__dirname, 'events.log');

function push(ev) {
  events.push(ev);
  if (events.length > RING_MAX) events.splice(0, events.length - RING_MAX);
  if (ev.kind !== 'tasks') fs.appendFile(LOG_FILE, JSON.stringify(ev) + '\n', () => {});
  const data = `data: ${JSON.stringify(ev)}\n\n`;
  for (const res of sseClients) res.write(data);
}

// restore history from previous runs
function loadLog() {
  let raw;
  try { raw = fs.readFileSync(LOG_FILE, 'utf8'); } catch { return; }
  const lines = raw.split('\n').filter(Boolean);
  const keep = lines.slice(-RING_MAX);
  for (const line of keep) {
    try {
      const ev = JSON.parse(line);
      if (ev.kind === 'roster' && ev.roster) {
        for (const [sid, name] of Object.entries(ev.roster)) sessionAgent.set(sid, name);
        continue;
      }
      events.push(ev);
      if (ev.kind === 'decision') decisions.push(ev);
    } catch { /* ignore */ }
  }
  if (decisions.length > 100) decisions.splice(0, decisions.length - 100);
  // ponytail: naive rotation — rewrite file with kept tail when it grows past ~5MB
  if (raw.length > 5 * 1024 * 1024) fs.writeFile(LOG_FILE, keep.join('\n') + '\n', () => {});
}

function short(s, n = 160) {
  if (typeof s !== 'string') return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function identify(sessionId, text) {
  if (sessionAgent.has(sessionId)) return;
  const lower = text.toLowerCase();
  for (const name of ROSTER) {
    // teammate system prompts embed the agent definition
    if (lower.includes(name)) { sessionAgent.set(sessionId, name); pushRoster(); return; }
  }
}

function pushRoster() {
  push({ kind: 'roster', ts: Date.now(), roster: Object.fromEntries(sessionAgent) });
}

function agentOf(sessionId) {
  return sessionAgent.get(sessionId) || 'session-' + sessionId.slice(0, 4);
}

function toolDesc(name, input) {
  if (!input) return name;
  return short(input.description || input.prompt || input.file_path || input.command || input.pattern || input.query || '', 120);
}

function handleLine(file, line, proj, subOf) {
  let obj;
  try { obj = JSON.parse(line); } catch { return; }
  const sessionId = subOf || obj.sessionId || path.basename(file, '.jsonl');
  const ts = obj.timestamp ? Date.parse(obj.timestamp) : Date.now();
  const sub = subOf ? (obj.agentId || 'sub').slice(0, 6) : undefined;

  const msg = obj.message;
  if (!msg || !Array.isArray(msg.content)) return;
  const emit = (o) => { o.proj = proj; if (sub) o.sub = sub; push(o); };

  if (obj.type === 'assistant' && (msg.model || msg.usage)) {
    const rawKey = sub ? sessionId + '#' + sub : sessionId;
    let rec = usageStats.get(rawKey);
    if (!rec) { rec = { model: '', in: 0, out: 0, sub, session: sessionId }; usageStats.set(rawKey, rec); }
    if (msg.model) rec.model = msg.model;
    const u = msg.usage;
    if (u) {
      rec.in += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
      rec.out += u.output_tokens || 0;
    }
    statsDirty = true;
  }

  for (const block of msg.content) {
    if (obj.type === 'assistant' && block.type === 'text' && block.text) {
      if (!sub) identify(sessionId, block.text);
      emit({ kind: 'say', ts, agent: agentOf(sessionId), text: short(block.text) });
    } else if (obj.type === 'assistant' && block.type === 'tool_use') {
      const { name, input } = block;
      if (name === 'AskUserQuestion') {
        const qs = (input && input.questions || []).map(q => q.question).join(' / ');
        pushDecision({ ts, agent: agentOf(sessionId), proj, text: short(qs, 300), id: ts + '-' + Math.random().toString(36).slice(2, 7) });
      } else if (name === 'SendMessage') {
        const to = (input && (input.to || input.recipient)) || '?';
        const text = short(input && (input.content || input.message || input.prompt) || '', 300);
        if (/^(user|owner|오너|사용자)$/i.test(to)) {
          pushDecision({ ts, agent: agentOf(sessionId), proj, text, id: ts + '-' + Math.random().toString(36).slice(2, 7) });
        } else {
          emit({ kind: 'message', ts, agent: agentOf(sessionId), to, text: short(text, 160) });
        }
      } else if (name === 'Agent' || name === 'TeamCreate') {
        if (!sub) { sessionAgent.set(sessionId, sessionAgent.get(sessionId) || 'LEAD'); pushRoster(); }
        emit({ kind: 'spawn', ts, agent: agentOf(sessionId), text: short(input && (input.description || ''), 100), agentType: (input && (input.subagent_type || input.name)) || '' });
      } else if (name === 'TaskCreate' || name === 'TaskUpdate') {
        emit({ kind: 'order', ts, agent: agentOf(sessionId), text: short(((input && input.subject) || (input && input.taskId) || '') + ' ' + ((input && input.status) || ''), 120) });
      } else {
        emit({ kind: 'tool', ts, agent: agentOf(sessionId), tool: name, text: toolDesc(name, input) });
      }
    } else if (obj.type === 'user' && block.type === 'tool_result' && block.is_error) {
      emit({ kind: 'error', ts, agent: agentOf(sessionId), text: short(typeof block.content === 'string' ? block.content : JSON.stringify(block.content), 140) });
    } else if (obj.type === 'user' && block.type === 'text' && typeof block.text === 'string') {
      if (!sub) identify(sessionId, block.text);
    }
  }
}

function tailFile(full, proj, subOf) {
  let st;
  try { st = fs.statSync(full); } catch { return; }
  if (Date.now() - st.mtimeMs > ACTIVE_WINDOW_MS) return;
  if (!fileOffsets.has(full)) { fileOffsets.set(full, st.size); return; } // first sight: tail from now
  const prev = fileOffsets.get(full);
  if (st.size <= prev) { fileOffsets.set(full, Math.min(prev, st.size)); return; }
  const fd = fs.openSync(full, 'r');
  const buf = Buffer.alloc(st.size - prev);
  fs.readSync(fd, buf, 0, buf.length, prev);
  fs.closeSync(fd);
  fileOffsets.set(full, st.size);
  const chunk = (partialLine.get(full) || '') + buf.toString('utf8');
  const lines = chunk.split('\n');
  partialLine.set(full, lines.pop() || '');
  for (const line of lines) if (line.trim()) handleLine(full, line, proj, subOf);
}

function pollTranscripts() {
  let projDirs;
  try { projDirs = fs.readdirSync(PROJECTS_ROOT); } catch { return; }
  const now = Date.now();
  for (const pd of projDirs) {
    const dir = path.join(PROJECTS_ROOT, pd);
    let st;
    try { st = fs.statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue; // dir mtime not updated by appends — per-file window check below
    const proj = projName(dir);
    let entries;
    try { entries = fs.readdirSync(dir); } catch { continue; }
    for (const f of entries) {
      if (f.endsWith('.jsonl')) { tailFile(path.join(dir, f), proj); continue; }
      // session dirs may hold subagents/agent-*.jsonl
      const subDir = path.join(dir, f, 'subagents');
      let sst;
      try { sst = fs.statSync(subDir); } catch { continue; }
      if (!sst.isDirectory()) continue;
      let subs;
      try { subs = fs.readdirSync(subDir).filter(s => s.endsWith('.jsonl')); } catch { continue; }
      for (const s of subs) tailFile(path.join(subDir, s), proj, f);
    }
  }
}

function pollTasks() {
  let dirs;
  try { dirs = fs.readdirSync(TASKS_ROOT); } catch { return; }
  const now = Date.now();
  const list = [];
  for (const d of dirs) {
    const dir = path.join(TASKS_ROOT, d);
    let st;
    try { st = fs.statSync(dir); } catch { continue; }
    if (!st.isDirectory() || now - st.mtimeMs > ACTIVE_WINDOW_MS) continue;
    let items;
    try { items = fs.readdirSync(dir).filter(f => f.endsWith('.json')); } catch { continue; }
    for (const f of items) {
      try {
        const t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        list.push({ id: t.id, subject: t.subject, status: t.status, activeForm: t.activeForm, session: d.slice(0, 4), blockedBy: t.blockedBy || [] });
      } catch { /* ignore */ }
    }
  }
  list.sort((a, b) => Number(a.id) - Number(b.id));
  const snap = JSON.stringify(list);
  if (snap !== tasksSnapshot) {
    tasksSnapshot = snap;
    tasks = list;
    push({ kind: 'tasks', ts: Date.now(), tasks: list });
  }
}

const STATS_FILE = path.join(__dirname, 'stats.json');
function loadStats() {
  try {
    const saved = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    for (const [k, v] of Object.entries(saved)) usageStats.set(k, v);
  } catch { /* first run */ }
}
function saveStats() {
  fs.writeFile(STATS_FILE, JSON.stringify(Object.fromEntries(usageStats)), () => {});
}
setInterval(() => { if (usageStats.size) saveStats(); }, 30000);

function statsPayload() {
  const out = {};
  usageStats.forEach((rec) => {
    const agent = agentOf(rec.session);
    const key = rec.sub ? `sub:${agent}:${rec.sub}` : agent;
    const cur = out[key] || { model: '', in: 0, out: 0 };
    cur.model = rec.model || cur.model;
    cur.in += rec.in;
    cur.out += rec.out;
    out[key] = cur;
  });
  return out;
}
loadLog();
loadStats();
setInterval(() => {
  pollTranscripts();
  pollTasks();
  if (statsDirty) {
    statsDirty = false;
    const data = `data: ${JSON.stringify({ kind: 'stats', ts: Date.now(), stats: statsPayload() })}\n\n`;
    for (const res of sseClients) res.write(data);
  }
}, POLL_MS);

// ---- http ----
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify({ kind: 'hello', ts: Date.now(), roster: Object.fromEntries(sessionAgent), tasks, decisions: decisions.slice(-30), recent: events.slice(-120), stats: statsPayload() })}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }
  if (url === '/docs') {
    const out = [];
    for (const root of DOC_ROOTS) {
      let files = [];
      try { files = fs.readdirSync(root.dir).filter(f => root.pattern.test(f) && fs.statSync(path.join(root.dir, f)).isFile()); } catch { /* ignore */ }
      if (files.length) out.push({ label: root.label, dir: root.dir, files: files.sort() });
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out));
    return;
  }
  if (url === '/order' && req.method === 'POST') {
    let body = '';
    req.on('data', (d) => { body += d; if (body.length > 10000) req.destroy(); });
    req.on('end', () => {
      try {
        const { text, to } = JSON.parse(body);
        if (!text || typeof text !== 'string') throw new Error('no text');
        const ts = Date.now();
        const stamp = new Date(ts).toISOString().replace('T', ' ').slice(0, 16);
        fs.appendFileSync(ORDERS_FILE, `- [${stamp}] (${to || '전체'}) ${text.replace(/\n/g, ' ')}\n`);
        push({ kind: 'owner-order', ts, agent: 'OWNER', to: to || '전체', text: text.slice(0, 300) });
        slackNotify(`★ *사령관 명령* → ${to || '전체'}\n${text.slice(0, 300)}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch { res.writeHead(400); res.end('{"ok":false}'); }
    });
    return;
  }
  if (url === '/doc') {
    const q = new URLSearchParams(req.url.split('?')[1] || '');
    const dir = q.get('dir'), file = q.get('f');
    const root = DOC_ROOTS.find(r => r.dir === dir);
    const fpDoc = root && file && !file.includes('/') && !file.includes('..') ? path.join(root.dir, file) : null;
    if (!fpDoc || !root.pattern.test(file)) { res.writeHead(400); res.end('bad path'); return; }
    fs.readFile(fpDoc, 'utf8', (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(data);
    });
    return;
  }
  if (url === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ roster: Object.fromEntries(sessionAgent), tasks, events: events.slice(-200), stats: statsPayload() }));
    return;
  }
  const fp = path.join(PUBLIC_DIR, url === '/' ? 'index.html' : url);
  if (!fp.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end(); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Concord War Room → http://localhost:${PORT}`));
