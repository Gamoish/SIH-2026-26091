'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { compareAgainst, isGap } from '@/domain/finance';
import { SCHEMES } from '@/domain/schemes';
import { inr } from '@/lib/format';
import { IllustrativeNote, Primary, Stat, T } from '@/components';
import { DesktopShell, Legend } from '../shell';

/** A commercial term loan, for contrast only - never used to compute a figure. */
const COMMERCIAL_PCT = 11;

/**
 * D-P4. The scheme comparison. Every row is read from the `SCHEMES` table, so
 * a corrected rate changes this screen without a code edit, and an unconfirmed
 * figure shows as a hole rather than a guess.
 */
export default function SchemeScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { plan } = useCase();
  if (!plan) return null;

  if (isGap(plan)) {
    return (
      <DesktopShell padding="32px 40px" title={<T hi="पैसे का रास्ता" en="The money path" />}>
        <div
          style={{
            background: 'var(--amber-tint)',
            border: '1px solid var(--amber-line)',
            borderRadius: '12px',
            padding: '22px 24px',
            fontSize: '15px',
            color: '#8A4E06',
            lineHeight: 1.7,
            maxWidth: '680px',
          }}
        >
          <T
            hi="इस वर्ग की योजना के ब्याज़, अवधि या छूट की पुष्टि बाक़ी है — इसलिए राशि और किश्त नहीं दिखाई जा रही। ग़लत आँकड़े से बेहतर है खाली जगह।"
            en="This category's scheme rate, tenure or grace period is not confirmed yet — so no amount or instalment is shown. A visible gap is safer than a wrong number."
          />
          {plan.scheme ? (
            <div style={{ marginTop: '10px', fontWeight: 700 }}>
              {plan.scheme.code} · <T hi="लंबित" en="pending" />: {plan.missing.join(', ')}
            </div>
          ) : null}
        </div>
      </DesktopShell>
    );
  }

  const vs = compareAgainst(plan, COMMERCIAL_PCT);

  return (
    <DesktopShell title={<T hi="पैसे का रास्ता" en="The money path" />}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '28px' }}>
        <Stat size="sm" label={<T hi="आपके पास" en="You have" />} value={inr(plan.capital)} />
        <Stat
          size="sm"
          tone="navy"
          label={<T hi="कुल परियोजना" en="Project cost" />}
          value={inr(plan.projectCost)}
        />
        <Stat size="sm" tone="green" label={<T hi="ऋण" en="Loan" />} value={inr(plan.loanAmount)} />
        <Stat size="sm" tone="sage" label={<T hi="ब्याज़" en="Interest" />} value={`${plan.interestPct}%`} />
      </div>

      <Legend>
        <T hi="आपकी योजना" en="Your scheme" />
      </Legend>
      <div className="dc-desk-card" style={{ padding: '22px 24px', marginBottom: '28px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-dark)' }}>{plan.scheme.code}</div>
        <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.6 }}>
          <T
            hi={`आप ${s.social} वर्ग में हैं — इसी नाते यह योजना लागू होती है। ${plan.beneficiaryPct}% आपका, बाक़ी योजना का।`}
            en={`You are ${s.social} — that is what routes you to this scheme. ${plan.beneficiaryPct}% is yours, the rest is the scheme's.`}
          />
        </div>
        <div style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 700, marginTop: '12px' }}>
          <T
            hi={`व्यापारिक ऋण से लगभग ${inr(vs.saved)} कम ब्याज़`}
            en={`About ${inr(vs.saved)} less interest than a commercial loan`}
          />
        </div>
      </div>

      <Legend>
        <T hi="सभी योजनाएँ" en="All schemes" />
      </Legend>
      <div className="dc-desk-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--panel)' }}>
              <Th>
                <T hi="योजना" en="Scheme" />
              </Th>
              <Th>
                <T hi="वर्ग" en="Category" />
              </Th>
              <Th>
                <T hi="ब्याज़" en="Interest" />
              </Th>
              <Th>
                <T hi="अवधि" en="Tenure" />
              </Th>
              <Th>
                <T hi="छूट" en="Grace" />
              </Th>
            </tr>
          </thead>
          <tbody>
            {SCHEMES.map((sc) => {
              const mine = sc.code === plan.scheme.code;
              return (
                <tr
                  key={sc.code}
                  style={{
                    borderTop: '1px solid var(--line-soft)',
                    background: mine ? 'var(--navy-tint2)' : 'transparent',
                    fontWeight: mine ? 700 : 500,
                  }}
                >
                  <Td>{sc.code}</Td>
                  <Td>{sc.eligible.join(' / ')}</Td>
                  <Td>{fig(sc.interestPct, '%')}</Td>
                  <Td>{fig(sc.tenureMonths, ' mo')}</Td>
                  <Td>{fig(sc.moratoriumMonths, ' mo')}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ maxWidth: '320px', marginTop: '26px' }}>
        <Primary onClick={() => nav.go('emi')} arrow>
          <T hi="वापसी का समय देखिए" en="See the repayment plan" />
        </Primary>
      </div>
      <IllustrativeNote style={{ marginTop: '26px' }} />
    </DesktopShell>
  );
}

/** A null column is an unconfirmed figure, and says so instead of showing 0. */
function fig(n: number | null, suffix: string) {
  return n == null ? <span style={{ color: 'var(--amber)' }}>—</span> : `${n}${suffix}`;
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th
    style={{
      textAlign: 'left',
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

const Td = ({ children }: { children: React.ReactNode }) => (
  <td style={{ padding: '13px 18px', color: 'var(--text)' }}>{children}</td>
);
