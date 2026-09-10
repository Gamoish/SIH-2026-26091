import React from 'react';

/**
 * The feasibility score, out of 100.
 *
 * `ring` is the standalone form that heads the verdict screen: a radial arc
 * showing where the score sits on the 0-100 scale, drawn in from empty on
 * load. Without it the same number stacks bare, for sitting inside a card that
 * already has its own navy ground. The score itself always comes from
 * `buildReport()` - this component only sizes it.
 *
 * The arc replaces a flat filled disc, which showed the number twice (once as
 * digits, once as a circle that was the same circle at 3 and at 97) and so
 * carried no scale at all.
 *
 * `onDark` is the same arc on a navy ground - the dashboard's active-check
 * card. Only the two colours that assume a light page move: the unfilled part
 * of the scale and the digits. Deliberately a tone on this component rather
 * than a second gauge, so the dashboard and the verdict screen can never
 * animate to different positions for one score. `AvatarPicker` carries an
 * `onDark` for the same reason.
 */
export function ScoreDial({
  score,
  size = 220,
  ring = true,
  onDark = false,
}: {
  score: number;
  size?: number;
  ring?: boolean;
  onDark?: boolean;
}) {
  const num = Math.round(size * 0.355);
  const body = (
    <>
      {/* the digits are drawn by `.tally`'s counter so they can count up; the
          accessible name below carries the real figure, which never animates */}
      <div
        className="tally"
        style={
          {
            fontSize: `${num}px`,
            fontWeight: 700,
            lineHeight: ring ? 1 : 0.85,
            '--tally-to': score,
          } as React.CSSProperties
        }
      />
      {/* `ring` on a light page takes the page's muted colour; on a navy card -
          bare, or `onDark` - it keeps the on-navy blue it had. */}
      <div
        style={{
          fontSize: `${Math.max(11, Math.round(size * 0.064))}px`,
          color: ring && !onDark ? 'var(--muted)' : '#B9CCE5',
          fontWeight: 600,
        }}
      >
        {ring ? '/ 100' : '/100'}
      </div>
    </>
  );

  if (!ring)
    return (
      <div role="img" aria-label={`${score} / 100`} style={{ textAlign: 'center', color: '#fff' }}>
        {body}
      </div>
    );

  // Geometry for the arc. The stroke is centred on the path, so the radius is
  // inset by half of it to keep the ring inside the box at every size.
  const stroke = Math.max(6, Math.round(size / 13));
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  // Clamped rather than trusted: a score outside 0-100 would otherwise draw an
  // arc past the full circle and read as a better result than it is.
  const pct = Math.min(100, Math.max(0, score)) / 100;

  return (
    <div
      role="img"
      aria-label={`${score} / 100`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        color: onDark ? '#fff' : 'var(--navy-dark)',
      }}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
      >
        {/* the unfilled remainder of the scale, so the arc is read as a
            position on 0-100 rather than as a bar of its own */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={onDark ? 'rgba(255,255,255,.18)' : 'var(--navy-tint2)'}
          strokeWidth={stroke}
        />
        <circle
          className="arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--saffron)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - pct)}
          style={{ '--arc-len': len } as React.CSSProperties}
        />
      </svg>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1,
        }}
      >
        {body}
      </div>
    </div>
  );
}
