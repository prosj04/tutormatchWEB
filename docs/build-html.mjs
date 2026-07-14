#!/usr/bin/env node
// 사업 문서(md) 전체를 브랜드 스타일 HTML 몇 개로 묶어 빌드.
// 디자인 토큰 = docs/branding/brand-guidelines.html. marked로 MD->HTML.
import { marked } from 'marked';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DOCS, '..');
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.join(DOCS, '_html');

marked.setOptions({ gfm: true, breaks: false });

// 하위 디렉터리의 .md 전량(재귀) 수집
function walkMd(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMd(p));
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out.sort();
}

// 그룹 정의: files = 명시 순서(경로는 DOCS/ROOT 기준), dir = 재귀 수집
const groups = [
  { out: '00-결정.html', title: '① 결정 대기', files: [ '결정대기.md' ] },
  { out: '00b-개선책.html', title: '② 개선책', files: [ '개선책.md' ] },
  { out: '01-개요.html', title: '원문·개요', files: [
    '00-현재상태.md', 'README.md', 'CONTENT_AUDIT_2026-07-14.md',
    'CLEANUP_AUDIT_2026-07-14.md', 'SECURITY_AUDIT_2026-07-14.md',
    'BUSINESS_DIRECTION.md', 'FRONTEND_BUILD_SPEC.md', '../HANDOFF.md', '../README.md',
  ] },
  { out: '02-사업전략.html', title: '사업전략', files: [
    '10-사업전략.md', 'BUSINESS_IMPROVEMENT_MASTER_2026-07.md',
    'BUSINESS_EXPANSION_MASTER_2026-07.md',
  ] },
  { out: '03-리뷰·마케팅.html', title: '리뷰·마케팅', files: [
    '11-사업리뷰·취약점.md', '20-마케팅.md', 'COPY_ALTERNATIVES.md',
  ] },
  { out: '04-제품·디자인.html', title: '제품·디자인', files: [ '30-제품·디자인.md' ] },
  { out: '05-운영·파일럿.html', title: '운영·파일럿·구현', files: [
    '40-파일럿.md', 'PILOT_SIM2_2026-07.md', 'IMPLEMENTATION_PLAN_2026-07.md',
    'IMPLEMENTATION_SESSIONS_REVISED.md', 'REFACTORING_PLAN.md',
    'MANAGER_GUIDELINES.md', 'OWNER_EXECUTION_QUEUE.md', 'STORE_SUBMISSION_2026-07.md',
    'PHOTO_GENERATION_PROMPT.md', 'PHOTO_SHOOT_LIST.md', 'session-instructions.md',
  ] },
  { out: '06-내부·기술.html', title: '내부·기술', dir: 'internal' },
  { out: '07-외부·제출.html', title: '외부·제출', dir: 'external' },
  { out: '08-전략라운드.html', title: '전략 라운드', dir: 'strategy-rounds' },
  { out: '09-아카이브.html', title: '아카이브', dir: 'archive' },
];

function resolveFiles(g) {
  if (g.dir) return walkMd(path.join(DOCS, g.dir)).map(p => path.relative(DOCS, p));
  return g.files.filter(f => fs.existsSync(path.join(DOCS, f)));
}

