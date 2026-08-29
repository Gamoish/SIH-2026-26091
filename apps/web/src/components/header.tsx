'use client';

import React from 'react';
import { useNav } from '@/lib/nav';
import { T } from './bilingual';

export function Header({
  title,
  sub,
  onBack,
  right,
  children,
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const nav = useNav();
  const back = onBack ?? nav.back;
  return (
    <div style={{ background: 'var(--navy)', color: '#fff', flex: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '14px 18px 16px' }}>
        <button
          onClick={back}
          aria-label="Back"
          style={{ background: 'transparent', border: 0, padding: '6px', margin: '-6px', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff', flex: 'none' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          {title ? <div style={{ fontSize: '16px', fontWeight: 600 }}>{title}</div> : null}
          {sub ? <div style={{ fontSize: '11.5px', color: '#B9CBE0', marginTop: '3px' }}>{sub}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Steps({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { hi: 'जगह', en: 'Location' },
    { hi: 'पूँजी', en: 'Capital' },
    { hi: 'कारोबार', en: 'Business' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 18px 14px' }}>
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < active;
        const now = n === active;
        return (
          <React.Fragment key={s.en}>
            {i > 0 ? (
              <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: n <= active ? (done ? 'var(--green)' : 'var(--saffron)') : 'rgba(255,255,255,.22)', margin: '0 -2px 18px' }} />
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 'none', width: '58px' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: done ? 'var(--green)' : now ? 'var(--saffron)' : 'transparent', border: done || now ? 0 : '2px solid rgba(255,255,255,.32)', color: done || now ? '#fff' : '#8FB0D6', fontSize: '13px', fontWeight: 700, display: 'grid', placeItems: 'center', flex: 'none', boxShadow: now ? '0 0 0 4px rgba(224,103,10,.28)' : 'none' }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                ) : (
                  n
                )}
              </span>
              <span style={{ fontSize: '10.5px', color: done ? '#CFE7D8' : now ? '#fff' : '#8FB0D6', fontWeight: done || now ? 700 : 400 }}>
                <T hi={s.hi} en={s.en} />
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}