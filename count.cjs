// count.cjs
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const excludeDirs = new Set(['node_modules','.git','dist','build','coverage','.expo','uploads','.next','out','.vs','.idea']);
const excludeFiles = new Set(['package-lock.json','yarn.lock','pnpm-lock.yaml']);
const map = {
  '.ts':'TypeScript', '.tsx':'TypeScript + React (TSX)',
  '.js':'JavaScript', '.jsx':'JavaScript + React (JSX)',
  '.mjs':'JavaScript (ESM)', '.cjs':'JavaScript (CJS)',
  '.sql':'SQL', '.json':'JSON', '.css':'CSS', '.html':'HTML',
  '.md':'Markdown', '.yml':'YAML', '.yaml':'YAML',
  '.ps1':'PowerShell', '.sh':'Shell', '.bat':'Batch', '.cmd':'Batch',
  '.kt':'Kotlin', '.java':'Java', '.gradle':'Gradle',
  '.xml':'XML', '.properties':'Properties', '.conf':'Config'
};

const stats = {};
function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (excludeDirs.has(e.name)) continue;
      walk(full);
    } else if (e.isFile()) {
      if (excludeFiles.has(e.name)) continue;
      if (/\.(map|min\.js|min\.css)$/.test(e.name)) continue;
      const ext = path.extname(e.name).toLowerCase();
      const lang = map[ext] || `Other (${ext || 'no ext'})`;
      let lines = 0;
      try { lines = fs.readFileSync(full, 'utf8').split('\n').length; } catch {}
      if (!stats[lang]) stats[lang] = { files: 0, lines: 0 };
      stats[lang].files++;
      stats[lang].lines += lines;
    }
  }
}
walk(root);

const rows = Object.entries(stats).map(([lang, s]) => ({ lang, ...s }));
rows.sort((a, b) => b.lines - a.lines);
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('Language', 32), pad('Files', 8), 'Lines');
console.log('-'.repeat(55));
let tf = 0, tl = 0;
for (const r of rows) {
  console.log(pad(r.lang, 32), pad(r.files, 8), r.lines);
  tf += r.files; tl += r.lines;
}
console.log('-'.repeat(55));
console.log(pad('TOTAL', 32), pad(tf, 8), tl);