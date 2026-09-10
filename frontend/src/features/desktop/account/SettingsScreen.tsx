'use client';

import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { CATEGORIES } from '@/lib/categories';
import { tokenStore } from '@/lib/api';
import { Action, AvatarPicker, Icon, T, useT, type IconName } from '@/components';
import { rememberLayout } from '@/lib/layout';
import { DesktopShell, ScreenHead } from '../shell';

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
    <DesktopShell padding="40px 60px" background="var(--panel)" gap={20}>
      {/* The head the dashboard and the verdict screen already use, rather than
          `DesktopShell`'s plain `title` - one page title, one component.

          No "Need help?" link beside it: there is no help destination in this
          app to point one at. The Applications screen carries none to reuse,
          and the Help row below opens the phone layout, which is not help. */}
      <ScreenHead
        title={<T hi="सेटिंग्स" en="Settings" />}
        sub={<T hi="आपका नाम, नंबर, भाषा और वर्ग" en="Your name, number, language and category" />}
      />

      {/* the account itself, at the head of the list */}
      <div
        className="dc-desk-card"
        style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '18px' }}
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

      <Row icon="language" label={<T hi="भाषा" en="Language" />}>
        <LangToggle value={s.lang} onChange={(lang) => set({ lang })} />
      </Row>

      <Row icon="phone" label={<T hi="फ़ोन नंबर" en="Phone number" />}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>{s.phone ? `+91 ${s.phone}` : '—'}</span>
      </Row>

      <Row icon="account" label={<T hi="आपका वर्ग" en="Your category" />}>
        <span style={{ fontSize: '15px', fontWeight: 600 }}>
          {category ? t(category.hi, category.en) : '—'}
        </span>
      </Row>

      {/* No count on this row. There is no saved-draft state to count: the
          status enum is `draft | complete`, `saveCase` files every row as
          `complete`, and nothing in either layout ever writes a draft. The
          badge this replaces read `s.savedAt ? 1 : 0` - a local boolean about
          this browser, not the number of applications the server holds. The row
          is the way through to that real list rather than a second, wrong copy
          of its length. */}
      <Row
        icon="filed"
        label={<T hi="सहेजे आवेदन" en="Saved applications" />}
        onClick={() => nav.go('saved')}
      >
        <span aria-hidden style={{ color: 'var(--faint)', display: 'grid' }}>
          <Icon name="next" size={18} />
        </span>
      </Row>

      <Row icon="help" label={<T hi="मदद व सहायता" en="Help & support" />}>
        <a
          href="/screens/settings"
          onClick={() => rememberLayout('phone')}
          style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}
        >
          <T hi="फ़ोन पर खोलिए" en="Open on phone" />
        </a>
      </Row>

      {/* Log out is set apart, not only coloured: it is the one row that ends
          the session, so a rule separates it from the rows above rather than
          leaving it as the next card in one unbroken run. */}
      <div aria-hidden style={{ height: '1px', background: 'var(--line)', margin: '12px 0 2px' }} />

      <Row danger icon="logout" label={<T hi="लॉग आउट" en="Log out" />}>
        {confirming ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Action tone="danger" onClick={logout}>
              <T hi="हाँ, लॉग आउट" en="Yes, log out" />
            </Action>
            <Action onClick={() => setConfirming(false)}>
              <T hi="रहने दीजिए" en="Cancel" />
            </Action>
          </div>
        ) : (
          <Action onClick={() => setConfirming(true)} icon={<Icon name="logout" size={16} />}>
            <T hi="लॉग आउट करें" en="Log out" />
          </Action>
        )}
      </Row>
    </DesktopShell>
  );
}

/**
 * The language switch: a segmented control whose thumb slides between the two
 * options.
 *
 * This is the one moment on this page that moves, and it moves because the
 * reader just pressed it - the motion is the answer to their own action, not
 * an entrance. Before, both options were separate buttons that swapped fill
 * colours instantly, so the change registered as a repaint rather than as a
 * switch being thrown.
 *
 * Still two real <button>s rather than a div with a role, so the keyboard, the
 * focus ring and the accessible name are the browser's. `aria-pressed` carries
 * the state; a screen reader hears which one is on without needing the thumb.
 * The slide is `transform` on a separate layer, so it costs no layout, and the
 * global reduced-motion block clamps it to its end state like everything else.
 */
function LangToggle({ value, onChange }: { value: 'hi' | 'en'; onChange: (v: 'hi' | 'en') => void }) {
  const at = value === 'hi' ? 0 : 1;
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3px',
        padding: '3px',
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: '11px',
      }}
    >
      <span
        aria-hidden
        className="seg-thumb"
        style={{
          position: 'absolute',
          top: '3px',
          bottom: '3px',
          left: '3px',
          width: 'calc(50% - 4.5px)',
          borderRadius: '8px',
          background: 'var(--navy)',
          transform: at === 0 ? 'translateX(0)' : 'translateX(calc(100% + 3px))',
        }}
      />
      {(['hi', 'en'] as const).map((code) => {
        const on = value === code;
        return (
          <button
            key={code}
            onClick={() => onChange(code)}
            aria-pressed={on}
            style={{
              position: 'relative',
              minWidth: '92px',
              minHeight: '38px',
              borderRadius: '8px',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--sans)',
              fontSize: '14px',
              fontWeight: 700,
              color: on ? '#fff' : 'var(--text)',
              transition: 'color var(--dur-3) var(--ease-out)',
            }}
          >
            {code === 'hi' ? 'हिंदी' : 'English'}
          </button>
        );
      })}
    </div>
  );
}

/** One settings row: icon, label, and whatever control the row carries. */
function Row({
  icon,
  label,
  children,
  onClick,
  danger,
}: {
  icon: IconName;
  label: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className="dc-desk-card"
      style={{
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        ...(danger ? { border: '1px solid var(--rust-tint)' } : null),
      }}
    >
      {/* A tinted circle per row - the settings-list convention, and what makes
          six different marks read as one column rather than six loose glyphs.
          Decorative: the label beside it is the row's accessible name, so the
          circle is hidden from the accessibility tree. */}
      <span
        aria-hidden
        style={{
          flex: 'none',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: danger ? 'var(--rust-tint)' : 'var(--navy-tint)',
        }}
      >
        <span style={{ color: danger ? 'var(--rust)' : 'var(--navy)', display: 'grid' }}>
          <Icon name={icon} size={20} />
        </span>
      </span>
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
