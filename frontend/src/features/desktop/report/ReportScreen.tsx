'use client';

import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { narrate, label } from '@/domain/feasibility';
import { isGap } from '@/domain/finance';
import { inr, num } from '@/lib/format';
import { DistrictLocator, Modal, Primary, ScoreDial, Stat, T } from '@/components';
import { DesktopShell, Legend } from '../shell';
import { CompetitorsBody, CompetitorsStats } from './CompetitorsScreen';
import { PricingBody } from './PricingScreen';
import { SwotBody } from './SwotScreen';

/**
 * The three detail views the report links onward to. On desktop they open in a
 * modal over the report instead of replacing it - the wide viewport has room,
 * and losing the report to read one chart off it was the wrong trade.
 *
 * Their routes (/desktop/competitors, /pricing, /swot) still exist and still
 * render the full-page version: they are deep-linkable, the rail navigates to
 * them, and the phone layout has nothing else. This only changes what the
 * report's own buttons do.
 */
const DETAILS = {
  competitors: {
    hi: 'प्रतियोगी',
    en: 'Competitors',
    body: (
      <>
        <CompetitorsStats row />
        <div style={{ height: '18px' }} />
        <CompetitorsBody />
      </>
    ),
  },
  pricing: { hi: 'सुझाया दाम', en: 'Suggested price', body: <PricingBody /> },
  swot: { hi: 'मज़बूती और जोखिम', en: 'Strengths & risks', body: <SwotBody /> },
} as const;

type DetailKey = keyof typeof DETAILS;

/**
 * D-P3a. The long-form report in the body, with the money summary and the
 * onward links in a fixed 380px `--panel` column - a real second panel, not a
 * grid track, so it holds its width as the body scrolls.
 */
export default function ReportScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { report, plan } = useCase();
  const [detail, setDetail] = useState<DetailKey | null>(null);
  if (!report) return null;

  const money = plan && !isGap(plan) ? plan : null;

  return (
    <DesktopShell
      padding="32px 40px"
      asideWidth={380}
      title={<T hi="पूरी रिपोर्ट" en="Full report" />}
      actions={
        <button
          onClick={() => window.print()}
          className="no-print"
          style={{
            border: '1px solid var(--line)',
            background: 'var(--card)',
            borderRadius: '9px',
            padding: '9px 16px',
            fontSize: '13.5px',
            fontWeight: 600,
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
            color: 'var(--muted)',
          }}
        >
          <T hi="छापिए" en="Print" />
        </button>
      }
      aside={
        <>
          <div className="dc-desk-card" style={{ padding: '20px 22px' }}>
            <Caps>
              <T hi="पैसा" en="Money" />
            </Caps>
            {money ? (
              <>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-dark)' }}>
                  {inr(money.loanAmount)}
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '3px' }}>
                  {money.scheme.code} · {money.interestPct}%
                </div>
              </>
            ) : (
              <div style={{ fontSize: '13.5px', color: 'var(--amber)', lineHeight: 1.6 }}>
                <T
                  hi="इस वर्ग की योजना के आँकड़े पुष्ट नहीं"
                  en="This category's scheme figures are unconfirmed"
                />
              </div>
            )}
          </div>

          <Onward hi="प्रतियोगी" en="Competitors" onClick={() => setDetail('competitors')} />
          <Onward hi="दाम" en="Pricing" onClick={() => setDetail('pricing')} />
          <Onward hi="मज़बूती और जोखिम" en="Strengths & risks" onClick={() => setDetail('swot')} />

          <div style={{ flex: 1 }} />
          <Primary onClick={() => nav.go('scheme')} arrow>
            <T hi="पैसे का रास्ता" en="The money path" />
          </Primary>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
        <ScoreDial score={report.score} size={132} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{label(report.business.name, s.lang)}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '3px' }}>
            {label(report.village.name, s.lang)}, {report.village.block} · {report.radiusKm}{' '}
            <T hi="किमी दायरा" en="km radius" />
          </div>
        </div>
        <DistrictLocator tehsil={report.village.block} width={128} />
      </div>

      <Legend>
        <T hi="क्या पता चला" en="What the check found" />
      </Legend>
      <p style={{ fontSize: '16px', lineHeight: 1.75, margin: '0 0 26px' }}>{narrate(report, s.lang)}</p>

      <Legend>
        <T hi="बाज़ार" en="The market" />
      </Legend>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '26px' }}>
        <Stat size="sm" label={<T hi="गाँव" en="Villages" />} value={String(report.marketReach.villages)} />
        <Stat size="sm" label={<T hi="घर" en="Households" />} value={num(report.marketReach.households)} />
        <Stat size="sm" label={<T hi="लोग" en="People" />} value={num(report.marketReach.population)} />
      </div>

      <Legend>
        <T hi="कमाई का अनुमान" en="Estimated earnings" />
      </Legend>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        <Stat
          size="sm"
          tone="sage"
          label={<T hi="सालाना अनुमान" en="Estimated a year" />}
          value={inr(report.estimatedAnnualRevenue)}
        />
        <Stat
          size="sm"
          tone="green-outline"
          label={<T hi="सुझाया दाम" en="Suggested price" />}
          value={inr(report.pricing.suggested)}
        />
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '8px', fontWeight: 600 }}>
        {report.revenueLimitedBy === 'market' ? (
          <T hi="सीमा: आसपास का बाज़ार इतना ही है" en="Limited by local market size" />
        ) : (
          <T hi="सीमा: आपकी पूँजी इतनी ही चला सकती है" en="Limited by your capital" />
        )}
      </div>

      {/* Rendered inside the body, but <dialog>.showModal() promotes it to the
          browser's top layer, so it sits above the rail and the side panel
          regardless of where it lives in the tree. */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? <T hi={DETAILS[detail].hi} en={DETAILS[detail].en} /> : null}
      >
        {detail ? DETAILS[detail].body : null}
      </Modal>
    </DesktopShell>
  );
}

function Caps({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--faint)',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        marginBottom: '8px',
      }}
    >
      {children}
    </div>
  );
}

function Onward({ hi, en, onClick }: { hi: string; en: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rowh dc-desk-card"
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        fontSize: '14.5px',
        fontWeight: 600,
        color: 'var(--text)',
      }}
    >
      <span style={{ flex: 1 }}>
        <T hi={hi} en={en} />
      </span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
