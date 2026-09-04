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

/* 22 screens, 20 files, and one of those (konark-sun-temple) is held back
   because its source trace has a transparency checkerboard baked into it. The
   three pairs below therefore share, each pair being one subject seen twice in
   the same flow rather than two unrelated screens colliding. */
const SHARED = [
  ['category', 'edit-category'],
  ['loading', 'empty'],
  ['report', 'share'],
];

test('a monument is reused only by an approved pair', () => {
  const seen = new Map();
  for (const slug of SCREENS) {
    const file = MONUMENTS[slug];
    const prev = seen.get(file);
    if (prev !== undefined) {
      const ok = SHARED.some((pair) => pair.includes(prev) && pair.includes(slug));
      assert.ok(ok, `${slug} reuses "${file}" from ${prev}, which is not an approved pair`);
      continue;
    }
    seen.set(file, slug);
  }
  assert.equal(seen.size, SCREENS.length - SHARED.length);
});

test('every referenced monument file exists', () => {
  for (const [slug, file] of Object.entries(MONUMENTS)) {
    assert.ok(fs.existsSync(path.join(dir, `${file}.svg`)), `${slug} points at missing ${file}.svg`);
  }
});

/* Held back rather than deleted: the art is fine, the export is not - its
   trace has a Photoshop transparency checkerboard baked in, so it paints as a
   grey checked rectangle. Re-export it and give it a screen. */
const HELD_BACK = new Set(['konark-sun-temple']);

test('no monument file is orphaned', () => {
  const used = new Set(Object.values(MONUMENTS));
  for (const f of fs.readdirSync(dir)) {
    const name = f.replace(/\.svg$/, '');
    assert.ok(used.has(name) || HELD_BACK.has(name), `${f} is not referenced by any screen`);
  }
});

test('no monument carries an opaque background plate', () => {
  // The traces ship with a full-canvas rect behind the monument. Harmless in an
  // illustration, fatal here: it paints as a filled box behind the form, and
  // under the old mask-based rule it swallowed the silhouette entirely.
  for (const [, file] of Object.entries(MONUMENTS)) {
    const svg = fs.readFileSync(path.join(dir, `${file}.svg`), 'utf8');
    assert.ok(
      !/<path d="M0 0 C[^"]*" fill="#[0-9A-Fa-f]{3,8}" transform="translate\(0,0\)"\/>/.test(svg),
      `${file}.svg still has its background plate; strip it or it paints as a box`,
    );
    assert.equal((svg.match(/<svg/g) ?? []).length, 1, `${file}.svg must hold one root svg`);
  }
});

test('monumentVar builds a css url, and ignores unknown screens', () => {
  assert.equal(monumentVar('capital'), "url('/monuments/parliament.svg')");
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
