'use strict';

/* Static audit: every href/src/action in each HTML file must resolve. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

const ATTR_RE = /(?:href|src|action)\s*=\s*"([^"]*)"/g;
let problems = 0;
const summary = {};

for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const refs = [];
  let m;
  while ((m = ATTR_RE.exec(html)) !== null) refs.push(m[1]);

  // book-form actions are intentionally "#": JS intercepts submit and redirects
  const jsHandledForms = (html.match(/class="book-form"[^>]*action="#"/g) || [])
    .length + (html.match(/action="#"[^>]*class="book-form"/g) || []).length;
  let placeholderBudget = jsHandledForms;

  const issues = [];
  for (const ref of refs) {
    if (!ref || ref === '#') {
      if (placeholderBudget > 0) {
        placeholderBudget -= 1;
      } else {
        issues.push(`placeholder link: "${ref}"`);
      }
      continue;
    }
    if (/^(https?:|mailto:|tel:|data:)/i.test(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue; // pure fragment like "#book"
    const target = path.join(ROOT, clean);
    if (!fs.existsSync(target)) issues.push(`missing target: ${ref}`);
  }

  // fragment anchors must exist in the same page
  const fragRe = /href\s*=\s*"#([^"]+)"/g;
  while ((m = fragRe.exec(html)) !== null) {
    const id = m[1];
    if (!new RegExp(`id\\s*=\\s*"${id}"`).test(html)) {
      issues.push(`broken anchor: #${id}`);
    }
  }

  summary[page] = { refs: refs.length, issues };
  problems += issues.length;
}

for (const [page, { refs, issues }] of Object.entries(summary)) {
  console.log(`${page}: ${refs} refs, ${issues.length} issue(s)`);
  for (const issue of issues) console.log(`   - ${issue}`);
}
console.log(problems === 0 ? '\nAUDIT CLEAN' : `\n${problems} PROBLEM(S) FOUND`);
process.exit(problems === 0 ? 0 : 1);
