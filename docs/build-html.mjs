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
  // 전 탭 재저작 문서 1권씩 — 원문 md는 레포에 보존(DB), 여기서는 나열하지 않는다.
  { out: '00-결정.html', title: '① 결정 대기', files: [ '결정대기.md' ] },
  { out: '00b-개선책.html', title: '② 개선책', files: [ '개선책.md' ] },
  { out: '10-방향.html', title: '방향·현황', files: [ 'chapters/방향현황.md' ] },
  { out: '20-전략.html', title: '전략', files: [ 'chapters/전략.md' ] },
  { out: '30-마케팅.html', title: '마케팅·카피', files: [ 'chapters/마케팅.md' ] },
  { out: '40-제품.html', title: '제품·디자인', files: [ 'chapters/제품.md' ] },
  { out: '50-운영.html', title: '운영·파일럿', files: [ 'chapters/운영.md' ] },
  { out: '60-법무·기술.html', title: '법무·기술', files: [ 'chapters/법무기술.md' ] },
  { out: '70-대외·IR.html', title: '대외·IR', files: [ 'chapters/대외IR.md' ] },
  { out: '80-자산.html', title: '제출·발표 자산', special: 'assets' },
];

// 제출·발표 자산 — external/dist 전량 + branding 제출용 PDF를 files/로 복사해 목록 페이지 생성
const ASSET_DESC = {
  'Concord-Business-Plan-PSST.pdf': 'PSST 사업계획서 12p — 예비창업패키지 제출 베이스 (2025 실측)',
  'Concord-Financial-Model.xlsx': '재무 모델 — 플랜 마진·BEP·램프업 3시나리오·CAC. 가정 셀 수정 시 재계산',
  'Concord-IR-OnePager.pdf': 'IR 원페이저 1p — v1.1 (2025 실측·서울·동탄)',
  'Concord-IR-Deck.pdf': 'IR 덱 13p — v1.1 (2025 실측·서울·동탄)',
  'Concord-Teacher-Recruit.pdf': '강사 채용 안내 1장 — 공고 첨부용, 정산 구조 사실만',
  'Concord-Consult-Guide.pdf': '학부모 방문 상담 안내 1장 — 방문 전 전달용',
  'Concord-Brand-Guidelines.pdf': '브랜드 가이드라인 11p',
  'Concord-App-Guide.pdf': '앱 가이드 — 역할별 화면 안내 (대용량)',
  'Concord-CEO-Proposal.pdf': '대표 제안서 — 07-12판 (서사 B 반영 전, 사용 전 점검)',
};
const EXTRA_ASSETS = [
  'branding/Concord-Brand-Guidelines.pdf',
  'branding/Concord-App-Guide.pdf',
  'branding/Concord-CEO-Proposal.pdf',
];

function buildAssets() {
  const dist = path.join(DOCS, 'external/dist');
  const filesDir = path.join(OUT, 'files');
  fs.mkdirSync(filesDir, { recursive: true });
  const names = [];
  if (fs.existsSync(dist)) for (const f of fs.readdirSync(dist)) {
    fs.copyFileSync(path.join(dist, f), path.join(filesDir, f));
    names.push(f);
  }
  for (const rel of EXTRA_ASSETS) {
    const abs = path.join(DOCS, rel), f = path.basename(rel);
    if (fs.existsSync(abs) && !names.includes(f)) {
      fs.copyFileSync(abs, path.join(filesDir, f));
      names.push(f);
    }
  }
  const order = Object.keys(ASSET_DESC);
  names.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  const fmt = n => n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.round(n / 1e3) + ' KB';
  const rows = names.map(f => {
    const size = fs.statSync(path.join(filesDir, f)).size;
    const ext = f.split('.').pop().toUpperCase();
    const preview = ext === 'PDF' ? `<a href="files/${f}" target="_blank">미리보기</a> · ` : '';
    return `<tr><td><strong>${esc(f)}</strong><br><span style="color:var(--mut);font-size:12.5px">${esc(ASSET_DESC[f] || '')}</span></td><td>${ext}</td><td style="white-space:nowrap">${fmt(size)}</td><td style="white-space:nowrap">${preview}<a href="files/${f}" download>다운로드</a></td></tr>`;
  }).join('');
  return `<h1>제출·발표 자산</h1>
<p>외부 제출·발표용 실물 파일. 원장은 저장소 <code>docs/external/dist</code>·<code>docs/branding</code>.</p>
<table><thead><tr><th>문서</th><th>형식</th><th>크기</th><th>받기</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function resolveFiles(g) {
  if (g.special) return [];
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
.lead{font-size:14px;color:var(--mut);margin:2px 0 30px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.docsep{border:0;border-top:1px solid var(--line);margin:0 0 40px}
section:first-child .docsep{display:none}
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

const docTitle = (md, fallback) => {
  const m = md.match(/^#\s+(.+?)\s*$/m);
  return (m ? m[1] : fallback).replace(/[*`_]/g, '').trim();
};

function pageHtml(g) {
  const files = resolveFiles(g);
  const multi = files.length > 1;
  let body = '', toc = '';
  for (const rel of files) {
    const abs = path.join(DOCS, rel);
    const md = fs.readFileSync(abs, 'utf8');
    const id = slug(rel);
    const title = docTitle(md, rel.replace(/^\.\.\//, '').replace(/\.md$/, ''));
    // 여러 문서를 한 탭에 이을 때만 문서 경계 표시(단권화 단일 문서는 경계 없음)
    const rule = multi ? '<hr class="docsep">' : '';
    body += `<section id="${id}">${rule}${marked.parse(md)}</section>`;
    toc += `<li><a href="#${id}">${esc(title)}</a></li>`;
  }
  if (g.special === 'assets') body = buildAssets();
  // 단일 문서 탭: H2에 앵커를 달고 좌측 목차를 H2로 구성
  if (!multi) {
    toc = '';
    body = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, inner) => {
      const plain = inner.replace(/<[^>]+>/g, '');
      const hid = slug(plain);
      toc += `<li><a href="#${hid}">${plain}</a></li>`;
      return `<h2 id="${hid}">${inner}</h2>`;
    });
  }
  const tocBlock = toc
    ? `<nav class="toc"><span class="eyebrow">${multi ? '이 탭의 문서' : '목차'}</span><ul>${toc}</ul></nav>`
    : '';
  const lead = g.lead ? `<p class="lead">${esc(g.lead)}</p>` : '';
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(g.title)} — Concord 문서</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>${CSS}</style></head><body>
<div class="tabs"><span class="brand">Concord<span class="dot"></span></span>${tabs(g.out)}</div>
<div class="wrap">
${tocBlock}
<main>${lead}${body}</main>
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
