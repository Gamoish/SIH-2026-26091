'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api, type Village } from '@/lib/api';
import { MOCK_VILLAGES } from '@/data/fixtures/villages';
import { Header, Primary, Steps, T, useT } from '@/components';

const RADII = [3, 5, 10];

/**
 * Demo fixtures are offered only when this is explicitly switched on, and are
 * labelled as such on screen. They carry no LGD code, so a demo selection can
 * never be mistaken downstream for a real directory entry.
 */
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

export default function LocationScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();

  const [radiusKm, setRadius] = useState(s.radiusKm);
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

  // Debounced search against the LGD directory. The server does the matching,
  // so the browser never holds the whole district.
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

  // grouped by tehsil, tehsils in alphabetical order
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
    // Persist to the authenticated user's profile. The LGD code is the field
    // the feasibility engine will later query against.
    if (selected.lgdCode) {
      try {
        await api.saveProfile({ village_lgd_code: selected.lgdCode });
      } catch {
        // keep going: the local session already holds the choice, and the next
        // step re-saves. A dropped write must not strand the user here.
      }
    }
    nav.go('capital');
  };

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('social')} title={<T hi="अपनी जानकारी भरिए" en="Fill in your details" />}>
        <Steps active={1} />
      </Header>

      {/* minHeight:0 as well as flex:1 - without it this column refuses to
          shrink below its content, and the scrolling list below cannot give
          back the space, so a slow village fetch pushes content into the
          skyline band once the rows arrive. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '16px 16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '13px',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 600, textAlign: 'center' }}>
          <T hi="आप कहाँ काम करेंगे?" en="Where will you work?" />
        </div>

        <button
          disabled
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '9px',
            width: '100%',
            minHeight: '46px',
            borderRadius: '12px',
            background: 'var(--panel)',
            border: '1px dashed var(--line)',
            color: 'var(--faint)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
            <path d="M19 11a7 7 0 0 1-14 0M12 18v3" />
          </svg>
          <T hi="बोलकर बताइए · जल्द" en="Say it out loud · coming soon" />
        </button>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('गाँव खोजिए', 'Search for your village')}
          aria-label={t('गाँव खोजिए', 'Search for your village')}
          style={{
            width: '100%',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '15px',
            fontFamily: 'var(--sans)',
            color: 'var(--text)',
            background: '#fff',
            boxShadow: 'var(--e1)',
            outlineColor: 'var(--navy)',
          }}
        />

        {loadState !== 'ready' && choices.length > 0 ? (
          <div
            style={{
              fontSize: '11px',
              color: '#8A4E06',
              background: 'var(--saffron-tint)',
              borderRadius: '9px',
              padding: '8px 11px',
            }}
          >
            <T
              hi="डेमो गाँव — असली LGD सूची नहीं। इनका कोई LGD कोड नहीं है।"
              en="Demo villages — not the real LGD list. These carry no LGD code."
            />
          </div>
        ) : null}

        {/* flex:1 + minHeight:0 makes this the part that scrolls, so a long
            tehsil-grouped list never pushes content down over the skyline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            flex: '1 1 0',
            minHeight: 0,
          }}
        >
          {groups.map((g) => (
            <React.Fragment key={g.tehsil}>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--faint)',
                  padding: '4px 2px 0',
                }}
              >
                {g.tehsil}
              </div>
              {g.items.map((c) => {
                const on = selected?.key === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setSelected(c)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '11px',
                      minHeight: '54px',
                      padding: '10px 13px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: on ? 'var(--green-tint)' : '#fff',
                      border: on ? '2px solid var(--green)' : '1px solid var(--line)',
                      boxShadow: 'var(--e1)',
                    }}
                  >
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        flex: 'none',
                        display: 'grid',
                        placeItems: 'center',
                        background: on ? 'var(--green)' : 'var(--panel)',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={on ? '#fff' : 'var(--faint)'}
                        strokeWidth="2.2"
                      >
                        <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z" />
                        <circle cx="12" cy="10" r="2.6" />
                      </svg>
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>{c.name}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                        {c.tehsil} · Sonbhadra · U.P.
                        {c.lgdCode ? ` · LGD ${c.lgdCode}` : ''}
                      </span>
                    </span>
                    {on ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--green)"
                        strokeWidth="3"
                        style={{ flex: 'none' }}
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </React.Fragment>
          ))}

          {visible.length === 0 ? (
            <div
              style={{
                fontSize: '12.5px',
                color: 'var(--muted)',
                textAlign: 'center',
                padding: '18px',
                lineHeight: 1.6,
              }}
            >
              {loadState === 'loading' ? (
                <T hi="सूची आ रही है…" en="Loading the village list…" />
              ) : loadState === 'error' ? (
                <T
                  hi="सूची नहीं मिल सकी — सर्वर से संपर्क नहीं हुआ"
                  en="Could not load the list — the server is unreachable"
                />
              ) : loadState === 'empty' ? (
                <T
                  hi="गाँव की सूची अभी लोड नहीं हुई। LGD निर्यात आयात कीजिए।"
                  en="The village list has not been loaded yet. Import the LGD export first."
                />
              ) : (
                <T hi="कोई गाँव नहीं मिला" en="No village matched that search" />
              )}
            </div>
          ) : null}
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '7px' }}>
            <T hi="बाज़ार का दायरा — कितनी दूर तक बेचेंगे?" en="Market radius — how far will you sell?" />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {RADII.map((r) => {
              const on = radiusKm === r;
              return (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    borderRadius: '11px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    background: on ? 'var(--teal)' : '#fff',
                    color: on ? '#fff' : 'var(--text)',
                    border: on ? '2px solid var(--teal)' : '1px solid var(--line)',
                    boxShadow: 'var(--e1)',
                  }}
                >
                  {r} km
                </button>
              );
            })}
          </div>
        </div>

        <Primary onClick={submit} disabled={!selected} arrow style={{ marginTop: 'auto' }}>
          <T hi="आगे · पूँजी बताइए" en="Next · enter capital" />
        </Primary>
      </div>
    </div>
  );
}
