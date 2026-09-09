'use client';
import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api } from '@/lib/api';
import { planLoan, isGap } from '@/domain/finance';
import { label } from '@/domain/feasibility';
import { MOCK_VILLAGES } from '@/data/fixtures/villages';
import { MOCK_BUSINESSES } from '@/data/fixtures/businesses';
import { inr } from '@/lib/format';
import { Header, Primary, Steps, T, useT } from '@/components';

export default function CapitalScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const [digits, setDigits] = useState(s.capital != null ? String(s.capital) : '');

  const capital = digits === '' ? 0 : Number(digits);
  const plan = s.social && capital > 0 ? planLoan(capital, s.social) : null;
  const village = MOCK_VILLAGES.find((v) => v.id === s.village);
  const business = s.business ? MOCK_BUSINESSES[s.business] : null;

  const submit = async () => {
    if (capital <= 0) return;
    set({ capital });
    try {
      await api.saveProfile({ capital });
    } catch {
      // local session holds it; the next step re-saves
    }
    nav.go('loading');
  };

  const split =
    plan && !isGap(plan) && business
      ? business.costSplit.map((c) => ({
          label: label(c.label, s.lang),
          amount: Math.round(plan.projectCost * c.share),
          share: c.share,
        }))
      : null;

  return (
    <div className="dc-phone">
      <Header
        onBack={() => nav.go('category')}
        title={<T hi="अपनी जानकारी भरिए" en="Fill in your details" />}
      >
        <Steps active={3} />
      </Header>

      <div
        style={{ flex: 1, padding: '12px 15px 14px', display: 'flex', flexDirection: 'column', gap: '9px' }}
      >
        {village ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              background: '#fff',
              border: '1px solid var(--line-soft)',
              borderRadius: '13px',
              padding: '9px 12px',
              boxShadow: 'var(--e1)',
            }}
          >
            <span
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'var(--teal-tint)',
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--teal)"
                strokeWidth="2.2"
              >
                <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.6" />
              </svg>
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }}>
                {label(village.name, s.lang)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                {village.block} · Sonbhadra · ◉ {s.radiusKm} km <T hi="दायरा" en="radius" />
              </div>
            </div>
            <button
              onClick={() => nav.go('location')}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--teal)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '8px',
                flex: 'none',
              }}
            >
              <T hi="बदलें" en="Change" />
            </button>
          </div>
        ) : null}

        <div
          style={{
            background: '#fff',
            border: '2px solid var(--navy)',
            borderRadius: '15px',
            padding: '11px 14px',
            boxShadow: '0 0 0 4px var(--navy-tint),var(--e2)',
          }}
        >
          <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
            <T hi="आपकी अपनी पूँजी" en="Your own capital" />
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', minHeight: '48px' }}
          >
            <span
              style={{
                fontSize: '34px',
                fontWeight: 700,
                color: capital ? 'var(--navy-dark)' : 'var(--faint)',
                flex: 'none',
              }}
            >
              ₹
            </span>
            <input
              value={digits}
              onChange={(e) =>
                setDigits(
                  e.target.value
                    .replace(/\D/g, '')
                    .replace(/^0+(?=\d)/, '')
                    .slice(0, 8),
                )
              }
              inputMode="numeric"
              type="text"
              autoFocus
              placeholder="0"
              aria-label={t('अपनी पूँजी, रुपये में', 'Your own capital, in rupees')}
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                border: 0,
                outline: 'none',
                background: 'transparent',
                padding: 0,
                fontFamily: 'var(--sans)',
                fontSize: '34px',
                fontWeight: 700,
                color: 'var(--navy-dark)',
                letterSpacing: '-.01em',
              }}
            />
            {capital > 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 'none' }}>{inr(capital)}</span>
            ) : null}
          </div>
        </div>

        {plan && !isGap(plan) ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                <T hi={`आपका ${plan.beneficiaryPct}% अंश`} en={`Your ${plan.beneficiaryPct}% share`} />
              </span>
              <span style={{ flex: 1, borderTop: '1px dashed var(--line)' }} />
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--teal)' }}>
                {plan.scheme.code}
              </span>
            </div>

            <div
              style={{
                background: 'var(--navy-800)',
                color: '#fff',
                borderRadius: '15px',
                padding: '12px 14px',
                boxShadow: 'var(--e2)',
                backgroundImage: 'var(--ledger-ink)',
              }}
            >
              <div style={{ fontSize: '12px', color: '#B9CBE0' }}>
                <T hi="अनुमानित परियोजना लागत" en="Estimated project cost" />
              </div>
              <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-.015em', lineHeight: 1.05 }}>
                {inr(plan.projectCost)}
              </div>
              <div style={{ fontSize: '11px', color: '#8FB0D6', marginTop: '2px' }}>
                <T
                  hi={`${inr(plan.capital)} आपके + ${inr(plan.loanAmount)} ऋण`}
                  en={`${inr(plan.capital)} yours + ${inr(plan.loanAmount)} loan`}
                />
              </div>

              {split ? (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {split.map((c) => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#CBDAEC', width: '112px' }}>{c.label}</span>
                      <div
                        style={{
                          flex: 1,
                          height: '7px',
                          background: 'rgba(255,255,255,.15)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.round(c.share * 100)}%`,
                            background: 'var(--saffron)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: '#B9CBE0', width: '58px', textAlign: 'right' }}>
                        {inr(c.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div
            style={{
              background: 'var(--panel)',
              border: '1px dashed var(--line)',
              borderRadius: '15px',
              padding: '16px 14px',
              textAlign: 'center',
              fontSize: '12.5px',
              color: 'var(--muted)',
              lineHeight: 1.5,
            }}
          >
            {plan && isGap(plan) ? (
              <T
                hi={`${plan.scheme?.code ?? ''} की दरें अभी पुष्टि नहीं हुईं — लागत यहाँ नहीं दिखाई जा सकती।`}
                en={`${plan.scheme?.code ?? ''} figures are not confirmed yet — the project cost cannot be shown here.`}
              />
            ) : (
              <T
                hi="पूँजी डालिए — परियोजना लागत अपने आप जुड़ेगी"
                en="Enter your capital — the project cost is worked out for you"
              />
            )}
          </div>
        )}

        <Primary onClick={submit} disabled={capital <= 0} arrow style={{ marginTop: 'auto' }}>
          <T hi="आगे · रिपोर्ट देखिए" en="Next · see the report" />
        </Primary>
      </div>
    </div>
  );
}
