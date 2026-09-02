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

/* --------------------------------------------------------------------------
   The desktop layout (/desktop) reuses this same map and the same SVGs - the
   same slug shows the same monument on both layouts. These give it the phone's
   guarantee: no screen without a monument, no monument without a screen.
   -------------------------------------------------------------------------- */

const appDir = path.join(root, '..', 'app');
const routes = (layout) =>
  fs
    .readdirSync(path.join(appDir, layout), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

const DESKTOP = routes('desktop');

test('every desktop screen is assigned a monument', () => {
  assert.ok(DESKTOP.length >= 19, `expected the full desktop tree, found ${DESKTOP.length}`);
  for (const slug of DESKTOP) {
    assert.ok(MONUMENTS[slug], `/desktop/${slug} has no monument`);
  }
});

test('a slug shows the same monument on both layouts', () => {
  for (const slug of routes('screens')) {
    if (!DESKTOP.includes(slug)) continue;
    assert.equal(
      monumentVar(slug),
      monumentVar(slug),
      `${slug} must resolve to one monument for both layouts`,
    );
    assert.ok(MONUMENTS[slug], `${slug} has no monument`);
  }
});

test('no monument is orphaned across both layouts', () => {
  const reachable = new Set([...routes('screens'), ...DESKTOP]);
  for (const slug of Object.keys(MONUMENTS)) {
    assert.ok(reachable.has(slug), `${slug} is mapped but is not a screen in either layout`);
  }
});

test('the desktop layout wires the monument in', () => {
  const src = fs.readFileSync(path.join(appDir, 'desktop', 'layout.tsx'), 'utf8');
  assert.match(src, /monumentVar/, 'app/desktop/layout.tsx must set --monument, as the phone does');
  assert.match(src, /'--monument'/, 'the custom property must reach the shells');
});

test('all three desktop chromes paint the monument in their content area', () => {
  const shell = fs.readFileSync(path.join(root, '..', 'src', 'features', 'desktop', 'shell.tsx'), 'utf8');
  // SplitShell, TopBarShell and DesktopShell - one marked content area each, so
  // every screen gets it whichever chrome it renders
  assert.equal(
    (shell.match(/dc-monument/g) ?? []).length,
    3,
    'each of the three chromes marks exactly one content area',
  );
  assert.ok(
    !/dc-desk-side dc-monument|dc-monument dc-desk-side/.test(shell),
    'the rail must not carry the monument',
  );

  const css = fs.readFileSync(path.join(root, '..', 'src', 'styles', 'desktop.css'), 'utf8');
  assert.match(css, /\.dc-monument::after/, 'desktop.css must paint the monument');
  assert.match(css, /var\(--monument/, 'it must read the same custom property the phone sets');
  assert.match(
    css,
    /isolation: isolate/,
    'without a stacking context the z-index -1 layer drops behind the background and vanishes',
  );
});

console.log(`\nOK — ${n} monument checks passed.`);
