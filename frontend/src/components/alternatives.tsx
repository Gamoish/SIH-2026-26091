import React from 'react';
import { T } from './bilingual';
import type { Alternative } from '@/domain/feasibility';

const REASON = {
  'less-competition': { hi: 'यहाँ इनकी संख्या कम है', en: 'fewer of these around here' },
  'smaller-catchment': { hi: 'कम ग्राहकों में भी चल जाता है', en: 'works with a smaller customer base' },
} as const;

/**
 * Businesses that would score better here, shown under a `check` verdict.
 *
 * Renders NOTHING for an empty list, which is the honest case and not a bug:
 * `betterAlternatives` returns nothing when the verdict was good, when there is
 * no report, or when the other four genuinely score no better. A section that
 * always finds something to recommend is a section that recommends noise.
 *
 * One component for both layouts, like the competitor map, so the phone flow
 * and the wide view cannot suggest different businesses for the same session.
 */
export function Alternatives({ items, style }: { items: Alternative[]; style?: React.CSSProperties }) {
  if (!items.length) return null;

  return (
    <div style={style}>
      <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '8px' }}>
        <T hi="यहाँ ये काम बेहतर चल सकते हैं" en="Other businesses that might work better here" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {items.map((a) => (
          <div
            key={a.business.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '11px',
              padding: '9px 12px',
              boxShadow: 'var(--e1)',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700 }}>
                <T hi={a.business.name.hi} en={a.business.name.en} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                <T hi={REASON[a.reason].hi} en={REASON[a.reason].en} />
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--green)',
                background: 'var(--green-tint)',
                border: '1px solid var(--green-line)',
                borderRadius: '8px',
                padding: '3px 9px',
              }}
            >
              {a.score}
              <span style={{ fontSize: '9.5px', fontWeight: 600, opacity: 0.7 }}>/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
