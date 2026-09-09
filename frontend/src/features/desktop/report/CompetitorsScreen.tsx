'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useCase } from '@/hooks/use-case';
import { label } from '@/domain/feasibility';
import { num } from '@/lib/format';
import { CompetitorMap, IllustrativeNote, Stat, T } from '@/components';
import { DesktopShell, Legend } from '../shell';

/**
 * The three headline figures. Exported because the report opens this view in a
 * modal as well as at its own route: the page puts them in the side panel, the
 * modal puts them in a row. One definition either way, so the two can never
 * drift apart.
 */
export function CompetitorsStats({ row = false }: { row?: boolean }) {
  const { report } = useCase();
  if (!report) return null;
  const yours = report.competitors.find((c) => c.isYours);

  return (
    // Always a grid so the gap survives either placement; only the column
    // count changes. In the side panel these used to be direct flex children
    // of the aside, which is where the spacing came from.
    <div
      style={{
        display: 'grid',
        gap: '14px',
        ...(row ? { gridTemplateColumns: 'repeat(3,1fr)' } : null),
      }}
    >
      <Stat
        size="sm"
        label={<T hi="कुल प्रतियोगी" en="Total competitors" />}
        value={String(report.totalCompetitors)}
      />
      <Stat
        size="sm"
        tone="green-outline"
        label={<T hi="प्रति प्रतियोगी लोग" en="People per competitor" />}
        value={num(report.peoplePerCompetitor)}
      />
      <Stat
        size="sm"
        tone="sage"
        label={<T hi="आपके गाँव में" en="In your village" />}
        value={String(yours?.count ?? 0)}
      />
    </div>
  );
}

/**
 * D-P3b. Bar length is each village's real competitor count and the label its
 * real distance, both from `buildReport()` - nothing is hand-placed.
 *
 * The map above it plots one sample point per counted competitor. Both the
 * page and the report modal render this, so they cannot drift.
 */
export function CompetitorsBody() {
  const { s } = useSession();
  const { report } = useCase();
  if (!report) return null;

  const rows = report.competitors;
  const max = Math.max(1, ...rows.map((c) => c.count));

  return (
    <>
      <CompetitorMap report={report} />
      <div style={{ height: '18px' }} />
      <div className="dc-desk-card" style={{ padding: '18px 22px', display: 'grid', gap: '14px' }}>
        {rows.map((c) => (
          <div
            key={c.name.en}
            style={{
              display: 'grid',
              gridTemplateColumns: '190px 1fr 110px',
              gap: '14px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '14.5px',
                fontWeight: c.isYours ? 700 : 500,
                color: c.isYours ? 'var(--navy-dark)' : 'var(--text)',
                minWidth: 0,
              }}
            >
              {label(c.name, s.lang)}
              {c.isYours ? (
                <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700, marginLeft: '6px' }}>
                  <T hi="आपका" en="yours" />
                </span>
              ) : null}
            </div>
            <div
              style={{ height: '20px', borderRadius: '5px', background: 'var(--panel)', overflow: 'hidden' }}
            >
              <div
                style={{
                  width: `${Math.round((c.count / max) * 100)}%`,
                  height: '100%',
                  borderRadius: '5px',
                  background: c.isYours ? 'var(--green)' : 'var(--steel)',
                }}
              />
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: 'var(--muted)',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {c.count} · {c.km} <T hi="किमी" en="km" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function CompetitorsScreen() {
  const { report } = useCase();
  if (!report) return null;

  return (
    <DesktopShell
      padding="32px 40px"
      asideWidth={420}
      aside={
        <>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy-dark)' }}>
            <T hi="एक नज़र में" en="At a glance" />
          </div>
          <CompetitorsStats />
        </>
      }
      title={<T hi="प्रतियोगी" en="Competitors" />}
    >
      <Legend>
        <T hi="गाँव-दर-गाँव" en="Village by village" />
      </Legend>
      <CompetitorsBody />
      <IllustrativeNote style={{ marginTop: '26px' }} />
    </DesktopShell>
  );
}
