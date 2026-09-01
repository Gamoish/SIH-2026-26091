'use client';

import React from 'react';
import { useNav, useStartCheck } from '@/lib/nav';
import { T } from './bilingual';

const ICONS = {
  home: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  add: <path d="M12 5v14M5 12h14" />,
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
};

export function Dock({ active }: { active: 'home' | 'new' | 'saved' | 'settings' }) {
  const nav = useNav();
  const startCheck = useStartCheck();
  const tabs: { id: typeof active; go: () => void; icon: React.ReactNode; hi: string; en: string }[] = [
    { id: 'home', go: () => nav.go('home'), icon: ICONS.home, hi: 'होम', en: 'Home' },
    { id: 'new', go: startCheck, icon: ICONS.add, hi: 'नई जाँच', en: 'New check' },
    { id: 'saved', go: () => nav.go('saved'), icon: ICONS.doc, hi: 'आवेदन', en: 'Apps' },
    { id: 'settings', go: () => nav.go('settings'), icon: ICONS.gear, hi: 'सेटिंग्स', en: 'Settings' },
  ];
  return (
    <nav
      style={{
        // the last band in a min-height:100dvh frame, so it is already flush
        // with the bottom edge - full-bleed, no floating gap; sticky keeps it
        // anchored there if a screen's content ever outruns the viewport
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-around',
        background: 'var(--navy)',
        borderTop: '1px solid var(--navy-800)',
        padding: '8px 6px calc(8px + env(safe-area-inset-bottom))',
        gap: '4px',
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={t.go}
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              fontFamily: 'var(--sans)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              color: on ? '#fff' : '#8FB0D6',
              padding: '4px 10px',
              minHeight: '44px',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              {t.icon}
            </svg>
            <span style={{ fontSize: '9.5px', fontWeight: on ? 700 : 400 }}>
              <T hi={t.hi} en={t.en} />
            </span>
          </button>
        );
      })}
    </nav>
  );
}
export const ICON = ICONS;
