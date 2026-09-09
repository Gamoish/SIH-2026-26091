'use client';
import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { narrate, label } from '@/domain/feasibility';
import { isGap } from '@/domain/finance';
import { inr, num } from '@/lib/format';
import { Alternatives, Header, IllustrativeNote, Primary, T } from '@/components';

const Mark = ({ children, tone = 'navy' }: { children: React.ReactNode; tone?: 'navy' | 'sage' }) => (
  <b
    style={{
      background: tone === 'sage' ? 'var(--sage-tint)' : 'var(--navy-tint)',
      color: tone === 'sage' ? '#3F5637' : 'var(--navy-dark)',
      borderRadius: '5px',
      padding: '0 5px',
      fontWeight: 700,
    }}
  >
    {children}
  </b>
);

const Section = ({ n, hi, en }: { n: number; hi: string; en: string }) => (
  <div
    style={{
      fontFamily: 'var(--serif)',
      fontSize: '13.5px',
      fontWeight: 600,
      color: 'var(--navy-dark)',
      borderBottom: '1px solid var(--line)',
      paddingBottom: '5px',
      marginTop: '4px',
    }}
  >
    {n} · <T hi={hi} en={en} />
  </div>
);

export default function ReportScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { report, plan, alternatives } = useCase();
  if (!report) return null;

  const business = label(report.business.name, s.lang);
  const village = label(report.village.name, s.lang);
  const price = report.pricing.suggested;
  const priceText = price < 10 ? `₹${price.toFixed(2)}` : inr(price);
  const unit = label(report.business.unit, s.lang);
  const monthly = report.estimatedAnnualRevenue / 12;

  const emiShare = plan && !isGap(plan) && monthly > 0 ? Math.round((plan.emi / monthly) * 100) : null;

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('feasibility')} title={<T hi="पूरी रिपोर्ट" en="Full report" />} />

      <div
        style={{ flex: 1, padding: '13px 14px 14px', display: 'flex', flexDirection: 'column', gap: '9px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            background: 'var(--navy)',
            color: '#fff',
            borderRadius: '13px',
            padding: '10px 13px',
            boxShadow: 'var(--e1)',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: '.85' }}>
            {report.score}
            <span style={{ fontSize: '11px', color: '#9FB6D3', fontWeight: 600 }}>/100</span>
          </div>
          <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,.2)' }} />
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: report.verdict === 'good' ? 'var(--saffron-soft)' : '#E6B94F',
            }}
          >
            {report.verdict === 'good' ? (
              <T hi="अच्छा मौका" en="Good opportunity" />
            ) : (
              <T hi="पहले जाँच लीजिए" en="Worth checking first" />
            )}
          </div>
        </div>

        <Section n={1} hi="व्यावसायिक आधार" en="Business case" />
        <div style={{ fontSize: '11.5px', lineHeight: 1.65, color: 'var(--text)' }}>
          {narrate(report, s.lang)}{' '}
          <T
            hi={`${village} (${report.village.block} तहसील) में ${business} की इकाई। ${report.radiusKm} किमी के दायरे में `}
            en={`A ${business.toLowerCase()} unit in ${village} (${report.village.block} tehsil). Within ${report.radiusKm} km there are `}
          />
          <Mark>
            {num(report.marketReach.households)} <T hi="घर" en="households" />
          </Mark>
          <T hi=" और " en=" and " />
          <Mark>
            {report.totalCompetitors} <T hi="प्रतियोगी" en="competitors" />
          </Mark>
          <T hi=". सुझाया दाम " en=". Suggested price " />
          <Mark tone="sage">
            {priceText} {unit}
          </Mark>
          <T
            hi={`, जिससे अनुमानित मासिक आय ${inr(monthly)} बनती है।`}
            en={`, giving an estimated monthly income of ${inr(monthly)}.`}
          />
        </div>

        {emiShare != null ? (
          <div
            style={{
              borderLeft: '3px solid var(--teal)',
              background: 'var(--teal-tint)',
              padding: '9px 12px',
              borderRadius: '0 8px 8px 0',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F4E68', lineHeight: 1.4 }}>
              <T
                hi={`“किश्त अनुमानित कमाई का लगभग ${emiShare}% है”`}
                en={`“The instalment is about ${emiShare}% of estimated income”`}
              />
            </div>
            {emiShare > 40 ? (
              <div style={{ fontSize: '11px', color: 'var(--rust)', marginTop: '4px', fontWeight: 600 }}>
                <T
                  hi="यह हिस्सा ऊँचा है — कम पूँजी या लंबी अवधि पर विचार कीजिए।"
                  en="That share is high — consider less capital or a longer tenure."
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <Section n={2} hi="जोखिम एवं शर्तें" en="Risks & conditions" />
        <ul
          style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--text)', margin: 0, paddingLeft: '16px' }}
        >
          {report.swot.weaknesses.concat(report.swot.threats).map((r, i) => (
            <li key={i} style={{ marginBottom: '3px' }}>
              {label(r, s.lang)}
            </li>
          ))}
          {plan && !isGap(plan) ? (
            <li style={{ marginBottom: '3px' }}>
              <T
                hi={`${plan.scheme.code} पात्रता ${s.social} प्रमाण-पत्र सत्यापन के अधीन।`}
                en={`${plan.scheme.code} eligibility is subject to ${s.social}-certificate verification.`}
              />
            </li>
          ) : null}
        </ul>

        {/* Carries the for/against balance rather than a bare label, matching
            the stat cards on the feasibility screen and the desktop report's
            side panels. Same button, same destination - density only. */}
        <button
          onClick={() => nav.go('swot')}
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '11px',
            padding: '10px 13px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--navy)',
            boxShadow: 'var(--e1)',
            minHeight: '52px',
          }}
        >
          <span
            style={{
              flex: 'none',
              minWidth: '54px',
              textAlign: 'center',
              borderRadius: '9px',
              padding: '5px 8px',
              background: 'var(--sage-tint)',
              border: '1px solid var(--sage-line)',
              color: '#3F5637',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            {report.swot.strengths.length + report.swot.opportunities.length}/
            {report.swot.weaknesses.length + report.swot.threats.length}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 700 }}>
              <T hi="मज़बूती और जोखिम" en="Strengths & risks" />
            </span>
            <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--muted)', marginTop: '1px' }}>
              <T hi="पक्ष / जोखिम · पूरा SWOT" en="for / against · full SWOT" />
            </span>
          </span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--faint)"
            strokeWidth="2.4"
            style={{ flex: 'none' }}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        <Alternatives items={alternatives} />

        <IllustrativeNote />

        <Primary onClick={() => nav.go('scheme')} arrow style={{ marginTop: 'auto' }}>
          <T hi="आगे · पैसे का रास्ता" en="Next · the money path" />
        </Primary>
      </div>
    </div>
  );
}
