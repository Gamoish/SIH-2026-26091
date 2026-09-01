'use client';

import React from 'react';
import { useSession, type Lang } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { T } from '@/components';
import { SplitShell } from '../shell';

/**
 * D-P1a. Navy branding panel at 46%, picker at 520px on the right, four
 * languages in a single 2x2 grid.
 *
 * Only two have translations behind them, so the other two are rendered in the
 * same grid but visibly not choosable - dashed, muted, labelled. Offering an
 * unbacked language would be a dead end for the user this app exists for.
 */
const READY: { code: Lang; native: string; roman: string }[] = [
  { code: 'hi', native: 'हिंदी', roman: 'Hindi' },
  { code: 'en', native: 'English', roman: '' },
];
const SOON = [
  { native: 'ଓଡ଼ିଆ', roman: 'Odia' },
  { native: 'বাংলা', roman: 'Bengali' },
];

export default function LanguageScreen() {
  const { s, set } = useSession();
  const nav = useNav();

  const choose = (code: Lang) => {
    set({ lang: code });
    nav.go('phone');
  };

  return (
    <SplitShell width={520}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
          <T hi="अपनी भाषा चुनिए" en="Choose your language" />
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--muted)', margin: '6px 0 0' }}>
          <T hi="Choose your language" en="अपनी भाषा चुनिए" />
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {READY.map((l) => {
          const on = s.lang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              style={{
                minHeight: '88px',
                borderRadius: '16px',
                border: on ? '2px solid var(--navy)' : '1.5px solid var(--line)',
                background: on ? 'var(--navy-tint)' : '#fff',
                boxShadow: on ? 'none' : 'var(--e1)',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-dark)' }}>{l.native}</span>
              {l.roman ? <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{l.roman}</span> : null}
            </button>
          );
        })}

        {SOON.map((l) => (
          <div
            key={l.roman}
            aria-disabled
            title="coming soon"
            style={{
              minHeight: '88px',
              borderRadius: '16px',
              border: '1.5px dashed var(--line)',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              color: 'var(--faint)',
            }}
          >
            <span style={{ fontSize: '24px', fontWeight: 600 }}>{l.native}</span>
            <span style={{ fontSize: '13px' }}>{l.roman}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '12.5px', color: 'var(--faint)' }}>
        <T hi="ଓଡ଼ିଆ और বাংলা जल्द आ रही हैं" en="ଓଡ଼ିଆ and বাংলা are coming soon" />
      </div>
    </SplitShell>
  );
}
