'use strict';

/* Text audit: symbol artifacts, repeated words, and common misspellings
   in the visible copy of every page. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));

const MISSPELLINGS = [
  'teh', 'recieve', 'seperate', 'occured', 'definately', 'accomodate',
  'adress', 'calender', 'collegue', 'comming', 'commited', 'concious',
  'dissapoint', 'embarass', 'enviroment', 'existance', 'foriegn',
  'freind', 'goverment', 'gaurd', 'happend', 'immediatly', 'independant',
  'liason', 'maintenence', 'neccessary', 'noticable', 'occassion',
  'occurence', 'pharoah', 'posession', 'prefered', 'reccomend',
  'refered', 'relevent', 'religous', 'repitition', 'succesful',
  'supercede', 'tommorow', 'truely', 'untill', 'wierd', 'wich',
  'thier', 'becuase', 'begining', 'beleive', 'buisness', 'diferent',
  'dosent', 'firsty', 'greatful', 'higest', 'looses', 'transtions',
  'aidit', 'loaing', 'proffessional', 'stylst', 'colur', 'saloon',
];

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/gi, ' ');
}

let problems = 0;

for (const page of pages) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const text = visibleText(html);
  const issues = [];

  // symbol artifacts in visible copy
  for (const ch of ['{', '}', '[', ']', '|', '\\', '~', '^', '<', '>']) {
    if (text.includes(ch)) {
      const idx = text.indexOf(ch);
      issues.push(`symbol "${ch}" near: "...${text.slice(Math.max(0, idx - 30), idx + 30).replace(/\s+/g, ' ').trim()}..."`);
    }
  }

  // repeated words ("the the", "crumbs crumbs")
  const repeats = text.match(/\b([A-Za-z]{3,})\s+\1\b/gi) || [];
  for (const r of repeats) issues.push(`repeated word: "${r.replace(/\s+/g, ' ')}"`);

  // common misspellings (whole-word, case-insensitive)
  for (const word of MISSPELLINGS) {
    const re = new RegExp(`\\b${word}\\b`, 'i');
    const m = text.match(re);
    if (m) issues.push(`possible misspelling: "${m[0]}"`);
  }

  // leftover dev tokens
  for (const token of ['lorem', 'ipsum', 'TODO', 'FIXME', 'xxx', 'asdf', 'tbd']) {
    const re = new RegExp(`\\b${token}\\b`, 'i');
    if (re.test(text)) issues.push(`dev token: "${token}"`);
  }

  console.log(`${page}: ${issues.length} issue(s)`);
  for (const i of issues) console.log(`   - ${i}`);
  problems += issues.length;
}

console.log(problems === 0 ? '\nTEXT CLEAN' : `\n${problems} PROBLEM(S)`);
process.exit(problems === 0 ? 0 : 1);
