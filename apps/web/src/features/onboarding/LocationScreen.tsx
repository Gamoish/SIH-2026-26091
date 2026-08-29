'use client';
import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { label } from '@/domain/feasibility';
import { MOCK_VILLAGES } from '@/data/villages';
import { Header, Primary, Steps, T, useT } from '@/components';

const RADII = [3, 5, 10];

export default function LocationScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const [village, setVillage] = useState(s.village);
  const [radiusKm, setRadius] = useState(s.radiusKm);
  const [query, setQuery] = useState('');

  const matches = MOCK_VILLAGES.filter(
    (v) =>
      !query.trim() ||
      v.name.en.toLowerCase().includes(query.trim().toLowerCase()) ||
      v.name.hi.includes(query.trim()),
  );

  const submit = () => {
    if (!village) return;
    set({ village, radiusKm });
    nav.go('capital');
  };

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('social')} title={<T hi="अपनी जानकारी भरिए" en="Fill in your details" />}>
        <Steps active={1} />
      </Header>

      <div
        style={{ flex: 1, padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: '13px' }}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {matches.map((v) => {
            const on = village === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setVillage(v.id)}
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
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>
                    {label(v.name, s.lang)}{' '}
                    {v.town ? (
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>
                        · <T hi="क़स्बा" en="town" />
                      </span>
                    ) : null}
                  </span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                    {v.block} · Sonbhadra · U.P. · {v.households.toLocaleString('en-IN')}{' '}
                    <T hi="घर" en="households" />
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
          {matches.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', textAlign: 'center', padding: '18px' }}>
              <T
                hi="कोई गाँव नहीं मिला — डेमो में सोनभद्र के 6 गाँव हैं"
                en="No match — the demo covers 6 Sonbhadra villages"
              />
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

        <Primary onClick={submit} disabled={!village} arrow style={{ marginTop: 'auto' }}>
          <T hi="आगे · पूँजी बताइए" en="Next · enter capital" />
        </Primary>
      </div>
    </div>
  );
}
