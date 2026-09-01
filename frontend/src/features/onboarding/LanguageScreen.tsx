'use client';
import React from 'react';
import { useSession, type Lang } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { T } from '@/components';

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
    <div className="dc-phone">
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 30px',
          gap: '22px',
        }}
      >
        <div
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '15px',
            background: 'var(--navy)',
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--e2)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" role="presentation">
            <circle cx="12" cy="12" r="9.1" stroke="#fff" strokeWidth="1.5" />
            <g stroke="#fff" strokeWidth="1.1" strokeLinecap="round">
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(0 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(30 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(60 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(90 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(120 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(150 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(180 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(210 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(240 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(270 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(300 12 12)" />
              <line x1="12" y1="3.9" x2="12" y2="6.4" transform="rotate(330 12 12)" />
            </g>
            <circle cx="12" cy="12" r="1.7" fill="#fff" />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '4px',
              background: 'var(--saffron)',
            }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>अपनी भाषा चुनिए</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '2px' }}>
            Choose your language
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {READY.map((l) => {
            const on = s.lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => choose(l.code)}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  borderRadius: '14px',
                  background: on ? 'var(--navy-tint)' : '#fff',
                  border: on ? '2px solid var(--navy)' : '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1px',
                  cursor: 'pointer',
                  boxShadow: on ? '0 0 0 3px rgba(18,59,109,.12)' : 'var(--e1)',
                }}
              >
                <span
                  style={{
                    fontSize: '21px',
                    fontWeight: 700,
                    color: on ? 'var(--navy-dark)' : 'var(--text)',
                  }}
                >
                  {l.native}
                </span>
                {l.roman ? (
                  <span style={{ fontSize: '11.5px', color: on ? 'var(--navy)' : 'var(--muted)' }}>
                    {l.roman}
                  </span>
                ) : null}
              </button>
            );
          })}

          {SOON.map((l) => (
            <button
              key={l.roman}
              disabled
              style={{
                width: '100%',
                minHeight: '60px',
                borderRadius: '14px',
                background: 'var(--panel)',
                border: '1px dashed var(--line)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px',
                opacity: 0.75,
              }}
            >
              <span style={{ fontSize: '21px', fontWeight: 700, color: 'var(--faint)' }}>{l.native}</span>
              <span style={{ fontSize: '10.5px', color: 'var(--faint)' }}>
                {l.roman} · <T hi="जल्द" en="soon" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
