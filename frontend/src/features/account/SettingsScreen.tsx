'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { CATEGORIES } from '@/lib/categories';
import { tokenStore } from '@/lib/api';
import { DESKTOP_QUERY, rememberLayout } from '@/lib/layout';
import { HugeiconsIcon } from '@hugeicons/react';
import { Globe02Icon, File02Icon, ComputerIcon, Logout01Icon } from '@hugeicons/core-free-icons';
import { Avatar, Dock, Header, T, useT } from '@/components';
import NameSheet from './edit/NameSheet';
import PhoneSheet from './edit/PhoneSheet';

export default function SettingsScreen() {
  const { s, set, reset } = useSession();
  const nav = useNav();
  const t = useT();
  const [sheet, setSheet] = useState<'name' | 'phone' | null>(null);
  const router = useRouter();

  const category = CATEGORIES.find((c) => c.id === s.social);

  // Desktop Settings links here for the edits it has no screen for, and that
  // link writes the phone preference so middleware stops bouncing the visitor
  // back. Nothing wrote it the other way, so that was a one-way door: a desktop
  // visitor ended up on the phone layout for good, with no control to return.
  // Shown only on a screen wide enough for the desktop layout to make sense, so
  // an actual phone never sees it.
  // Measured in the initialiser, not an effect. This screen only mounts on the
  // client - LayoutReconciler renders nothing on the server - so matchMedia is
  // available on the first render, and the control no longer pops in a frame late.
  const [wide] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);

  const backToDesktop = () => {
    // The cookie is written first: middleware reads it on the way through and
    // would otherwise bounce this navigation straight back to the phone tree.
    rememberLayout('desktop');
    router.push('/desktop/settings');
  };

  const logout = () => {
    if (
      !confirm(
        t(
          'लॉग आउट करें? आपकी जाँच इस फ़ोन से हट जाएगी।',
          'Log out? Your check will be removed from this phone.',
        ),
      )
    )
      return;
    tokenStore.clear();
    reset();
    nav.replace('language');
  };

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('home')} title={<T hi="सेटिंग्स" en="Settings" />} />

      <div
        style={{ flex: 1, padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '9px' }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--faint)', padding: '2px 2px 1px' }}>
          <T hi="आपकी जानकारी" en="Your profile" />
        </div>

        <Line
          hi="फ़ोटो"
          en="Photo"
          onClick={() => nav.go('edit-photo')}
          right={<Avatar photo={s.photo} name={s.name} size={30} />}
        />
        <Line hi="नाम" en="Name" value={s.name || '—'} onClick={() => setSheet('name')} />
        <Line
          hi="फ़ोन नंबर"
          en="Phone number"
          value={s.phone ? `+91 ${s.phone}` : '—'}
          onClick={() => setSheet('phone')}
        />
        <Line
          hi="आपका वर्ग"
          en="Your category"
          value={category ? t(category.hi, category.en) : '—'}
          onClick={() => nav.go('edit-category')}
        />

        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--faint)', padding: '8px 2px 1px' }}>
          <T hi="ऐप" en="App" />
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: 'var(--e1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HugeiconsIcon icon={Globe02Icon} size={19} color="var(--navy)" strokeWidth={2.2} />
            <div style={{ flex: 1, fontSize: '13.5px', fontWeight: 600 }}>
              <T hi="भाषा" en="Language" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {(['hi', 'en'] as const).map((code) => {
              const on = s.lang === code;
              return (
                <button
                  key={code}
                  onClick={() => set({ lang: code })}
                  style={{
                    flex: 1,
                    minHeight: '42px',
                    borderRadius: '10px',
                    cursor: 'pointer',
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
        </div>

        <button
          onClick={() => nav.go('saved')}
          style={{
            width: '100%',
            textAlign: 'left',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '13px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--e1)',
            cursor: 'pointer',
            minHeight: '50px',
          }}
        >
          <HugeiconsIcon icon={File02Icon} size={19} color="var(--navy)" strokeWidth={2.2} />
          <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600 }}>
            <T hi="सहेजे आवेदन" en="Saved applications" />
          </span>
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 700,
              color: 'var(--navy)',
              background: 'var(--navy-tint)',
              borderRadius: '20px',
              padding: '2px 8px',
            }}
          >
            {s.savedAt ? 1 : 0}
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        {wide ? (
          <button
            onClick={backToDesktop}
            style={{
              width: '100%',
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '13px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--e1)',
              cursor: 'pointer',
              minHeight: '50px',
            }}
          >
            <HugeiconsIcon icon={ComputerIcon} size={19} color="var(--navy)" strokeWidth={2.2} />
            <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, textAlign: 'left' }}>
              <T hi="बड़ी स्क्रीन पर लौटिए" en="Back to the desktop view" />
            </span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--faint)"
              strokeWidth="2.4"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : null}

        <button
          onClick={logout}
          style={{
            marginTop: 'auto',
            width: '100%',
            background: '#fff',
            border: '1px solid var(--rust-tint)',
            borderRadius: '12px',
            padding: '13px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--e1)',
            cursor: 'pointer',
            minHeight: '50px',
          }}
        >
          <HugeiconsIcon icon={Logout01Icon} size={19} color="var(--rust)" strokeWidth={2.2} />
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--rust)' }}>
            <T hi="लॉग आउट" en="Log out" />
          </span>
        </button>

        <NameSheet open={sheet === 'name'} onClose={() => setSheet(null)} />
        <PhoneSheet open={sheet === 'phone'} onClose={() => setSheet(null)} />
      </div>

      <Dock active="settings" />
    </div>
  );
}

function Line({
  hi,
  en,
  value,
  right,
  onClick,
}: {
  hi: string;
  en: string;
  value?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '13px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--e1)',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: '50px',
        fontFamily: 'var(--sans)',
        color: 'var(--text)',
      }}
    >
      <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600 }}>
        <T hi={hi} en={en} />
      </span>
      {right ?? <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{value}</span>}
      {onClick ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.4">
          <path d="M9 6l6 6-6 6" />
        </svg>
      ) : null}
    </Tag>
  );
}
