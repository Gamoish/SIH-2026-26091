'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { MOCK_api } from '@/data/stubs/mock-api';
import { T } from '@/components';

export default function LoadingScreen() {
  const { s } = useSession();
  const nav = useNav();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // A village with no demo fixture behind it has no figures for the engine to
    // work from. Say so straight away: returning here left the screen shimmering
    // for ever, because nothing would ever navigate or fail.
    if (!s.business || s.capital == null) return; // the route guard redirects
    if (!s.village) {
      setFailed(true);
      return;
    }
    let live = true;
    MOCK_api.feasibility({
      villageId: s.village,
      businessId: s.business,
      radiusKm: s.radiusKm,
      capital: s.capital,
    })
      .then((report) => live && (report ? nav.replace('feasibility') : setFailed(true)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [s.village, s.business, s.capital, s.radiusKm, nav]);

  return (
    <div className="dc-phone">
      <div style={{ background: 'var(--navy)', color: '#fff', flex: 'none', padding: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>
          <T hi="व्यवहार्यता रिपोर्ट" en="Feasibility report" />
        </div>
      </div>

      <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div className="skel" style={{ height: '82px', borderRadius: '15px' }} />
        <div className="skel" style={{ height: '100px', borderRadius: '14px' }} />
        <div style={{ display: 'flex', gap: '9px' }}>
          <div className="skel" style={{ height: '70px', borderRadius: '12px', flex: 1 }} />
          <div className="skel" style={{ height: '70px', borderRadius: '12px', flex: 1 }} />
        </div>
        <div className="skel" style={{ height: '90px', borderRadius: '14px' }} />

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            paddingBottom: '6px',
          }}
        >
          {failed ? (
            <>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--rust)' }}>
                <T hi="इस गाँव के लिए अभी आँकड़े नहीं हैं" en="There are no figures for this village yet" />
              </div>
              <button
                onClick={() => nav.go('location')}
                style={{
                  background: 'var(--saffron)',
                  color: '#fff',
                  border: 0,
                  borderRadius: '10px',
                  padding: '11px 18px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <T hi="गाँव बदलिए" en="Change village" />
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '3px solid var(--navy-tint)',
                  borderTopColor: 'var(--saffron)',
                  animation: 'spin .9s linear infinite',
                }}
              />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                <T hi="आपकी रिपोर्ट बन रही है…" en="Building your report…" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
