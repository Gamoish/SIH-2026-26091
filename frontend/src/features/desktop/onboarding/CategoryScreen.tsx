'use client';

import React, { useState } from 'react';
import { useSession, type BusinessId } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api } from '@/lib/api';
import { label } from '@/domain/feasibility';
import { MOCK_BUSINESSES } from '@/data/fixtures/businesses';
import { Primary, T } from '@/components';
import { TopBarShell, Ask } from '../shell';

/** Line art, not emoji, so the tiles scale and recolour with the tokens. */
const ART: Record<BusinessId, React.ReactNode> = {
  'leaf-plates': <path d="M12 3c-4 3-6 6-6 10a6 6 0 0 0 12 0c0-4-2-7-6-10z" />,
  tailoring: <path d="M4 4l4 4M20 4l-4 4M12 8v13M8 21h8" />,
  grocery: (
    <>
      <path d="M6 8h12l-1.5 11h-9L6 8z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  carpentry: <path d="M3 12h18M6 12V6l6-3 6 3v6M6 12v9M18 12v9" />,
  poultry: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01M8 15c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5" />
    </>
  ),
};

/** D-P1f. A wider grid than the phone's, same five fixtures and same write. */
export default function CategoryScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const [business, setBusiness] = useState<BusinessId | null>(s.business);

  const submit = async () => {
    if (!business) return;
    set({ business, savedAt: null });
    try {
      await api.saveProfile({ business_category: business });
    } catch {
      // local session holds it; the report still builds from it
    }
    nav.go('capital');
  };

  return (
    <TopBarShell step="category" padding="44px">
      <Ask
        hi="कौन सा कारोबार शुरू करना है?"
        en="Which business do you want to start?"
        note={<T hi="अभी पाँच कारोबार जाँचे जा सकते हैं" en="Five businesses can be checked for now" />}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6,1fr)',
          gap: '18px',
          width: '1160px',
          maxWidth: '100%',
        }}
      >
        {Object.values(MOCK_BUSINESSES).map((b) => {
          const on = business === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setBusiness(b.id)}
              aria-pressed={on}
              style={{
                minHeight: '124px',
                borderRadius: '14px',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '16px 10px',
                background: on ? 'var(--navy-tint2)' : 'var(--card)',
                border: on ? '2px solid var(--navy)' : '1px solid var(--line)',
                boxShadow: on ? 'none' : 'var(--e1)',
              }}
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke={on ? 'var(--navy)' : 'var(--muted)'}
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ART[b.id]}
              </svg>
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: on ? 700 : 600,
                  color: on ? 'var(--navy-dark)' : 'var(--text)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {label(b.name, s.lang)}
              </span>
            </button>
          );
        })}

        {/* The canvas's sixth slot. Only five businesses have fixtures behind
            them, so this says so rather than offering a choice that leads
            nowhere. */}
        <div
          aria-disabled
          style={{
            minHeight: '124px',
            borderRadius: '14px',
            background: 'var(--panel)',
            border: '1px dashed var(--line)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '20px 12px',
            color: 'var(--faint)',
            textAlign: 'center',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="5" cy="12" r="1.4" />
            <circle cx="12" cy="12" r="1.4" />
            <circle cx="19" cy="12" r="1.4" />
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}>
            <T hi="और जल्द" en="More soon" />
          </span>
        </div>
      </div>

      <Primary onClick={submit} disabled={!business} arrow style={{ width: '560px', maxWidth: '100%' }}>
        <T hi="आगे बढ़िए" en="Continue" />
      </Primary>
    </TopBarShell>
  );
}
