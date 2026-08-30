import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MONUMENTS, monumentVar } from '../src/lib/monuments.ts';

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, '..', 'public', 'monuments');

let n = 0;
const test = (name, fn) => {
  fn();
  n++;
  console.log(`  ok  ${name}`);
};

const SCREENS = [
  'language',
  'phone',
  'otp',
  'social',
  'location',
  'capital',
  'category',
  'loading',
  'feasibility',
  'report',
  'swot',
  'competitors',
  'pricing',
  'scheme',
  'emi',
  'share',
  'home',
  'saved',
  'settings',
  'edit-photo',
  'edit-category',
  'empty',
];

test('every screen is assigned a monument', () => {
  for (const slug of SCREENS) {
    assert.ok(MONUMENTS[slug], `${slug} has no monument`);
  }
});

test('every real screen gets a distinct monument', () => {
  const seen = new Map();
  for (const slug of SCREENS) {
    if (slug === 'empty') continue;
    const file = MONUMENTS[slug];
    assert.ok(!seen.has(file), `${slug} reuses "${file}", already used by ${seen.get(file)}`);
    seen.set(file, slug);
  }
  assert.equal(seen.size, SCREENS.length - 1);
});

test('every referenced monument file exists', () => {
  for (const [slug, file] of Object.entries(MONUMENTS)) {
    assert.ok(fs.existsSync(path.join(dir, `${file}.svg`)), `${slug} points at missing ${file}.svg`);
  }
});

test('no monument file is orphaned', () => {
  const used = new Set(Object.values(MONUMENTS));
  for (const f of fs.readdirSync(dir)) {
    const name = f.replace(/\.svg$/, '');
    assert.ok(used.has(name), `${f} is not referenced by any screen`);
  }
});

test('each monument is a silhouette on the shared canvas', () => {
  for (const f of fs.readdirSync(dir)) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.match(svg, /viewBox="0 0 640 130"/, `${f} must use the shared canvas`);
    assert.ok(!/fill="#fff"/i.test(svg), `${f} uses a white fill, which is opaque in a mask`);
    assert.equal((svg.match(/<svg/g) ?? []).length, 1, `${f} must hold one root svg`);
  }
});

test('monumentVar builds a css url, and ignores unknown screens', () => {
  assert.equal(monumentVar('capital'), "url('/monuments/taj-mahal.svg')");
  assert.equal(monumentVar('not-a-screen'), undefined);
});

console.log(`\nOK — ${n} monument checks passed.`);
