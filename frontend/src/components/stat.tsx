import React from 'react';

/**
 * A labelled number on a card. Two sizes, because the wide layout uses the
 * same tile at two weights: `lg` heads a section, `sm` sits in a row of
 * supporting figures.
 *
 * `green-outline` is deliberately distinct from `green`: one is a tinted fill,
 * the other a white card with a green rule, and both are in use.
 */
export type StatTone = 'plain' | 'amber' | 'green' | 'green-outline' | 'navy' | 'sage';

const SKIN: Record<StatTone, { bg: string; border: string; label: string; value: string }> = {
  plain: { bg: '#fff', border: 'var(--line)', label: 'var(--muted)', value: 'var(--text)' },
  amber: { bg: 'var(--saffron-tint)', border: 'var(--amber-line)', label: '#8A4E06', value: '#8A4E06' },
  green: { bg: 'var(--green-tint)', border: 'var(--green-line)', label: '#0E6234', value: 'var(--green)' },
  'green-outline': { bg: '#fff', border: 'var(--green-line)', label: 'var(--muted)', value: 'var(--green)' },
  navy: {
    bg: 'var(--navy-tint2)',
    border: 'var(--navy-tint)',
    label: 'var(--navy-dark)',
    value: 'var(--navy-dark)',
  },
  sage: { bg: 'var(--sage-tint)', border: 'var(--sage-line)', label: '#3F5637', value: 'var(--sage)' },
};

export function Stat({
  label,
  value,
  tone = 'plain',
  size = 'lg',
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: StatTone;
  size?: 'lg' | 'sm';
}) {
  const skin = SKIN[tone];
  const lg = size === 'lg';
  return (
    <div
      style={{
        background: skin.bg,
        border: `1px solid ${skin.border}`,
        borderRadius: '14px',
        padding: lg ? '18px 20px' : '14px 16px',
        boxShadow: 'var(--e1)',
      }}
    >
      {lg ? (
        <>
          <div
            style={{
              fontSize: '12px',
              color: skin.label,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: '30px', fontWeight: 700, marginTop: '4px', color: skin.value }}>
            {value}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '22px', fontWeight: 700, color: skin.value }}>{value}</div>
          <div style={{ fontSize: '12.5px', color: skin.label }}>{label}</div>
        </>
      )}
    </div>
  );
}
