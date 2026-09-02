'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home05Icon, PlusSignIcon, File02Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { useNav, useStartCheck } from '@/lib/nav';
import { T } from './bilingual';

/**
 * Hugeicons (free pack, MIT) rather than hand-drawn paths.
 *
 * The four here were wrong, not just plain: "Home" was a four-square grid,
 * which reads as a dashboard; "Apps" was a page; and "Settings" was a circle
 * with eight spokes, which renders as a sun rather than a gear. All four now
 * say what they mean, on one 24px grid with one stroke weight.
 */
const ICONS = {
  home: Home05Icon,
  add: PlusSignIcon,
  doc: File02Icon,
  gear: Settings02Icon,
};

export function Dock({ active }: { active: 'home' | 'new' | 'saved' | 'settings' }) {
  const nav = useNav();
  const startCheck = useStartCheck();
  const tabs: { id: typeof active; go: () => void; icon: typeof Home05Icon; hi: string; en: string }[] = [
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
            <HugeiconsIcon icon={t.icon} size={21} strokeWidth={on ? 2.2 : 1.9} />
            <span style={{ fontSize: '9.5px', fontWeight: on ? 700 : 400 }}>
              <T hi={t.hi} en={t.en} />
            </span>
          </button>
        );
      })}
    </nav>
  );
}
