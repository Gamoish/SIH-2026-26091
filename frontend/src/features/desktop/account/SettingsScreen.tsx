'use client';

import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { CATEGORIES } from '@/lib/categories';
import { tokenStore } from '@/lib/api';
import { T, useT } from '@/components';
import { rememberLayout } from '@/lib/layout';
import { DesktopShell } from '../shell';

/**
 * D-P8. One flex column of rows on the `--panel` ground - not cards in
 * columns.
 *
 * Editing name, photo and category still goes through the phone's dedicated
 * edit screens: there is no desktop artboard for those, and duplicating the
 * edit flows would be two places to keep correct instead of one.
 */
export default function SettingsScreen() {
  const { s, set, reset } = useSession();
  const nav = useNav();
  const t = useT();
  const [confirming, setConfirming] = useState(false);

  const category = CATEGORIES.find((c) => c.id === s.social);

  const logout = () => {
    tokenStore.clear();
    reset();
    nav.replace('language');
  };

  return (
    <DesktopShell
      padding="40px 60px"
      background="var(--panel)"
      gap={20}
      title={<T hi="सेटिंग्स" en="Settings" />}
    >
      <Row
        icon={
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
          </>
        }
        label={<T hi="भाषा" en="Language" />}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['hi', 'en'] as const).map((code) => {
            const on = s.lang === code;
            return (
              <button
                key={code}
                onClick={() => set({ lang: code })}
                style={{
                  minWidth: '92px',
                  minHeight: '40px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  fontSize: '14px',
                  fontWeight: 700,
                  background: on ? 'var(--navy)' : '#fff',
                  color: on ? '#fff' : 'var(--text)',
                  border: on ? '2px solid var(--navy)' : '1px solid var(--line)',
                }}
              >
                {code === 'hi' ? 'हिंदी' : 'English'}
              </button>
            );
          })}
        </div>
      </Row>

      <Row
        icon={
          <>
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path d="M11 18h2" />
          </>
        }
        label={<T hi="फ़ोन नंबर" en="Phone number" />}
      >
        <span style={{ fontSize: '15px', fontWeight: 600 }}>{s.phone ? `+91 ${s.phone}` : '—'}</span>
      </Row>

      <Row
        icon={
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </>
        }
        label={<T hi="आपका वर्ग" en="Your category" />}
      >
        <span style={{ fontSize: '15px', fontWeight: 600 }}>
          {category ? t(category.hi, category.en) : '—'}
        </span>
      </Row>

      <Row
        icon={
          <>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
          </>
        }
        label={<T hi="सहेजे आवेदन" en="Saved applications" />}
        onClick={() => nav.go('saved')}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--navy)',
            background: 'var(--navy-tint)',
            borderRadius: '20px',
            padding: '3px 11px',
          }}
        >
          {s.savedAt ? 1 : 0}
        </span>
      </Row>

      <Row
        icon={
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3 2.5v1.5M12 17h.01" />
          </>
        }
        label={<T hi="मदद व सहायता" en="Help & support" />}
      >
        <a
          href="/screens/settings"
          onClick={() => rememberLayout('phone')}
          style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}
        >
          <T hi="फ़ोन पर खोलिए" en="Open on phone" />
        </a>
      </Row>

      <Row
        danger
        icon={
          <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5M21 12H9" />
          </>
        }
        label={<T hi="लॉग आउट" en="Log out" />}
      >
        {confirming ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={logout} style={BTN.danger}>
              <T hi="हाँ, लॉग आउट" en="Yes, log out" />
            </button>
            <button onClick={() => setConfirming(false)} style={BTN.quiet}>
              <T hi="रहने दीजिए" en="Cancel" />
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} style={{ ...BTN.quiet, color: 'var(--rust)' }}>
            <T hi="लॉग आउट करें" en="Log out" />
          </button>
        )}
      </Row>
    </DesktopShell>
  );
}

const BTN: Record<'danger' | 'quiet', React.CSSProperties> = {
  danger: {
    border: 0,
    background: 'var(--rust)',
    color: '#fff',
    borderRadius: '9px',
    padding: '9px 16px',
    fontSize: '13.5px',
    fontWeight: 700,
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
  },
  quiet: {
    border: '1px solid var(--line)',
    background: '#fff',
    color: 'var(--muted)',
    borderRadius: '9px',
    padding: '9px 16px',
    fontSize: '13.5px',
    fontWeight: 700,
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
  },
};

/** One settings row: icon, label, and whatever control the row carries. */
function Row({
  icon,
  label,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: `1px solid ${danger ? 'var(--rust-tint)' : 'var(--line)'}`,
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'var(--e1)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={danger ? 'var(--rust)' : 'var(--navy)'}
        strokeWidth="2.1"
        style={{ flex: 'none' }}
      >
        {icon}
      </svg>
      <span
        style={{
          flex: 1,
          fontSize: '15px',
          fontWeight: 600,
          color: danger ? 'var(--rust)' : 'var(--text)',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
