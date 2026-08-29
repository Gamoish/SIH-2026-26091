'use client';

import React from 'react';

export function Row({
  onClick,
  icon,
  iconBg,
  title,
  sub,
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  iconBg?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', background: '#fff', border: '1px solid var(--line)', borderRadius: '14px', padding: '12px 14px', boxShadow: 'var(--e1)', display: 'flex', alignItems: 'center', gap: '11px', cursor: onClick ? 'pointer' : 'default', fontFamily: 'var(--sans)', color: 'var(--text)', minHeight: '52px' }}
    >
      <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: iconBg ?? 'var(--panel)', display: 'grid', placeItems: 'center', flex: 'none' }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600 }}>{title}</div>
        {sub ? <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{sub}</div> : null}
      </div>
      {onClick ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4" style={{ flex: 'none' }}><path d="M9 6l6 6-6 6" /></svg>
      ) : null}
    </button>
  );
}