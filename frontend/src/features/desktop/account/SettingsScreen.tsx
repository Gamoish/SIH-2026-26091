'use client';

import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { CATEGORIES } from '@/lib/categories';
import { tokenStore } from '@/lib/api';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Globe02Icon,
  SmartPhone01Icon,
  UserCircleIcon,
  File02Icon,
  HelpCircleIcon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';
import { AvatarPicker, T, useT } from '@/components';
import { rememberLayout } from '@/lib/layout';
import { DesktopShell } from '../shell';

/**
 * D-P8. One flex column of rows on the `--panel` ground - not cards in
 * columns.
 *
 * The profile row heads it: the photo is updatable here (the file dialog is
 * one click away on a desktop, so the avatar itself is the control), with the
 * name and number beside it. Changing the *name* and the category still goes
 * through the phone's dedicated edit screens - there is no desktop artboard
 * for those, and duplicating those flows would be two places to keep correct.
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
      {/* the account itself, at the head of the list */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          boxShadow: 'var(--e1)',
        }}
      >
        <AvatarPicker size={64} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '19px', fontWeight: 700 }}>{s.name || '—'}</div>
          <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '2px' }}>
            {s.phone ? `+91 ${s.phone}` : '—'}
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <a
          href="/screens/settings"
          onClick={() => rememberLayout('phone')}
          style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--navy)' }}
        >
          <T hi="नाम बदलिए" en="Change name" />
        </a>
      </div>

      <Row icon={Globe02Icon} label={<T hi="भाषा" en="Language" />}>
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

      <Row icon={SmartPhone01Icon} label={<T hi="फ़ोन नंबर" en="Phone number" />}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>{s.phone ? `+91 ${s.phone}` : '—'}</span>
      </Row>

      <Row icon={UserCircleIcon} label={<T hi="आपका वर्ग" en="Your category" />}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>
          {category ? t(category.hi, category.en) : '—'}
        </span>
      </Row>

      <Row
        icon={File02Icon}
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

      <Row icon={HelpCircleIcon} label={<T hi="मदद व सहायता" en="Help & support" />}>
        <a
          href="/screens/settings"
          onClick={() => rememberLayout('phone')}
          style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}
        >
          <T hi="फ़ोन पर खोलिए" en="Open on phone" />
        </a>
      </Row>

      <Row danger icon={Logout01Icon} label={<T hi="लॉग आउट" en="Log out" />}>
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
  icon: typeof Globe02Icon;
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
      <HugeiconsIcon
        icon={icon}
        size={20}
        color={danger ? 'var(--rust)' : 'var(--navy)'}
        strokeWidth={2}
        style={{ flex: 'none' }}
      />
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
