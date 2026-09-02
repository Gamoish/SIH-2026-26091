import React from 'react';

/**
 * The feasibility score, out of 100.
 *
 * `ring` is the standalone form that heads the verdict screen; without it the
 * same number stacks bare, for sitting inside a card that already has its own
 * navy ground. The score itself always comes from `buildReport()` - this
 * component only sizes it.
 */
export function ScoreDial({
  score,
  size = 220,
  ring = true,
}: {
  score: number;
  size?: number;
  ring?: boolean;
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
      <div style={{ fontSize: `${Math.max(11, Math.round(size * 0.064))}px`, color: '#B9CCE5' }}>
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

  return (
    <div
      role="img"
      aria-label={`${score} / 100`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: 'var(--navy)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        boxShadow: `0 0 0 ${Math.round(size / 22)}px var(--navy-tint2)`,
      }}
    >
      {body}
    </div>
  );
}
