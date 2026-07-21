'use strict';

/* Structure audit: duplicate IDs and unbalanced structural tags per page. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const TAGS = ['div', 'section', 'header', 'footer', 'main', 'form', 'nav', 'article', 'ul', 'ol'];

let problems = 0;

for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const issues = [];

  const ids = {};
  let m;
  const idRe = /id="([^"]+)"/g;
  while ((m = idRe.exec(html)) !== null) ids[m[1]] = (ids[m[1]] || 0) + 1;
  const dups = Object.keys(ids).filter((k) => ids[k] > 1);
  if (dups.length) issues.push(`duplicate ids: ${dups.join(', ')}`);

  for (const tag of TAGS) {
    const open = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) issues.push(`<${tag}> open ${open} vs close ${close}`);
  }

  console.log(`${page}: ${issues.length} issue(s)`);
  for (const i of issues) console.log(`   - ${i}`);
  problems += issues.length;
}

console.log(problems === 0 ? '\nSTRUCTURE CLEAN' : `\n${problems} PROBLEM(S)`);
process.exit(problems === 0 ? 0 : 1);
