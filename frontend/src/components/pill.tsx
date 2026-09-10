import React from 'react';

/**
 * The one rounded label the desktop screens use for a single fact: a tag on a
 * filed row, a chip on the dashboard's case card, a filing status, the
 * location beside a page title.
 *
 * There were four of these before this component, one per screen - `Chip` and
 * `LocationPill` on the dashboard, `Tag` and an inline status badge on the
 * applications list. They agreed on nothing in particular: three drew a 999px
 * radius and the status badge drew 20px, and the paddings and type sizes were
 * four separate guesses. Same job, so: one component, and the differences that
 * are real become props.
 *
 * `tone` is the ground it sits on, not a severity scale - `on-dark` exists
 * because the dashboard's case card is navy, and `solid` because the loan
 * amount on that card is the one figure meant to be read first.
 *
 * Never a control. Every caller renders a fact; a pill that looks pressable
 * and does nothing is worse than a label, which is why there is no `onClick`
 * here and no hover state to imply one.
 */
export type PillTone = 'quiet' | 'good' | 'caution' | 'solid' | 'on-dark' | 'outline';

const SKIN: Record<PillTone, { bg: string; border: string; color: string }> = {
  quiet: { bg: 'var(--panel)', border: 'var(--line)', color: 'var(--muted)' },
  good: { bg: 'var(--green-tint)', border: 'var(--green-line)', color: '#0E6234' },
  caution: { bg: 'var(--amber-tint)', border: 'var(--amber-line)', color: 'var(--amber)' },
  solid: { bg: 'var(--saffron)', border: 'var(--saffron)', color: '#fff' },
  'on-dark': { bg: 'rgba(255,255,255,.12)', border: 'rgba(255,255,255,.2)', color: '#fff' },
  outline: { bg: 'var(--card)', border: 'var(--line)', color: 'var(--text)' },
};

export function Pill({
  children,
  tone = 'quiet',
  size = 'sm',
  icon,
}: {
  children: React.ReactNode;
  tone?: PillTone;
  /** `md` is the page-title scale, for the location beside a heading; `sm` is
   *  everything sitting inside a card. */
  size?: 'sm' | 'md';
  /** A leading glyph, already sized and coloured by the caller. */
  icon?: React.ReactNode;
}) {
  const skin = SKIN[tone];
  const md = size === 'md';
  return (
    <span
      data-testid="pill"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: icon ? '8px' : undefined,
        flex: 'none',
        borderRadius: '999px',
        padding: md ? '8px 14px' : '4px 11px',
        fontSize: md ? '13.5px' : '12.5px',
        fontWeight: tone === 'solid' || md ? 700 : 600,
        background: skin.bg,
        border: `1px solid ${skin.border}`,
        color: skin.color,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- verdict -- */

/**
 * One colour for one meaning, across every desktop page.
 *
 * The three places a verdict is shown had drifted into three answers. The
 * result screen painted `good` green and `check` amber. The dashboard painted
 * `good` in `--saffron-soft` and `check` in a hard-coded `#E6B94F` - two
 * oranges, so "Good opportunity" was a warning colour on one page and a
 * success colour on the next. The applications list painted both verdicts in
 * the same quiet grey, encoding nothing at all.
 *
 * Green means good and amber means worth-checking, everywhere. `onDark` is the
 * same pair lightened for the dashboard's navy card - the same two meanings,
 * legible on a dark ground, not a different mapping.
 */
export type Verdict = 'good' | 'check';

export const verdictTone = (v: Verdict): PillTone => (v === 'good' ? 'good' : 'caution');

export const verdictColor = (v: Verdict, onDark = false): string =>
  v === 'good'
    ? onDark
      ? 'var(--green-line)'
      : 'var(--green)'
    : onDark
      ? 'var(--amber-line)'
      : 'var(--amber)';
