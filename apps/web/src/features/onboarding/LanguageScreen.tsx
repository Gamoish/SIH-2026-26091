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
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v9l6 3" />
            <circle cx="12" cy="12" r="9" />
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
