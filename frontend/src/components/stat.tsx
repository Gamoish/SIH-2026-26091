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
  sub,
  icon,
  tone = 'plain',
  size = 'lg',
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  /**
   * One line saying what the figure actually counts, in the reader's own
   * words. Optional: most stats sit in a row whose heading already says it,
   * and repeating it under every tile is noise.
   */
  sub?: React.ReactNode;
  /**
   * Bare <path>s for a 24x24 stroke icon, drawn in the tone's own colour on a
   * white square - the same treatment the filed-application rows give their
   * document glyph, so a tile and a row read as the same family.
   *
   * Optional, and off by default: the report screen's tiles are told apart by
   * the line under each number, and an icon there would decorate without
   * explaining. It earns its place where the tiles name three states of one
   * thing, which a glyph can carry faster than a word.
   */
  icon?: React.ReactNode;
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
        display: icon ? 'flex' : undefined,
        alignItems: icon ? 'center' : undefined,
        gap: icon ? '13px' : undefined,
      }}
    >
      {icon ? (
        <span
          aria-hidden
          style={{
            width: lg ? '42px' : '36px',
            height: lg ? '42px' : '36px',
            borderRadius: '10px',
            background: '#fff',
            border: `1px solid ${skin.border}`,
            display: 'grid',
            placeItems: 'center',
            flex: 'none',
          }}
        >
          <svg
            width={lg ? 22 : 19}
            height={lg ? 22 : 19}
            viewBox="0 0 24 24"
            fill="none"
            stroke={skin.value}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {icon}
          </svg>
        </span>
      ) : null}

      <div style={{ minWidth: 0 }}>
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
            {sub ? <Sub>{sub}</Sub> : null}
          </>
        ) : (
          <>
            <div style={{ fontSize: '22px', fontWeight: 700, color: skin.value }}>{value}</div>
            <div style={{ fontSize: '12.5px', color: skin.label }}>{label}</div>
            {sub ? <Sub>{sub}</Sub> : null}
          </>
        )}
      </div>
    </div>
  );
}

/** Always `--muted`, never the tone's own colour: this is the quiet half of
 *  the tile, and tinting it to match the figure made it compete with it. */
function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '11.5px', lineHeight: 1.5, color: 'var(--muted)', marginTop: '6px' }}>
      {children}
    </div>
  );
}
