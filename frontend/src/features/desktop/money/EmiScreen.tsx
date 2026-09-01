'use client';

import React from 'react';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { isGap } from '@/domain/finance';
import { inr } from '@/lib/format';
import { Primary, Stat, T } from '@/components';
import { DesktopShell, Legend } from '../shell';

/**
 * D-P5. The repayment plan, including the year-by-year table the phone has to
 * scroll. `plan.years` is `planLoan()`'s own amortisation - not recomputed here.
 */
export default function EmiScreen() {
  const nav = useNav();
  const { report, plan } = useCase();
  if (!plan || isGap(plan)) return null;

  const monthly = report ? report.estimatedAnnualRevenue / 12 : 0;
  const share = monthly > 0 ? Math.round((plan.emi / monthly) * 100) : null;

  return (
    <DesktopShell padding="32px 40px" title={<T hi="वापसी का समय" en="Repayment plan" />}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '28px' }}>
        <Stat label={<T hi="हर महीने" en="Every month" />} value={inr(plan.emi)} tone="navy" />
        <Stat label={<T hi="कुल वापस" en="Total repaid" />} value={inr(plan.totalRepaid)} />
        <Stat label={<T hi="कुल ब्याज़" en="Total interest" />} value={inr(plan.totalInterest)} />
        {share != null ? (
          <Stat
            label={<T hi="कमाई से किश्त" en="EMI vs income" />}
            value={`~${share}%`}
            tone={share <= 30 ? 'green' : 'amber'}
          />
        ) : null}
      </div>

      <div
        className="dc-desk-card"
        style={{
          padding: '20px 24px',
          marginBottom: '28px',
          background: 'var(--green-tint)',
          borderColor: 'var(--green-line)',
        }}
      >
        <div style={{ fontSize: '15px', color: '#0E6234', lineHeight: 1.7 }}>
          <T
            hi={`शुरू के ${plan.moratoriumMonths} महीने कुछ नहीं देना — इसे राहत अवधि (मोरेटोरियम) कहते हैं। उसके बाद ${plan.instalmentCount} किश्तें।`}
            en={`You pay nothing for the first ${plan.moratoriumMonths} months — this is the grace period (moratorium). After that, ${plan.instalmentCount} instalments.`}
          />
        </div>
      </div>

      <Legend>
        <T hi="साल-दर-साल" en="Year by year" />
      </Legend>
      <div className="dc-desk-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--panel)' }}>
              <Th>
                <T hi="साल" en="Year" />
              </Th>
              <Th right>
                <T hi="किश्तें" en="Instalments" />
              </Th>
              <Th right>
                <T hi="चुकाया" en="Paid" />
              </Th>
              <Th right>
                <T hi="ब्याज़" en="Interest" />
              </Th>
              <Th right>
                <T hi="बकाया" en="Balance" />
              </Th>
            </tr>
          </thead>
          <tbody>
            {plan.years.map((y) => (
              <tr
                key={y.year}
                style={{
                  borderTop: '1px solid var(--line-soft)',
                  background: y.year % 2 === 0 ? 'var(--navy-tint2)' : 'transparent',
                }}
              >
                <Td>
                  <T hi={`साल ${y.year}`} en={`Year ${y.year}`} />
                  {y.hasGrace ? (
                    <span
                      style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700, marginLeft: '8px' }}
                    >
                      <T hi="छूट" en="grace" />
                    </span>
                  ) : null}
                </Td>
                <Td right>{y.instalments}</Td>
                <Td right>{inr(y.paid)}</Td>
                <Td right>{inr(y.interest)}</Td>
                <Td right>{inr(y.balance)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ maxWidth: '320px', marginTop: '26px' }}>
        <Primary onClick={() => nav.go('share')} arrow>
          <T hi="बैंक को दिखाइए" en="Show this to the bank" />
        </Primary>
      </div>
    </DesktopShell>
  );
}

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th
    style={{
      textAlign: right ? 'right' : 'left',
      padding: '12px 18px',
      fontSize: '12px',
      fontWeight: 700,
      color: 'var(--faint)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
    }}
  >
    {children}
  </th>
);

const Td = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <td
    style={{
      padding: '13px 18px',
      textAlign: right ? 'right' : 'left',
      color: 'var(--text)',
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {children}
  </td>
);
