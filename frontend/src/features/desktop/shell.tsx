'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { T, AvatarPicker } from '@/components';
import { useSession } from '@/hooks/use-session';
import { ONBOARDING, type Slug } from '@/lib/nav';

/**
 * The three chromes the canvas actually uses. They are not interchangeable:
 *
 *   SplitShell    D-P1a..D-P1c  navy 46% branding panel beside the question
 *   TopBarShell   D-P1d..D-P1f, D-P10  navy bar, optional fixed side panel
 *   DesktopShell  D-P2..D-P11   264px rail beside a scrolling body
 *
 * Every measurement here is read off the artboards (rail 264px, split 46%,
 * bar padding 20px 40px, item padding 10px 12px, active item saffron) rather
 * than approximated - an earlier pass defaulted all eight first-run screens to
 * one centred column and lost the layout entirely.
 */

/* ---------------------------------------------------------------- pieces -- */

function Tricolour() {
  return (
    <div
      aria-hidden
      style={{
        height: '4px',
        flex: 'none',
        background:
          'linear-gradient(90deg,var(--saffron-flag) 0 33.33%,#fff 33.33% 66.66%,var(--green-flag) 66.66% 100%)',
      }}
    />
  );
}

function Ashoka({ size = 30 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        flex: 'none',
        position: 'relative',
      }}
      aria-hidden
    >
      <div style={{ position: 'absolute', inset: '0 0 66.6% 0', background: 'var(--saffron-flag)' }} />
      <div style={{ position: 'absolute', inset: '33.3% 0 33.3% 0', background: '#fff' }} />
      <div style={{ position: 'absolute', inset: '66.6% 0 0 0', background: 'var(--green-flag)' }} />
      <svg width={size} height={size} viewBox="0 0 30 30" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx="15" cy="15" r="5" fill="none" stroke="#0B3D91" strokeWidth="1" />
        <circle cx="15" cy="15" r="1.1" fill="#0B3D91" />
        <g stroke="#0B3D91" strokeWidth="0.6">
          {[0, 30, 60, 90, 120, 150].map((d) => (
            <line key={d} x1="15" y1="10" x2="15" y2="20" transform={`rotate(${d} 15 15)`} />
          ))}
        </g>
      </svg>
    </div>
  );
}

/** The clock mark that heads the navy branding panel (84px tile, D-P1a). */
function Mark() {
  return (
    <div
      style={{
        width: '84px',
        height: '84px',
        borderRadius: '22px',
        background: 'rgba(255,255,255,.12)',
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
      }}
      aria-hidden
    >
      <svg
        width="42"
        height="42"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    </div>
  );
}