const slug = s => 'd-' + s.replace(/[^a-zA-Z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function tabs(cur) {
  return groups.map(g =>
    `<a class="tab${g.out === cur ? ' active' : ''}" href="${g.out}">${esc(g.title)}</a>`
  ).join('');
}

const CSS = `
:root{
  --green:#10B981;--green-text:#07875A;--bg:#FAF9F4;--panel:#FFFFFF;--panel2:#F0EFE7;
  --fg:#161A16;--mut:#585C53;--mut2:#9AA095;--line:rgba(34,38,30,.085);--line2:rgba(34,38,30,.15);
}
*{box-sizing:border-box}
html,body{margin:0;font-family:"Pretendard Variable",Pretendard,-apple-system,system-ui,sans-serif}
body{color:var(--fg);background:var(--bg);line-height:1.65;letter-spacing:-.01em;word-break:keep-all;-webkit-font-smoothing:antialiased}
.tabs{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;gap:2px;padding:11px 22px;background:rgba(250,249,244,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.brand{font-weight:800;letter-spacing:-.03em;font-size:16px;margin-right:14px;align-self:center}
.brand .dot{display:inline-block;width:.16em;height:.16em;border-radius:50%;background:var(--green);vertical-align:baseline;margin-left:.05em}
.tab{padding:6px 13px;border-radius:999px;text-decoration:none;color:var(--mut);font-size:13px;font-weight:700}
.tab:hover{background:var(--panel2)}
.tab.active{background:var(--fg);color:#fff}
.wrap{display:flex;max-width:1440px;margin:0 auto;gap:34px;padding:0 22px}
.toc{position:sticky;top:60px;align-self:flex-start;flex:0 0 230px;font-size:12.5px;padding:26px 0;max-height:calc(100vh - 60px);overflow:auto}
.toc .eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--green-text);margin-bottom:9px;display:block}
.toc ul{list-style:none;padding:0;margin:0}
.toc li{margin:2px 0}
.toc a{text-decoration:none;color:var(--mut);display:block;padding:4px 9px;border-radius:8px;word-break:break-all}
.toc a:hover{background:var(--panel2);color:var(--fg)}
main{flex:1;min-width:0;padding:34px 0 140px}
section{margin-bottom:64px;padding-bottom:44px;border-bottom:1px solid var(--line)}
.fname{display:inline-block;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:var(--green-text);background:var(--panel2);padding:4px 10px;border-radius:999px;margin-bottom:14px;letter-spacing:0}
main h1{font-size:30px;font-weight:800;letter-spacing:-.038em;line-height:1.12;border-bottom:1px solid var(--line);padding-bottom:10px;margin:.2em 0 .6em}
main h2{font-size:22px;font-weight:800;letter-spacing:-.03em;margin:1.8em 0 .5em}
main h3{font-size:17px;font-weight:800;letter-spacing:-.02em;margin:1.5em 0 .4em}
main h4{font-size:14px;font-weight:700;color:var(--mut);margin:1.3em 0 .3em}
main p{margin:.7em 0}
main a{color:var(--green-text);text-decoration:none;border-bottom:1px solid var(--line2)}
main strong{font-weight:800}
main code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86em;background:var(--panel2);padding:1.5px 6px;border-radius:6px}
main pre{background:var(--fg);color:#ECEEEC;padding:16px 18px;border-radius:14px;overflow:auto;box-shadow:0 1px 2px rgba(34,38,30,.05),0 3px 10px rgba(34,38,30,.06)}
main pre code{background:none;color:inherit;padding:0;font-size:12.5px}
main blockquote{margin:1.1em 0;padding:12px 20px;border-left:3px solid var(--green);background:var(--panel);border-radius:0 12px 12px 0;color:var(--mut)}
main blockquote p{margin:.3em 0}
main table{border-collapse:collapse;width:100%;margin:1.1em 0;font-size:13.5px;display:block;overflow-x:auto;border-radius:14px}
main th,main td{border:1px solid var(--line);padding:8px 12px;text-align:left;vertical-align:top}
main th{background:var(--panel2);font-weight:800;letter-spacing:-.01em}
main td{background:var(--panel)}
main tr:nth-child(even) td{background:#FCFBF7}
main del{color:var(--mut2)}
main hr{border:0;border-top:1px solid var(--line);margin:2em 0}
main ul,main ol{padding-left:22px;margin:.6em 0}
main li{margin:4px 0}
main li::marker{color:var(--green-text)}
main img{max-width:100%;border-radius:12px}
@media(max-width:860px){.toc{display:none}.wrap{padding:0 15px}.tabs{padding:10px 15px}}
`;

function pageHtml(g) {
  const files = resolveFiles(g);
  let body = '', toc = '';
  for (const rel of files) {
    const abs = path.join(DOCS, rel);
    const md = fs.readFileSync(abs, 'utf8');
    const id = slug(rel);
    const label = rel.replace(/^\.\.\//, '');
    body += `<section id="${id}"><span class="fname">${esc(label)}</span>${marked.parse(md)}</section>`;
    toc += `<li><a href="#${id}">${esc(label)}</a></li>`;
  }
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(g.title)} — Concord 문서</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>${CSS}</style></head><body>
<div class="tabs"><span class="brand">Concord<span class="dot"></span></span>${tabs(g.out)}</div>
<div class="wrap">
<nav class="toc"><span class="eyebrow">이 묶음 문서 ${files.length}</span><ul>${toc}</ul></nav>
<main>${body}</main>
</div></body></html>`;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let total = 0;
for (const g of groups) {
  const n = resolveFiles(g).length;
  total += n;
  fs.writeFileSync(path.join(OUT, g.out), pageHtml(g));
  console.log(`built ${g.out.padEnd(22)} (${n} docs)`);
}
fs.writeFileSync(path.join(OUT, 'index.html'),
  `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=00-결정.html"><a href="00-결정.html">결정 대기로 이동</a>`);
console.log(`\ntotal ${total} docs -> ${groups.length} html files in ${path.relative(ROOT, OUT)}/`);
