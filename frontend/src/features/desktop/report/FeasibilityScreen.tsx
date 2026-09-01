'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { narrate, label } from '@/domain/feasibility';
import { inr, num } from '@/lib/format';
import { Primary, ScoreDial, Stat, T } from '@/components';
import { DesktopShell, Legend } from '../shell';

/**
 * D-P2. The verdict: one score, one plain sentence, three supporting figures.
 * Every number is `buildReport()`'s - the canvas's 79/100 is a placeholder and
 * is not reproduced here.
 */
export default function FeasibilityScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { report } = useCase();
  if (!report) return null;

  const good = report.verdict === 'good';
  const business = label(report.business.name, s.lang);
  const village = label(report.village.name, s.lang);

  return (
    <DesktopShell padding="32px 40px" title={<T hi="आपकी जाँच का नतीजा" en="Your result" />}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '26px' }}>
            <ScoreDial score={report.score} size={168} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                {business} · {village}, {report.village.block}
              </div>
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: good ? 'var(--green)' : 'var(--amber)',
                  lineHeight: 1.2,
                }}
              >
                {good ? (
                  <T hi="अच्छा मौका" en="Good opportunity" />
                ) : (
                  <T hi="पहले जाँच लीजिए" en="Worth checking first" />
                )}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'var(--text)', margin: '0 0 26px' }}>
            {narrate(report, s.lang)}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
            <Stat
              size="sm"
              label={<T hi="दायरे में लोग" en="People in radius" />}
              value={num(report.marketReach.population)}
            />
            <Stat
              size="sm"
              tone="sage"
              label={<T hi="प्रतियोगी" en="Competitors" />}
              value={String(report.totalCompetitors)}
            />
            <Stat
              size="sm"
              tone="green-outline"
              label={<T hi="प्रति प्रतियोगी लोग" en="People per competitor" />}
              value={num(report.peoplePerCompetitor)}
            />
          </div>
        </div>

        <div className="dc-desk-card" style={{ padding: '22px 24px' }}>
          <Legend>
            <T hi="आगे क्या" en="What next" />
          </Legend>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginTop: 0 }}>
            <T
              hi={`सुझाया दाम ${inr(report.pricing.suggested)} — पूरी रिपोर्ट में प्रतियोगी, दाम और जोखिम विस्तार से हैं।`}
              en={`Suggested price ${inr(report.pricing.suggested)} — the full report covers competitors, pricing and risks in detail.`}
            />
          </p>
          <Primary onClick={() => nav.go('report')} arrow>
            <T hi="पूरी रिपोर्ट देखिए" en="Read the full report" />
          </Primary>
        </div>
      </div>
    </DesktopShell>
  );
}
