'use client';

import React from 'react';

export function Primary({
  onClick,
  disabled,
  children,
  arrow,
  style,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  arrow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={disabled ? undefined : 'cta'}
      style={{
        width: '100%',
        background: disabled ? 'var(--line)' : 'var(--saffron)',
        color: disabled ? 'var(--faint)' : '#fff',
        border: 0,
        borderRadius: '12px',
        padding: '13px',
        fontSize: '16px',
        fontWeight: 700,
        fontFamily: 'var(--sans)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: '48px',
        boxShadow: disabled ? 'none' : 'var(--e2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style,
      }}
    >
      {children}
      {arrow && !disabled ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      ) : null}
    </button>
  );
}