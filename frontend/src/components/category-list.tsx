'use client';

import React from 'react';
import { CATEGORIES, routeNote } from '@/lib/categories';
import type { SocialCategory } from '@/types';
import { T } from './bilingual';

/** The four-option social-category picker, shared by first-run and Settings. */
export function CategoryList({
  value,
  onChange,
}: {
  value: SocialCategory | null;
  onChange: (id: SocialCategory) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {CATEGORIES.map((c) => {
        const on = value === c.id;
        const route = routeNote(c.id);
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            aria-pressed={on}
            style={{
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              minHeight: '58px',
              padding: '11px 14px',
              borderRadius: '13px',
              cursor: 'pointer',
              background: on ? 'var(--navy-tint)' : '#fff',
              border: on ? '2px solid var(--navy)' : '1px solid var(--line)',
              boxShadow: on ? '0 0 0 3px rgba(18,59,109,.10)' : 'var(--e1)',
            }}
          >
            <span
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                flex: 'none',
                border: on ? '6px solid var(--navy)' : '2px solid var(--line)',
                background: '#fff',
              }}
            />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: on ? 'var(--navy-dark)' : 'var(--text)',
                }}
              >
                <T hi={c.hi} en={c.en} />
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                <T hi={c.noteHi} en={c.noteEn} />
              </span>
            </span>
            {route ? (
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--teal)',
                  background: 'var(--teal-tint)',
                  borderRadius: '20px',
                  padding: '3px 9px',
                  flex: 'none',
                }}
              >
                {route}
              </span>
            ) : (
              <span style={{ fontSize: '10.5px', color: 'var(--faint)', flex: 'none' }}>
                <T hi="कोई योजना नहीं" en="no scheme" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The warning shown when General is picked: no loan scheme applies. */
export function GeneralNote() {
  return (
    <div
      style={{
        fontSize: '11.5px',
        lineHeight: 1.55,
        color: '#8A4E06',
        background: 'var(--saffron-tint)',
        borderRadius: '10px',
        padding: '10px 12px',
      }}
    >
      <T
        hi="ये तीनों योजनाएँ SC, ST और OBC वर्ग के लिए हैं। व्यवहार्यता रिपोर्ट फिर भी बनेगी, पर ऋण का हिस्सा लागू नहीं होगा।"
        en="These three schemes serve SC, ST and OBC applicants. The feasibility report still works, but the loan section will not apply."
      />
    </div>
  );
}
