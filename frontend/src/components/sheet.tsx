'use client';

import React, { useEffect, useRef } from 'react';
import { T } from './bilingual';

/**
 * Bottom-sheet modal for a single-field edit. Deliberately not a route: it is an
 * overlay on the screen that owns it, so it can never be deep-linked and can
 * never be mistaken for a step in a flow.
 */
export function Sheet({
  open,
  onClose,
  title,
  sub,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('input,select')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        background: 'rgba(10, 37, 69, .44)',
      }}
      className="sheet-scrim"
    >
      <div
        ref={panel}
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#fff',
          borderRadius: '18px 18px 0 0',
          boxShadow: 'var(--e3)',
          padding: '10px 18px calc(20px + env(safe-area-inset-bottom))',
          fontFamily: 'var(--sans)',
          color: 'var(--text)',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '4px',
            borderRadius: '2px',
            background: 'var(--line)',
            margin: '0 auto 14px',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{title}</div>
            {sub ? (
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '3px' }}>{sub}</div>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 0,
              padding: '4px',
              margin: '-4px',
              cursor: 'pointer',
              color: 'var(--faint)',
              flex: 'none',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** The muted partner to a Primary button inside a sheet. */
export function Secondary({ onClick, children }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: '#fff',
        color: 'var(--muted)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '13px',
        fontSize: '15px',
        fontWeight: 600,
        fontFamily: 'var(--sans)',
        cursor: 'pointer',
        minHeight: '48px',
      }}
    >
      {children ?? <T hi="रहने दीजिए" en="Cancel" />}
    </button>
  );
}
