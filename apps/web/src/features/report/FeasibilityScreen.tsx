'use client';
import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { narrate, label } from '@/domain/feasibility';
import { inr, num } from '@/lib/format';
import { Header, Primary, T } from '@/components';

export default function FeasibilityScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { report } = useCase();
  if (!report) return null;

  const good = report.verdict === 'good';
  const price = report.pricing.suggested;
  const business = label(report.business.name, s.lang);

  return (
    <div className="dc-phone">
      <Header
        onBack={() => nav.go('category')}
        title={
          <>
            <div
              style={{
                fontSize: '11px',
                color: '#9FB6D3',
                letterSpacing: '.08em',
                textTransform: 'uppercase',
              }}
            >
              <T hi="व्यवहार्यता रिपोर्ट" en="Feasibility report" />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 600 }}>
              {business} · {label(report.village.name, s.lang)}
            </div>
          </>
        }
      />

      <div
        style={{ flex: 1, padding: '12px 13px 13px', display: 'flex', flexDirection: 'column', gap: '9px' }}
      >
        <div
          style={{
            background: 'var(--navy)',
            color: '#fff',
            borderRadius: '15px',
            padding: '14px',
            boxShadow: 'var(--e2)',
            backgroundImage: 'var(--ledger-ink)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'center', flex: 'none' }}>
              <div style={{ fontSize: '56px', fontWeight: 700, lineHeight: '.82' }}>{report.score}</div>
              <div style={{ fontSize: '10.5px', color: '#9FB6D3', marginTop: '2px' }}>/ 100</div>
            </div>
            <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,.2)' }} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{ fontSize: '16px', fontWeight: 700, color: good ? 'var(--saffron-soft)' : '#E6B94F' }}
              >
                {good ? (
                  <T hi="अच्छा मौका" en="Good opportunity" />
                ) : (
                  <T hi="पहले जाँच लीजिए" en="Worth checking first" />
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: '#CBDAEC', lineHeight: 1.42, marginTop: '3px' }}>
                {narrate(report, s.lang)}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              height: '8px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,.15)',
              marginTop: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                right: `${100 - report.score}%`,
                background: 'linear-gradient(90deg,var(--rust),var(--saffron),var(--green))',
                borderRadius: '20px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '60%',
                top: '-3px',
                bottom: '-3px',
                width: '1.5px',
                background: 'rgba(255,255,255,.55)',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9.5px',
              color: '#8FB0D6',
              marginTop: '4px',
            }}
          >
            <span>0</span>
            <span>
              <T hi="पास 60" en="pass 60" />
            </span>
            <span>100</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
          <button
            onClick={() => nav.go('competitors')}
            style={{
              textAlign: 'left',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '11px 13px',
              boxShadow: 'var(--e1)',
              cursor: 'pointer',
              minHeight: '68px',
            }}
          >
            <div style={{ fontSize: '19px', fontWeight: 700 }}>{num(report.marketReach.population)}</div>
            <div
              style={{
                fontSize: '10.5px',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <T hi={`${report.radiusKm} किमी में लोग`} en={`people within ${report.radiusKm} km`} />
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="3">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => nav.go('pricing')}
            style={{
              textAlign: 'left',
              background: 'var(--sage-tint)',
              border: '1px solid var(--sage-line)',
              borderRadius: '12px',
              padding: '11px 13px',
              boxShadow: 'var(--e1)',
              cursor: 'pointer',
              minHeight: '68px',
            }}
          >
            <div style={{ fontSize: '19px', fontWeight: 700, color: 'var(--sage)' }}>
              {price < 10 ? `₹${price.toFixed(2)}` : inr(price)}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#3F5637',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <T hi="सुझाया दाम" en="Suggested price" />
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#3F5637" strokeWidth="3">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => nav.go('competitors')}
            style={{
              textAlign: 'left',
              background: '#fff',
              border: `1px solid ${good ? 'var(--green-line)' : 'var(--amber-line)'}`,
              borderRadius: '12px',
              padding: '11px 13px',
              boxShadow: 'var(--e1)',
              cursor: 'pointer',
              minHeight: '68px',
            }}
          >
            <div style={{ fontSize: '19px', fontWeight: 700, color: good ? 'var(--green)' : 'var(--amber)' }}>
              {report.totalCompetitors}{' '}
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                <T hi="यूनिट" en="units" />
              </span>
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <T hi="प्रतियोगी" en="competitors" />
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="3">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => nav.go('swot')}
            style={{
              textAlign: 'left',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '11px 13px',
              boxShadow: 'var(--e1)',
              cursor: 'pointer',
              minHeight: '68px',
            }}
          >
            <div style={{ fontSize: '19px', fontWeight: 700 }}>
              {report.swot.strengths.length +
                report.swot.weaknesses.length +
                report.swot.opportunities.length +
                report.swot.threats.length}
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <T hi="मज़बूती व जोखिम" en="strengths & risks" />
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="3">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </button>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: 'var(--e1)',
          }}
        >
          <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
            <T hi="महीने की कमाई (अनुमान)" en="Monthly income (estimate)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--navy-dark)', marginTop: '2px' }}>
            {inr(report.estimatedAnnualRevenue / 12)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.5 }}>
            <T
              hi={`${inr(report.estimatedAnnualRevenue)} सालाना, पूरी क्षमता पर — यह अनुमान है, गारंटी नहीं।`}
              en={`${inr(report.estimatedAnnualRevenue)} a year at full utilisation — an estimate, not a guarantee.`}
            />
          </div>
        </div>

        <Primary onClick={() => nav.go('report')} arrow style={{ marginTop: 'auto' }}>
          <T hi="पूरी रिपोर्ट" en="Full report" />
        </Primary>
      </div>
    </div>
  );
}
