'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api, type Village } from '@/lib/api';
import { MOCK_VILLAGES } from '@/data/fixtures/villages';
import { DistrictLocator, Field, Primary, T, useT } from '@/components';
import { TopBarShell, Ask } from '../shell';

const RADII = [3, 5, 10];

/** Demo fixtures only when explicitly enabled, and labelled as such on screen. */
const ALLOW_DEMO = process.env.NEXT_PUBLIC_DEMO_VILLAGES === 'true';

type Choice = { key: string; name: string; tehsil: string; lgdCode: string | null; fixtureId: string | null };

const demoChoices = (): Choice[] =>
  MOCK_VILLAGES.map((v) => ({
    key: `demo:${v.id}`,
    name: v.name.en,
    tehsil: v.block,
    lgdCode: null,
    fixtureId: v.id,
  }));

/**
 * D-P1d. Searches the same village directory the phone does - 1,429 real
 * Sonbhadra rows from the Census import - with the server doing the matching.
 * The wide layout shows the tehsil groups and the radius side by side instead
 * of stacked.
 */
export default function LocationScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();

  const [radiusKm, setRadius] = useState(s.radiusKm);
  // Starts empty, NOT seeded from the session: "Start a new check" reopens
  // this screen with the previous village still on the session, and seeding
  // the box would filter the list down to that one village. The existing
  // choice is already visible as the selected card.
  const [query, setQuery] = useState('');
  const [choices, setChoices] = useState<Choice[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [selected, setSelected] = useState<Choice | null>(
    s.villageLgdCode || s.village
      ? {
          key: s.villageLgdCode ? `lgd:${s.villageLgdCode}` : `demo:${s.village}`,
          name: s.villageName ?? '',
          tehsil: s.tehsil ?? '',
          lgdCode: s.villageLgdCode,
          fixtureId: s.village,
        }
      : null,
  );

  useEffect(() => {
    let live = true;
    const id = setTimeout(async () => {
      try {
        const res = await api.villages({ q: query.trim() || undefined, limit: 60 });
        if (!live) return;
        if (!res.loaded) {
          setChoices(ALLOW_DEMO ? demoChoices() : []);
          setLoadState('empty');
          return;
        }
        setChoices([
          // With the flag on, the demo fixtures are offered *alongside* the
          // real directory, still labelled: they are the only villages the
          // feasibility engine has figures for, so a dev or an e2e run needs
          // them even once the real list is loaded.
          ...(ALLOW_DEMO ? demoChoices() : []),
          ...res.villages.map((v: Village) => ({
            key: `lgd:${v.lgd_code}`,
            name: v.name,
            tehsil: v.tehsil,
            lgdCode: v.lgd_code,
            fixtureId: null,
          })),
        ]);
        setLoadState('ready');
      } catch {
        if (!live) return;
        setChoices(ALLOW_DEMO ? demoChoices() : []);
        setLoadState('error');
      }
    }, 250);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [query]);

  const visible = choices.filter(
    (c) => !query.trim() || c.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const groups = [...new Set(visible.map((c) => c.tehsil))].sort().map((tehsil) => ({
    tehsil,
    items: visible.filter((c) => c.tehsil === tehsil),
  }));

  const submit = async () => {
    if (!selected) return;
    set({
      village: selected.fixtureId,
      villageLgdCode: selected.lgdCode,
      villageName: selected.name,
      tehsil: selected.tehsil,
      radiusKm,
    });
    if (selected.lgdCode) {
      try {
        await api.saveProfile({ village_lgd_code: selected.lgdCode });
      } catch {
        // the local session already holds the choice; the next step re-saves
      }
    }
    nav.go('category');
  };

  return (
    <TopBarShell
      step="location"
      contentWidth={560}
      asideWidth={520}
      aside={
        <>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-dark)' }}>
            <T hi="आपने अब तक भरा" en="What you've entered so far" />
          </div>
          <Summary k={<T hi="गाँव" en="Village" />} v={selected ? selected.name : '—'} active={!!selected} />
          <Summary k={<T hi="तहसील" en="Tehsil" />} v={selected?.tehsil || '—'} active={!!selected} />
          <Summary k={<T hi="ग्राहक का दायरा" en="Customer radius" />} v={`${radiusKm} km`} active />

          {/* Locates the chosen tehsil in the district. Static SVG - it draws
              the same with the network down, which the village list cannot. */}
          <div
            className="dc-desk-card"
            style={{ padding: '16px 18px', display: 'flex', justifyContent: 'center' }}
          >
            <DistrictLocator tehsil={selected?.tehsil} width={200} />
          </div>

          <div style={{ flex: 1 }} />
          <Primary onClick={submit} disabled={!selected} arrow>
            <T hi="आगे बढ़िए" en="Continue" />
          </Primary>
        </>
      }
    >
      <Ask
        hi="आप कहाँ काम करेंगे?"
        en="Where will you work?"
        note={<T hi="अपना गाँव खोजिए" en="Search for your village" />}
      />

      <Field
        label={t('गाँव का नाम', 'Village name')}
        // Chrome's autofill heuristic reads the label as well as the
        // attributes, and this label contains the word "name". An explicit
        // non-name-like `name` is what stops it offering the saved profile
        // name here; autoComplete="off" alone is not reliably honoured.
        name="village-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('जैसे — Jaraha', 'e.g. Jaraha')}
      />

      <div
        className="dc-desk-card"
        style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px' }}
        role="listbox"
        aria-label={t('गाँव', 'Villages')}
      >
        {loadState === 'loading' ? (
          <Note>
            <T hi="गाँव लाए जा रहे हैं…" en="Loading villages…" />
          </Note>
        ) : null}

        {loadState !== 'loading' && groups.length === 0 ? (
          <Note>
            {loadState === 'error' ? (
              <T hi="सूची नहीं आ सकी" en="Could not load the village list" />
            ) : (
              <T hi="कोई गाँव नहीं मिला" en="No village matched" />
            )}
          </Note>
        ) : null}

        {groups.map((g) => (
          <div key={g.tehsil}>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--faint)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                padding: '10px 12px 6px',
              }}
            >
              {g.tehsil}
            </div>
            {g.items.map((c) => {
              const on = selected?.key === c.key;
              return (
                <button
                  key={c.key}
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    setSelected(c);
                    // The box is the record of the choice, not just a search field:
                    // leaving the typed fragment (or the placeholder) behind made a
                    // completed selection look like it had not registered.
                    setQuery(c.name);
                  }}
                  className="rowh"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 12px',
                    borderRadius: '9px',
                    border: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--sans)',
                    fontSize: '15px',
                    fontWeight: on ? 700 : 500,
                    color: on ? 'var(--navy-dark)' : 'var(--text)',
                    background: on ? 'var(--navy-tint2)' : 'transparent',
                  }}
                >
                  <span style={{ flex: 1 }}>{c.name}</span>
                  {c.lgdCode ? null : (
                    <span style={{ fontSize: '10.5px', color: 'var(--amber)', fontWeight: 700 }}>
                      <T hi="डेमो" en="demo" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px' }}>
          <T hi="कितनी दूर तक ग्राहक?" en="How far will customers come from?" />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {RADII.map((r) => {
            const on = r === radiusKm;
            return (
              <button
                key={r}
                onClick={() => setRadius(r)}
                style={{
                  flex: 1,
                  minHeight: '52px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  fontSize: '15px',
                  fontWeight: 700,
                  background: on ? 'var(--navy)' : 'var(--card)',
                  color: on ? '#fff' : 'var(--text)',
                  border: on ? '2px solid var(--navy)' : '1px solid var(--line)',
                }}
              >
                {r} <T hi="किमी" en="km" />
              </button>
            );
          })}
        </div>
      </div>
    </TopBarShell>
  );
}

/** One filled-in answer in the running summary panel. */
function Summary({ k, v, active }: { k: React.ReactNode; v: string; active?: boolean }) {
  return (
    <div
      style={{
        background: '#fff',
        border: active ? '2px solid var(--navy)' : '1px solid var(--line)',
        borderRadius: '12px',
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: active ? 'var(--navy)' : 'var(--faint)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
        }}
      >
        {k}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '3px' }}>{v}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '22px', fontSize: '14px', color: 'var(--muted)' }}>{children}</div>;
}
