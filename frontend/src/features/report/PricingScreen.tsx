'use client';
import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { label } from '@/domain/feasibility';
import { Header, T } from '@/components';

export default function PricingScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { report } = useCase();
  if (!report) return null;

  const unit = label(report.business.unit, s.lang);
  const money = (n: number) => (n < 10 ? `₹${n.toFixed(2)}` : `₹${n.toLocaleString('en-IN')}`);
  const { low, suggested, high } = report.pricing;
  const spread = Math.max(0.0001, high - low);

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('feasibility')} title={<T hi="सुझाया दाम" en="Suggested price" />} />

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div
          style={{
            background: 'var(--navy)',
            color: '#fff',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: 'var(--e2)',
            backgroundImage: 'var(--ledger-ink)',
          }}
        >
          <div
            style={{ fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: '#9FB6D3' }}
          >
            <T hi="सुझाया दाम" en="Suggested price" />
          </div>
          <div style={{ fontSize: '44px', fontWeight: 700, lineHeight: 1, marginTop: '4px' }}>
            {money(suggested)}
            <span style={{ fontSize: '14px', color: '#9FB6D3', fontWeight: 600 }}> {unit}</span>
          </div>
          <div style={{ fontSize: '12.5px', color: '#CBDAEC', marginTop: '3px' }}>
            <T
              hi={`${label(report.village.name, 'hi')} के ${report.radiusKm} किमी दायरे की ख़रीद-क्षमता पर`}
              en={`Based on purchasing power within ${report.radiusKm} km of ${label(report.village.name, 'en')}`}
            />
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '14px 15px',
            boxShadow: 'var(--e1)',
          }}
        >
          <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: '12px' }}>
            <T hi="दाम की सीमा" en="Workable range" />
          </div>
          <div
            style={{
              position: 'relative',
              height: '10px',
              borderRadius: '6px',
              background: 'linear-gradient(90deg,var(--amber-tint),var(--green-tint),var(--amber-tint))',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                left: `${((suggested - low) / spread) * 100}%`,
                transform: 'translateX(-50%)',
                width: '4px',
                height: '20px',
                borderRadius: '3px',
                background: 'var(--navy)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
            <span style={{ color: 'var(--muted)' }}>
              {money(low)} <T hi="कम" en="low" />
            </span>
            <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{money(suggested)}</span>
            <span style={{ color: 'var(--muted)' }}>
              {money(high)} <T hi="ऊँचा" en="high" />
            </span>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '13px 15px',
            boxShadow: 'var(--e1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>
              <T hi="दायरे में लोग" en="People in radius" />
            </span>
            <span style={{ fontWeight: 600 }}>{report.marketReach.population.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>
              <T hi="प्रतियोगी" en="Competitors" />
            </span>
            <span style={{ fontWeight: 600 }}>{report.totalCompetitors}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--line-soft)',
              paddingTop: '9px',
            }}
          >
            <span style={{ color: '#2E6B45', fontWeight: 600 }}>
              <T hi="हर यूनिट के हिस्से लोग" en="People per unit" />
            </span>
            <span style={{ fontWeight: 700, color: 'var(--green)' }}>
              {report.peoplePerCompetitor.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div
          style={{
            fontSize: '12px',
            color: 'var(--text)',
            lineHeight: 1.6,
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '11px 13px',
            boxShadow: 'var(--e1)',
          }}
        >
          {report.verdict === 'good' ? (
            <T
              hi={`इस दायरे में मुक़ाबला कम है, इसलिए ${money(suggested)} पर भी माँग बनी रहनी चाहिए।`}
              en={`Competition in this radius is light, so demand should hold even at ${money(suggested)}.`}
            />
          ) : (
            <T
              hi={`यहाँ पहले से ${report.totalCompetitors} यूनिट हैं — ${money(suggested)} से ऊपर जाने पर ग्राहक क़स्बे की ओर जा सकते हैं।`}
              en={`With ${report.totalCompetitors} units already here, going above ${money(suggested)} risks pushing buyers towards the town.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
