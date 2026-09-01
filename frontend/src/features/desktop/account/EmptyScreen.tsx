'use client';

import React from 'react';
import { useStartCheck } from '@/lib/nav';
import { Primary, T } from '@/components';
import { DesktopShell } from '../shell';

/** D-P11. The no-check-yet state, reachable directly and from Home. */
export default function EmptyScreen() {
  const startCheck = useStartCheck();

  return (
    <DesktopShell padding="36px 44px" title={<T hi="आपके आवेदन" en="Your applications" />}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '60px 20px',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '92px',
            height: '92px',
            borderRadius: '22px',
            background: 'var(--navy-tint2)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.7">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M8 13h8M8 17h5" />
          </svg>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
          <T hi="आपने अभी कोई जाँच शुरू नहीं की" en="You haven't started any check yet" />
        </h1>

        <p
          style={{ fontSize: '15.5px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '440px', margin: 0 }}
        >
          <T
            hi="गाँव, पूँजी और कारोबार बताइए — बाज़ार, दाम और सरकारी योजना की पूरी जाँच कुछ ही पल में तैयार हो जाएगी।"
            en="Tell us your village, capital and business — the full market, pricing and scheme check takes only a moment."
          />
        </p>

        <div style={{ width: '100%', maxWidth: '300px', marginTop: '6px' }}>
          <Primary onClick={startCheck} arrow>
            <T hi="जाँच शुरू कीजिए" en="Start a check" />
          </Primary>
        </div>
      </div>
    </DesktopShell>
  );
}
