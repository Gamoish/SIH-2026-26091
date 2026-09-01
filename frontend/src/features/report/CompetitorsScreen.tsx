'use client';
import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { label } from '@/domain/feasibility';
import { num } from '@/lib/format';
import { Header, T } from '@/components';

export default function CompetitorsScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { report } = useCase();
  if (!report) return null;

  const max = Math.max(1, ...report.competitors.map((c) => c.count));
  const avg = report.totalCompetitors / Math.max(1, report.competitors.length);
  const yours = report.competitors.find((c) => c.isYours);

  const spread = Math.max(0.001, ...report.competitors.map((c) => c.km)) * 1.25;

  return (
    <div className="dc-phone">
      <Header
        onBack={() => nav.go('feasibility')}
        title={<T hi="प्रतियोगी और ग्राहक" en="Competitors & customers" />}
      />

      <div
        style={{ flex: 1, padding: '13px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '13px',
            overflow: 'hidden',
            boxShadow: 'var(--e1)',
          }}
        >
          <svg viewBox="0 0 330 190" width="100%" height="176" role="img" aria-label="Competitor map">
            <rect width="330" height="190" fill="rgba(199,216,237,.4)" />
            <g stroke="#C0CFE2" strokeWidth="1" opacity=".7">
              <path d="M0 47h330M0 95h330M0 143h330M55 0v190M110 0v190M165 0v190M220 0v190M275 0v190" />
            </g>
            <circle
              cx="165"
              cy="95"
              r={(report.radiusKm / spread) * 78}
              fill="none"
              stroke="var(--navy)"
              strokeWidth="1.3"
              strokeDasharray="4 3"
            />
            {report.competitors.map((c, i) => {
              const v = report.competitors.length;
              const angle = (i / Math.max(1, v)) * Math.PI * 2 - Math.PI / 2;
              const r = c.isYours ? 0 : (c.km / spread) * 78;
              const cx = 165 + Math.cos(angle) * r;
              const cy = 95 + Math.sin(angle) * r * 0.62;
              const size = 8 + (c.count / max) * 9;
              const fill = c.isYours
                ? 'var(--navy)'
                : c.count >= max
                  ? 'var(--rust)'
                  : c.count > avg
                    ? 'var(--amber)'
                    : 'var(--green)';
              return (
                <g key={c.name.en} fontFamily="var(--sans)" fontSize="10.5" fontWeight="600">
                  <circle cx={cx} cy={cy} r={size + 14} fill={fill} opacity=".14" />
                  <circle cx={cx} cy={cy} r={size} fill={fill} />
                  <text x={cx} y={cy + 3.5} fill="#fff" textAnchor="middle">
                    {c.count}
                  </text>
                  <text
                    x={cx}
                    y={cy + size + 13}
                    fill={c.isYours ? 'var(--navy-dark)' : 'var(--text)'}
                    textAnchor="middle"
                    fontWeight={c.isYours ? 700 : 600}
                  >
                    {label(c.name, s.lang)}
                  </text>
                </g>
              );
            })}
          </svg>
          <div style={{ padding: '8px 11px', fontSize: '10.5px', color: 'var(--muted)' }}>
            <T
              hi="बड़ा घेरा = ज़्यादा प्रतियोगी · बीच में आपका गाँव"
              en="Bigger circle = more competitors · your village at the centre"
            />
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '13px',
            padding: '12px 13px',
            boxShadow: 'var(--e1)',
            flex: 1,
          }}
        >
          <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: '9px' }}>
            <T hi="गाँव-वार प्रतियोगी" en="Village-wise competitors" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {report.competitors.map((c) => {
              const bar = c.isYours
                ? 'var(--navy)'
                : c.count >= max
                  ? 'var(--rust)'
                  : c.count > avg
                    ? 'var(--amber)'
                    : 'var(--green)';
              return (
                <div key={c.name.en}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '3px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: c.isYours ? 700 : 500,
                        color: c.isYours ? 'var(--navy-dark)' : 'var(--text)',
                      }}
                    >
                      {label(c.name, s.lang)}
                      {c.isYours ? (
                        <span style={{ fontWeight: 400, color: 'var(--muted)' }}>
                          {' '}
                          · <T hi="आपका गाँव" en="your village" />
                        </span>
                      ) : (
                        <span style={{ fontWeight: 400, color: 'var(--faint)' }}> · {c.km} km</span>
                      )}
                    </span>
                    <span style={{ fontWeight: 700, color: bar }}>{c.count}</span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      borderRadius: '5px',
                      background: 'var(--bg)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.round((c.count / max) * 100)}%`,
                        background: bar,
                        borderRadius: '5px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            fontSize: '11px',
            lineHeight: 1.55,
            borderRadius: '9px',
            padding: '9px 10px',
            color: report.verdict === 'good' ? '#0E6234' : '#8A4E06',
            background: report.verdict === 'good' ? 'var(--green-tint)' : 'var(--saffron-tint)',
          }}
        >
          <T
            hi={`आपके ${report.radiusKm} किमी दायरे में कुल ${report.totalCompetitors} यूनिट — हर एक पर लगभग ${num(report.peoplePerCompetitor)} लोग।${yours ? ` ${label(yours.name, 'hi')} में ${yours.count}।` : ''}`}
            en={`${report.totalCompetitors} units across your ${report.radiusKm} km radius — about ${num(report.peoplePerCompetitor)} people each.${yours ? ` ${label(yours.name, 'en')} has ${yours.count}.` : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
