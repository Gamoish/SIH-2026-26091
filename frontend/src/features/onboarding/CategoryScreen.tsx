'use client';
import React, { useState } from 'react';
import { useSession, type BusinessId } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api } from '@/lib/api';
import { label } from '@/domain/feasibility';
import { MOCK_BUSINESSES } from '@/data/fixtures/businesses';
import { Header, Primary, Steps, T } from '@/components';

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
    nav.go('loading');
  };

  const options = Object.values(MOCK_BUSINESSES);

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('capital')} title={<T hi="अपनी जानकारी भरिए" en="Fill in your details" />}>
        <Steps active={3} />
      </Header>

      <div style={{ flex: 1, padding: '14px 18px 18px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '16px', fontWeight: 600, textAlign: 'center' }}>
          <T hi="कौन सा कारोबार शुरू करना है?" en="Which business do you want to start?" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', marginTop: '14px' }}>
          {options.map((b) => {
            const on = business === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBusiness(b.id)}
                style={{
                  borderRadius: '14px',
                  border: on ? '2px solid var(--navy)' : '1px solid var(--line)',
                  background: on ? 'var(--navy-tint)' : '#fff',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative',
                  minHeight: '92px',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: on ? '0 0 0 3px rgba(18,59,109,.10)' : 'var(--e1)',
                }}
              >
                {on ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '17px',
                      height: '17px',
                      borderRadius: '50%',
                      background: 'var(--navy)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : null}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={on ? 'var(--navy-dark)' : 'var(--faint)'}
                  strokeWidth="2"
                >
                  {ART[b.id]}
                </svg>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: on ? 700 : 600,
                    color: on ? 'var(--navy-dark)' : 'var(--text)',
                    textAlign: 'center',
                  }}
                >
                  {label(b.name, s.lang)}
                </span>
              </button>
            );
          })}

          <div
            style={{
              borderRadius: '14px',
              border: '1px dashed var(--line)',
              background: 'var(--panel)',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              minHeight: '92px',
              justifyContent: 'center',
              color: 'var(--faint)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <circle cx="5" cy="12" r="1.4" />
              <circle cx="12" cy="12" r="1.4" />
              <circle cx="19" cy="12" r="1.4" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 600, textAlign: 'center' }}>
              <T hi="और कारोबार · जल्द" en="More trades · soon" />
            </span>
          </div>
        </div>

        <Primary onClick={submit} disabled={!business} arrow style={{ marginTop: 'auto' }}>
          <T hi="आगे · रिपोर्ट देखिए" en="Next · see the report" />
        </Primary>
      </div>
    </div>
  );
}
