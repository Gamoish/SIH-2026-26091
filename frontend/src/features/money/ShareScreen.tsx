'use client';
import React, { useEffect } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { isGap } from '@/domain/finance';
import { label, narrate } from '@/domain/feasibility';
import { inr } from '@/lib/format';
import { Header, Primary, T, useT } from '@/components';

export default function ShareScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const { report, plan } = useCase();

  useEffect(() => {
    if (!s.savedAt) set({ savedAt: new Date().toISOString() });
  }, [s.savedAt, set]);

  if (!report) return null;
  const money = plan && !isGap(plan) ? plan : null;
  const ref = `SNB-${String((Math.abs(hash(s.phone + report.village.id)) % 9000) + 1000)}`;

  const summary = [
    t('उद्यम साथी · व्यवहार्यता एवं ऋण सारांश', 'Udyam Sathi · Feasibility & loan summary'),
    `${t('आवेदक', 'Applicant')}: ${s.name || '—'}${s.social ? ` (${s.social})` : ''}`,
    `${t('कारोबार', 'Business')}: ${label(report.business.name, s.lang)}`,
    `${t('जगह', 'Location')}: ${label(report.village.name, s.lang)}, ${report.village.block}, Sonbhadra`,
    `${t('स्कोर', 'Score')}: ${report.score}/100`,
    money
      ? `${t('योजना', 'Scheme')}: ${money.scheme.code} · ${t('लागत', 'Project')} ${inr(money.projectCost)} · ${t('ऋण', 'Loan')} ${inr(money.loanAmount)} · EMI ${inr(money.emi)}`
      : t('योजना: आँकड़े लंबित', 'Scheme: figures pending'),
    `${t('संदर्भ', 'Ref')}: ${ref}`,
  ].join('\n');

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Udyam Sathi', text: summary });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(summary);
      alert(t('सारांश कॉपी हो गया', 'Summary copied'));
    } catch {
      alert(summary);
    }
  };

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go(money ? 'emi' : 'scheme')} title={<T hi="साझा करें" en="Share" />} />

      <div
        style={{
          flex: 1,
          padding: '18px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div
          className="print-card"
          style={{
            width: '100%',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '16px 18px',
            boxShadow: 'var(--e2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid var(--navy)',
              paddingBottom: '9px',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--navy-dark)',
                  lineHeight: 1.25,
                }}
              >
                <T hi="व्यवहार्यता एवं ऋण सारांश" en="Feasibility & Loan Summary" />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                {label(report.business.name, s.lang)} · {label(report.village.name, s.lang)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10.5px', color: 'var(--muted)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '13px' }}>{ref}</div>
              <div>
                {s.savedAt
                  ? new Date(s.savedAt).toLocaleDateString(s.lang === 'en' ? 'en-IN' : 'hi-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : null}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            <Field hi="आवेदक" en="Applicant" value={`${s.name || '—'}${s.social ? ` (${s.social})` : ''}`} />
            <Field
              hi="स्थान"
              en="Location"
              value={`${label(report.village.name, s.lang)}, ${report.village.block}`}
            />
            <Field hi="व्यवहार्यता" en="Feasibility" value={`${report.score}/100`} />
            <Field hi="योजना" en="Scheme" value={money ? money.scheme.code : t('लंबित', 'pending')} />
          </div>

          <div
            style={{
              fontSize: '11px',
              lineHeight: 1.6,
              color: '#2A3342',
              marginTop: '12px',
              borderTop: '1px solid var(--line-soft)',
              paddingTop: '10px',
            }}
          >
            {narrate(report, s.lang)}
          </div>

          {money ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                <Field hi="परियोजना लागत" en="Project cost" value={inr(money.projectCost)} big />
                <Field hi="स्वयं का अंश" en="Own share" value={inr(money.capital)} big />
                <Field hi="ऋण राशि" en="Loan amount" value={inr(money.loanAmount)} big tint />
                <Field hi="मासिक किश्त" en="Monthly EMI" value={inr(money.emi)} big />
              </div>

              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', marginTop: '12px' }}
              >
                <thead>
                  <tr style={{ background: 'var(--navy)', color: '#fff' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>
                      <T hi="वर्ष" en="Year" />
                    </th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>
                      <T hi="भुगतान" en="Paid" />
                    </th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>
                      <T hi="ब्याज़" en="Interest" />
                    </th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600 }}>
                      <T hi="शेष" en="Balance" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {money.years.map((y) => (
                    <tr
                      key={y.year}
                      style={{
                        borderBottom: '1px solid var(--line-soft)',
                        background: y.year % 2 === 0 ? 'var(--navy-tint2)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                        {y.year}
                        {y.hasGrace ? (
                          <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 400 }}>
                            {' '}
                            <T hi="(छूट)" en="(grace)" />
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{inr(y.paid)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--rust)' }}>
                        {inr(y.interest)}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>
                        {inr(y.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--navy)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>
                      <T hi="कुल" en="Total" />
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>
                      {inr(money.totalRepaid)}
                    </td>
                    <td
                      style={{
                        padding: '6px 8px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: 'var(--rust)',
                      }}
                    >
                      {inr(money.totalInterest)}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>₹0</td>
                  </tr>
                </tfoot>
              </table>
              <div style={{ fontSize: '9.5px', color: 'var(--faint)', marginTop: '6px', lineHeight: 1.5 }}>
                <T
                  hi={`* पहले ${money.moratoriumMonths} माह छूट। आँकड़े ${money.scheme.code} की दर ${money.interestPct}% पर गणना किए गए; अंतिम स्वीकृति बैंक/चैनलाइज़िंग एजेंसी की होगी।`}
                  en={`* First ${money.moratoriumMonths} months are grace. Figures computed at the ${money.scheme.code} rate of ${money.interestPct}%; final sanction rests with the bank / channelizing agency.`}
                />
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop: '12px',
                fontSize: '11px',
                color: '#8A4E06',
                background: 'var(--saffron-tint)',
                borderRadius: '8px',
                padding: '9px 11px',
                lineHeight: 1.5,
              }}
            >
              <T
                hi="ऋण के आँकड़े अभी पुष्ट नहीं — केवल व्यवहार्यता भाग मान्य है।"
                en="Loan figures are not confirmed yet — only the feasibility half of this summary applies."
              />
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>
            <T hi="अगला क़दम" en="Your next step" />
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.5 }}>
            <T
              hi="यह सारांश बैंक या CSC अधिकारी को दिखाएँ"
              en="Show this summary to the bank or CSC officer"
            />
          </div>
        </div>

        <div
          className="no-print"
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}
        >
          <Primary onClick={() => window.print()}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M6 9V3h12v6M6 18H4v-6h16v6h-2M8 14h8v7H8z" />
            </svg>
            <T hi="प्रिंट / PDF सहेजें" en="Print / save as PDF" />
          </Primary>
          <button
            onClick={share}
            style={{
              width: '100%',
              background: '#fff',
              color: 'var(--green)',
              border: '2px solid var(--green-line)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14.5px',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--green)"
              strokeWidth="2.4"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-13 7L3 21l2.5-5A8.4 8.4 0 1 1 21 11.5z" />
            </svg>
            <T hi="भेजें" en="Send" />
          </button>
          <button
            onClick={() => nav.replace('home')}
            style={{
              width: '100%',
              background: 'transparent',
              border: 0,
              color: 'var(--navy)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            <T hi="होम पर जाइए" en="Go to home" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  hi,
  en,
  value,
  big,
  tint,
}: {
  hi: string;
  en: string;
  value: string;
  big?: boolean;
  tint?: boolean;
}) {
  return (
    <div
      style={{
        border: `1px solid ${tint ? 'var(--teal)' : 'var(--line)'}`,
        background: tint ? 'var(--teal-tint)' : 'transparent',
        borderRadius: '8px',
        padding: '7px 9px',
      }}
    >
      <div
        style={{
          fontSize: '9.5px',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: tint ? 'var(--teal)' : 'var(--faint)',
        }}
      >
        <T hi={hi} en={en} />
      </div>
      <div
        style={{
          fontSize: big ? '16px' : '12.5px',
          fontWeight: big ? 700 : 600,
          color: tint ? '#0F4E68' : 'var(--text)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return h | 0;
}
