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
        /**
         * Off by default, and deliberately so.
         *
         * With no autoComplete and no name, the browser falls back to guessing
         * from the visible label. On the village step that label is "Village
         * name" / "गाँव का नाम", so Chrome saw "name" and autofilled the saved
         * profile name - the user then got a truthful "No village matched"
         * against their own name and no way to tell why.
         *
         * Defaulted here rather than patched per screen: every caller of this
         * component has the same hole. A caller that genuinely wants autofill
         * (a real name or phone field) can pass its own autoComplete, since the
         * spread below still wins.
         */
        autoComplete="off"
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
