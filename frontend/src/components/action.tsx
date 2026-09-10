'use client';

import React from 'react';

/**
 * The inline button the desktop pages use beside a heading or inside a row.
 *
 * `Primary` in button.tsx is the other one, and the two are not rivals: that
 * is the full-width CTA at the foot of a phone screen and in a desktop panel,
 * 48px tall and 16px type. This is the smaller control that sits in a head row
 * or a settings row, where a full-width block would be absurd.
 *
 * What it replaces: four one-off buttons that each guessed. The applications
 * head drew its own saffron fill at radius 9 / 14px / 700; the two print
 * controls drew an outline at radius 9 / 13.5px / 600; settings drew a rust
 * fill and a white outline at radius 9 / 13.5px / 700. Same job, five sets of
 * numbers. Now there are three tones and one set.
 *
 * `busy` is for a control whose work is a navigation: it swaps the label and
 * dims the button, so a press that is about to change the page says so rather
 * than looking ignored while the route resolves.
 */
export type ActionTone = 'primary' | 'quiet' | 'danger';

const SKIN: Record<ActionTone, { bg: string; border: string; color: string }> = {
  primary: { bg: 'var(--saffron)', border: 'var(--saffron)', color: '#fff' },
  quiet: { bg: 'var(--card)', border: 'var(--line)', color: 'var(--muted)' },
  danger: { bg: 'var(--rust)', border: 'var(--rust)', color: '#fff' },
};

export function Action({
  onClick,
  children,
  tone = 'quiet',
  icon,
  busy = false,
  disabled = false,
  ariaLabel,
  testId,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  tone?: ActionTone;
  /** A leading glyph. Inherits the button's colour via `currentColor`. */
  icon?: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  testId?: string;
}) {
  const skin = SKIN[tone];
  const off = disabled || busy;
  return (
    <button
      onClick={onClick}
      disabled={off}
      aria-label={ariaLabel}
      aria-busy={busy || undefined}
      data-testid={testId}
      className="press"
      style={{
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: skin.bg,
        border: `1px solid ${skin.border}`,
        borderRadius: '9px',
        padding: '9px 16px',
        fontSize: '13.5px',
        fontWeight: 700,
        fontFamily: 'var(--sans)',
        color: skin.color,
        cursor: off ? 'default' : 'pointer',
        opacity: busy ? 0.72 : 1,
      }}
    >
      {icon}
      {children}
    </button>
  );
}
