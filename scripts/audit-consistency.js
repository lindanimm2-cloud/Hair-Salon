'use strict';

/* Consistency audit: nav, footer, and required includes on every page. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

const NAV_PAGES = ['index.html', 'about.html', 'portfolio.html', 'services.html', 'studio.html', 'social.html', 'book.html'];
const FOOTER_PAGES = [...NAV_PAGES, 'privacy.html'];

let problems = 0;

for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const issues = [];

  const navMatch = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/);
  if (!navMatch) {
    issues.push('missing primary nav');
  } else {
    for (const p of NAV_PAGES) {
      if (!navMatch[0].includes(`href="${p}"`)) issues.push(`nav missing link to ${p}`);
    }
  }

  const footMatch = html.match(/<div class="footer__links">[\s\S]*?<\/div>/);
  if (!footMatch) {
    issues.push('missing footer links block');
  } else {
    for (const p of FOOTER_PAGES) {
      if (!footMatch[0].includes(`href="${p}"`)) issues.push(`footer missing link to ${p}`);
    }
  }

  if (!html.includes('css/styles.css')) issues.push('missing styles.css');
  if (!html.includes('js/main.js')) issues.push('missing main.js');
  if (page !== 'index.html' && !html.includes('css/pages.css')) issues.push('missing pages.css');
  if (!html.includes('<title>')) issues.push('missing <title>');
  if (!html.includes('name="viewport"')) issues.push('missing viewport meta');
  if (!/aria-current="page"/.test(html) && page !== 'thank-you.html') issues.push('no aria-current marker');

  console.log(`${page}: ${issues.length} issue(s)`);
  for (const i of issues) console.log(`   - ${i}`);
  problems += issues.length;
}

// orphaned assets: files in assets/ never referenced by any page or css
const assetDir = path.join(ROOT, 'assets');
if (fs.existsSync(assetDir)) {
  const allHtml = pages.map((p) => fs.readFileSync(path.join(ROOT, p), 'utf8')).join('\n');
  const allCss = fs.readdirSync(path.join(ROOT, 'css'))
    .map((c) => fs.readFileSync(path.join(ROOT, 'css', c), 'utf8')).join('\n');
  const unused = fs.readdirSync(assetDir).filter(
    (f) => !allHtml.includes(`assets/${f}`) && !allCss.includes(f),
  );
  if (unused.length) console.log(`\nUnreferenced assets (informational): ${unused.join(', ')}`);
}

console.log(problems === 0 ? '\nCONSISTENCY CLEAN' : `\n${problems} PROBLEM(S)`);
process.exit(problems === 0 ? 0 : 1);