/** Progress across `ONBOARDING`, shown in the navy bar. */
function Steps({ at }: { at?: Slug }) {
  const i = at ? ONBOARDING.indexOf(at) : -1;
  if (i < 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} aria-hidden>
      {ONBOARDING.map((slug, n) => (
        <span
          key={slug}
          style={{
            width: n === i ? '26px' : '8px',
            height: '8px',
            borderRadius: '5px',
            background: n <= i ? '#fff' : 'rgba(255,255,255,.28)',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------- onboarding chrome -- */

/**
 * D-P1a - D-P1c. A navy branding panel at 46% of the width, vertically
 * centred, beside the one question. The panel is the identity of the service;
 * the right side is the only thing the user acts on.
 */
export function SplitShell({
  tagline,
  width = 440,
  children,
}: {
  tagline?: React.ReactNode;
  /** The content column: 520px on the language picker, 440px on the forms. */
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="dc-onb"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fff' }}
    >
      <Tricolour />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside
          style={{
            width: '46%',
            flex: 'none',
            background: 'var(--navy)',
            backgroundImage: 'var(--ledger-ink)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '22px',
            padding: '40px',
          }}
        >
          <Mark />
          <div style={{ fontSize: '30px', fontWeight: 700 }}>
            उद्यम साथी <span style={{ color: '#B9CCE5', fontWeight: 500 }}>· Udyam Sathi</span>
          </div>
          <div style={{ fontSize: '15px', color: '#B9CCE5', maxWidth: '360px', lineHeight: 1.65 }}>
            {tagline ?? (
              <T
                hi="एक सरकारी व्यवहार्यता और ऋण सलाहकार, जो आपकी भाषा में बात करता है"
                en="A government feasibility and loan adviser that speaks your language"
              />
            )}
          </div>
        </aside>

        <main
          className="dc-monument dc-flag"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
          }}
        >
          <div
            style={{
              width: `${width}px`,
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '30px',
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * D-P1d - D-P1f and D-P10. A navy bar across the top, then the body. `aside`
 * is the fixed panel two of these screens carry beside the question - the
 * running summary on location, the eligibility panel on capital.
 */
export function TopBarShell({
  step,
  aside,
  asideWidth = 520,
  asideBackground = 'var(--panel)',
  padding = '36px 44px',
  contentWidth,
  children,
}: {
  step?: Slug;
  aside?: React.ReactNode;
  asideWidth?: number;
  asideBackground?: string;
  padding?: string;
  /** 560px on the question screens; unset lets a grid use the full width. */
  contentWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="dc-onb"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#fff' }}
    >
      <Tricolour />
      <div
        className="dc-flag"
        style={{
          background: 'var(--navy)',
          color: '#fff',
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          flex: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <Ashoka />
          <div style={{ fontSize: '17px', fontWeight: 700 }}>
            उद्यम साथी{' '}
            <span style={{ color: '#B9CCE5', fontSize: '12px', fontWeight: 600 }}>Udyam Sathi</span>
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <Steps at={step} />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <main
          className="dc-monument"
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--bg)',
            backgroundImage: 'var(--ledger)',
            padding,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            borderRight: aside ? '1px solid var(--line-soft)' : undefined,
          }}
        >
          {/* the canvas keeps the question column readable rather than letting
              it run the full width of a 1440px screen */}
          <div
            style={{
              width: contentWidth ? `${contentWidth}px` : '100%',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {children}
          </div>
        </main>
        {aside ? (
          <aside
            style={{
              width: `${asideWidth}px`,
              flex: 'none',
              background: asideBackground,
              color: asideBackground === 'var(--navy-800)' ? '#fff' : 'var(--text)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {aside}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------------------------------- post-onboarding chrome -- */

const ICON = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
};

const NAV: { slug: Slug; hi: string; en: string; icon: React.ReactNode }[] = [
  { slug: 'home', hi: 'होम', en: 'Home', icon: ICON.home },
  { slug: 'saved', hi: 'आपके आवेदन', en: 'Applications', icon: ICON.file },
  { slug: 'settings', hi: 'सेटिंग्स', en: 'Settings', icon: ICON.gear },
];

/**
 * D-P2 - D-P11. A 264px navy rail beside the body. `aside` is the second fixed
 * panel four of these screens carry (the full report's summary, the competitor
 * map's detail column, the share sheet, and so on).
 */
export function DesktopShell({
  title,
  actions,
  aside,
  asideWidth = 380,
  asideBackground = 'var(--panel)',
  padding = '32px 40px',
  background = 'var(--bg)',
  gap,
  children,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  asideWidth?: number;
  asideBackground?: string;
  padding?: string;
  background?: string;
  /** Set to lay the body out as one flex column, as D-P8 does. */
  gap?: number;
  children: React.ReactNode;
}) {
  const { s } = useSession();
  const path = usePathname();

  return (
    <div className="dc-desk dc-flag">
      <aside className="dc-desk-side">
        {/* Who is signed in, at the head of the rail: on a desktop the account
            is the thing you act on, and the flag corner already marks the page
            as the service's. The wordmark keeps its place at the foot. */}
        <div style={{ padding: '0 22px 18px' }}>
          <AvatarPicker
            size={44}
            onDark
            label={
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.name || '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#B9CBE0' }}>
                  {s.phone ? `+91 ${s.phone}` : <T hi="नमस्ते" en="Hello" />}
                </div>
              </div>
            }
          />
        </div>

        <nav style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV.map((n) => {
            const on = path === `/desktop/${n.slug}`;
            return (
              <Link
                key={n.slug}
                href={`/desktop/${n.slug}`}
                aria-current={on ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '11px',
                  padding: '10px 12px',
                  borderRadius: '9px',
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  background: on ? 'var(--saffron)' : 'transparent',
                  color: on ? '#fff' : '#B9CBE0',
                  fontWeight: on ? 700 : 500,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                >
                  {n.icon}
                </svg>
                <T hi={n.hi} en={n.en} />
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '0 22px',
            padding: '14px 0 2px',
            borderTop: '1px solid rgba(255,255,255,.12)',
          }}
        >
          <Ashoka size={24} />
          <div style={{ fontSize: '13px', fontWeight: 700 }}>
            उद्यम साथी{' '}
            <span style={{ fontSize: '10px', color: '#B9CBE0', fontWeight: 500 }}>Udyam Sathi</span>
          </div>
        </div>
      </aside>

      <div className="dc-desk-main">
        <Tricolour />
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div
            className="dc-desk-body dc-monument"
            style={{
              flex: 1,
              minWidth: 0,
              background,
              backgroundImage: 'var(--ledger)',
              padding,
              ...(gap != null
                ? { display: 'flex', flexDirection: 'column' as const, gap: `${gap}px` }
                : null),
            }}
          >
            {title ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, minWidth: 0 }}>{title}</div>
                <span style={{ flex: 1 }} />
                {actions}
              </div>
            ) : null}
            {children}
          </div>
          {aside ? (
            <aside
              style={{
                width: `${asideWidth}px`,
                flex: 'none',
                background: asideBackground,
                padding: '28px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: '1px solid var(--line)',
              }}
            >
              {aside}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- shared -- */

export function Legend({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--navy-dark)',
        borderBottom: '1px solid var(--line)',
        paddingBottom: '8px',
        marginBottom: '14px',
      }}
    >
      {children}
    </div>
  );
}

/** The question a first-run screen asks. */
export function Ask({ hi, en, note }: { hi: string; en: string; note?: React.ReactNode }) {
  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
        <T hi={hi} en={en} />
      </h1>
      {note ? (
        <p style={{ fontSize: '15px', color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.6 }}>{note}</p>
      ) : null}
    </div>
  );
}
