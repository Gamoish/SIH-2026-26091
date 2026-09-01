'use client';

import React from 'react';

/** The single large text input used by the edit sheets and the first-run steps. */
export function Field({
  label,
  error,
  ...input
}: { label: string; error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '6px' }}>{label}</div>
      <input
        aria-label={label}
        {...input}
        style={{
          width: '100%',
          border: `2px solid ${error ? 'var(--rust)' : 'var(--navy)'}`,
          borderRadius: '13px',
          padding: '14px 15px',
          fontSize: '18px',
          fontWeight: 600,
          fontFamily: 'var(--sans)',
          color: 'var(--text)',
          background: '#fff',
          boxShadow: `0 0 0 3px ${error ? 'var(--rust-tint)' : 'var(--navy-tint)'}`,
          outline: 'none',
          ...input.style,
        }}
      />
    </label>
  );
}
