'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav, useStartCheck } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { isGap } from '@/domain/finance';
import { label } from '@/domain/feasibility';
import { inr } from '@/lib/format';
import { Primary, ScoreDial, T } from '@/components';
import { DesktopShell, Legend } from '../shell';

/**
 * D-P6. The returning user's landing view. With no finished check this is the
 * empty state rather than a card full of blanks - `redirectFor` allows `home`
 * for any onboarded user, so the screen has to handle both.
 */
export default function HomeScreen() {
  const { s } = useSession();
  const nav = useNav();
  const startCheck = useStartCheck();
  const { report, plan } = useCase();
  const money = plan && !isGap(plan) ? plan : null;

  const greeting = s.name ? (
    <T hi={`नमस्ते, ${s.name}`} en={`Hello, ${s.name}`} />
  ) : (
    <T hi="नमस्ते" en="Hello" />
  );

  return (
    <DesktopShell padding="36px 44px" title={greeting}>
      {report ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr',
              gap: '22px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                background: 'var(--navy)',
                backgroundImage: 'var(--ledger-ink)',
                color: '#fff',
                borderRadius: '18px',
                padding: '30px 34px',
                display: 'flex',
                alignItems: 'center',
                gap: '28px',
                boxShadow: 'var(--e2)',
              }}
            >
              <ScoreDial score={report.score} size={120} ring={false} />
              <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,.2)' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#9FB6D3', letterSpacing: '.06em' }}>
                  <T hi="चल रही जाँच" en="ACTIVE CHECK" />
                </div>
                <div style={{ fontSize: '21px', fontWeight: 700, marginTop: '4px' }}>
                  {label(report.business.name, s.lang)}
                </div>
                <div style={{ fontSize: '13.5px', color: '#CBDAEC', marginTop: '3px' }}>
                  {label(report.village.name, s.lang)}, {report.village.block}
                  {money ? ` · ${money.scheme.code} · ${inr(money.loanAmount)}` : ''}
                </div>
              </div>
            </div>

            <button
              onClick={startCheck}
              style={{
                border: '2px dashed var(--navy-tint)',
                background: 'var(--navy-tint2)',
                borderRadius: '18px',
                fontFamily: 'var(--sans)',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--navy-dark)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--navy)"
                strokeWidth="2.4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <T hi="नई जाँच शुरू करें" en="Start a new check" />
            </button>
          </div>

          <Legend>
            <T hi="अगला कदम" en="Next steps" />
          </Legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            <Step
              onClick={() => nav.go('report')}
              tint="var(--teal-tint)"
              stroke="var(--teal)"
              icon={
                <>
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5" />
                </>
              }
              hi="पूरी रिपोर्ट"
              en="Full report"
              sub={<T hi="प्रतियोगी, दाम, जोखिम" en="Competitors, price, risks" />}
            />
            <Step
              onClick={() => nav.go('emi')}
              tint="var(--green-tint)"
              stroke="var(--green)"
              icon={<path d="M4 19V10M11 19V5M18 19v-7" />}
              hi="वापसी योजना"
              en="Repayment plan"
              sub={
                money ? (
                  <T hi={`${inr(money.emi)}/माह`} en={`${inr(money.emi)}/month`} />
                ) : (
                  <T hi="आँकड़े पुष्ट नहीं" en="Figures unconfirmed" />
                )
              }
            />
            <Step
              onClick={() => nav.go('share')}
              tint="var(--saffron-tint)"
              stroke="var(--saffron)"
              icon={
                <>
                  <path d="M12 3v12" />
                  <path d="M7 11l5 5 5-5" />
                  <path d="M5 21h14" />
                </>
              }
              hi="बैंक को दिखाइए"
              en="Show to bank"
              sub={<T hi="एक पन्ने का सारांश" en="One-page summary" />}
            />
          </div>
        </>
      ) : (
        <div style={{ maxWidth: '520px' }}>
          <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.7 }}>
            <T
              hi="आपने अभी कोई जाँच पूरी नहीं की। गाँव, पूँजी और कारोबार बताइए — रिपोर्ट कुछ ही पल में तैयार हो जाएगी।"
              en="You haven't finished a check yet. Tell us your village, capital and business — the report takes moments."
            />
          </p>
          <Primary onClick={startCheck} arrow>
            <T hi="जाँच शुरू कीजिए" en="Start a check" />
          </Primary>
        </div>
      )}
    </DesktopShell>
  );
}

function Step({
  onClick,
  tint,
  stroke,
  icon,
  hi,
  en,
  sub,
}: {
  onClick: () => void;
  tint: string;
  stroke: string;
  icon: React.ReactNode;
  hi: string;
  en: string;
  sub: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rowh dc-desk-card"
      style={{
        textAlign: 'left',
        padding: '22px',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        display: 'block',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: tint,
          display: 'grid',
          placeItems: 'center',
          marginBottom: '14px',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.2">
          {icon}
        </svg>
      </div>
      <div style={{ fontSize: '15.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>
        <T hi={hi} en={en} />
      </div>
      <div style={{ fontSize: '13.5px', color: 'var(--muted)' }}>{sub}</div>
    </button>
  );
}
