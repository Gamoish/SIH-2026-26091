'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useCase } from '@/hooks/use-case';
import { label } from '@/domain/feasibility';
import type { Bilingual } from '@/types';
import { T } from '@/components';
import { DesktopShell } from '../shell';

const QUADS = [
  {
    key: 'strengths',
    hi: 'मज़बूती',
    en: 'Strengths',
    color: 'var(--green)',
    bg: 'var(--green-tint)',
    line: 'var(--green-line)',
  },
  {
    key: 'weaknesses',
    hi: 'कमज़ोरी',
    en: 'Weaknesses',
    color: 'var(--rust)',
    bg: 'var(--rust-tint)',
    line: 'var(--rust-soft)',
  },
  {
    key: 'opportunities',
    hi: 'मौके',
    en: 'Opportunities',
    color: 'var(--teal)',
    bg: 'var(--teal-tint)',
    line: 'var(--teal-line)',
  },
  {
    key: 'threats',
    hi: 'जोखिम',
    en: 'Risks',
    color: 'var(--amber)',
    bg: 'var(--amber-tint)',
    line: 'var(--amber-line)',
  },
] as const;

/**
 * D-P3. All four quadrants open at once - the wide viewport's one real gain.
 * Exported separately from the page so the report can open it in a modal.
 */
export function SwotBody() {
  const { s } = useSession();
  const { report } = useCase();
  if (!report) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '18px' }}>
      {QUADS.map((q) => {
        const items = report.swot[q.key] as Bilingual[];
        return (
          <section
            key={q.key}
            style={{
              background: q.bg,
              border: `1px solid ${q.line}`,
              borderRadius: '16px',
              padding: '20px 22px',
              minHeight: '180px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '17px',
                fontWeight: 600,
                color: q.color,
                margin: '0 0 12px',
              }}
            >
              <T hi={q.hi} en={q.en} />
            </h2>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '9px' }}>
              {items.map((it) => (
                <li key={it.en} style={{ fontSize: '14.5px', lineHeight: 1.55, color: 'var(--text)' }}>
                  {label(it, s.lang)}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function SwotScreen() {
  return (
    <DesktopShell padding="32px 40px" title={<T hi="मज़बूती और जोखिम" en="Strengths & risks" />}>
      <SwotBody />
    </DesktopShell>
  );
}
