'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home05Icon, File02Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { T, AvatarPicker } from '@/components';
import { useSession } from '@/hooks/use-session';
import { ONBOARDING, previousStep, useNav, type Slug } from '@/lib/nav';

/**
 * The three chromes the canvas actually uses. They are not interchangeable:
 *
 *   SplitShell    D-P1a..D-P1c  navy 46% branding panel beside the question
 *   TopBarShell   D-P1d..D-P1f, D-P10  navy bar, optional fixed side panel
 *   DesktopShell  D-P2..D-P11   264px rail beside a scrolling body
 *
 * Branding uses the same Udyam Sathi logo everywhere, with the size adjusted
 * according to the available space.
 */

/* ---------------------------------------------------------------- pieces -- */

function Tricolour() {
  return (
    <div
      aria-hidden
      className="dc-tricolour"
      style={{
        height: '6px',
        flex: 'none',
        background:
          'linear-gradient(90deg,var(--saffron-flag) 0%,#fff 50%,var(--green-flag) 100%)',
      }}
    />
  );
}

/**
 * Reusable Udyam Sathi logo.
 *
 * The SVG is used directly so it stays sharp at every size.
 * Different shells pass different widths depending on available space.
 */
function UdyamLogo({ width = 180 }: { width?: number }) {
  return (
    <img
      src="/logo1.png"
      alt="Udyam Sathi"
      style={{
        width: `${width}px`,
        height: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}

/** Progress across `ONBOARDING`, shown in the navy bar. */
function Steps({ at }: { at?: Slug }) {
  const i = at ? ONBOARDING.indexOf(at) : -1;
  if (i < 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
      aria-hidden
    >
      {ONBOARDING.map((slug, n) => (
        <span
          key={slug}
          className="step-dot"
          style={{
            width: n === i ? '26px' : '8px',
            height: '8px',
            borderRadius: '5px',
            background:
              n <= i ? '#fff' : 'rgba(255,255,255,.28)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * "Previous step" for the onboarding chromes.
 *
 * Deliberately a step move, not `router.back()`. History-back replays whatever
 * the user did last - a redirect, a reload, an edit sheet - so it is not a
 * reliable way back through a form. This always lands on the step before this
 * one, or renders nothing when there is no step to offer.
 */
function BackStep({ step }: { step?: Slug }) {
  const { s } = useSession();
  const nav = useNav();
  const prev = step ? previousStep(step, s) : null;

  if (!prev) return null;

  return (
    <button
      onClick={() => nav.go(prev)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        alignSelf: 'flex-start',
        background: 'transparent',
        border: '1px solid var(--line)',
        borderRadius: '10px',
        padding: '9px 15px 9px 11px',
        fontFamily: 'var(--sans)',
        fontSize: '13.5px',
        fontWeight: 600,
        color: 'var(--muted)',
        cursor: 'pointer',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>

      <T hi="पिछला क़दम" en="Previous step" />
    </button>
  );
}

/* ------------------------------------------------------- onboarding chrome -- */

/**
 * D-P1a - D-P1c.
 *
 * A navy branding panel at 46% of the width, vertically centred,
 * beside the one question.
 *
 * `logoWidth` allows individual onboarding screens to choose their
 * appropriate logo size.
 */
export function SplitShell({
  tagline,
  width = 440,
  step,
  logoWidth = 275,
  children,
}: {
  tagline?: React.ReactNode;

  /** Enables the "Previous step" control. */
  step?: Slug;

  /** The content column: 520px on the language picker, 440px on forms. */
  width?: number;

  /** Width of the Udyam Sathi logo in the branding panel. */
  logoWidth?: number;

  children: React.ReactNode;
}) {
  return (
    <div
      className="dc-onb"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: '#fff',
      }}
    >
      <Tricolour />

      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
      >
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
          <UdyamLogo width={logoWidth} />

          <div
            style={{
              fontSize: '17.5px',
              color: '#C7D8EC',
              maxWidth: '400px',
              lineHeight: 1.85,
            }}
          >
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
            <BackStep step={step} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * D-P1d - D-P1f and D-P10.
 *
 * A navy bar across the top, then the body.
 * `aside` is the fixed panel two of these screens carry beside the question.
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

  /** 560px on question screens; unset lets a grid use full width. */
  contentWidth?: number;

  children: React.ReactNode;
}) {
  return (
    <div
      className="dc-onb"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: '#fff',
      }}
    >
      <Tricolour />

      <div
        className="dc-flag dc-onb-top"
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
        {/* Udyam Sathi branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Logo symbol */}
          <img
            src="/udyam-logo.png"
            alt="Udyam Sathi logo"
            style={{
              width: '70px',
              height: '70px',
              objectFit: 'contain',
              display: 'block',
            }}
          />

          {/* Wordmark + tagline */}
          <img
            src="/udyam-wordmark.png"
            alt="Udyam Sathi"
            style={{
              width: '190px',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        <span style={{ flex: 1 }} />

        <Steps at={step} />
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
        }}
      >
        <main
          className="dc-monument reveal"
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--bg)',
            backgroundImage: 'var(--ledger)',
            padding,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            borderRight: aside
              ? '1px solid var(--line-soft)'
              : undefined,
          }}
        >
          <div
            style={{
              width: contentWidth ? `${contentWidth}px` : '100%',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            <BackStep step={step} />
            {children}
          </div>
        </main>

        {aside ? (
          <aside
            style={{
              width: `${asideWidth}px`,
              flex: 'none',
              background: asideBackground,
              color:
                asideBackground === 'var(--navy-800)'
                  ? '#fff'
                  : 'var(--text)',
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

/**
 * Hugeicons (free pack, MIT) - the same three the phone dock uses, so one
 * destination carries one mark whichever layout the visitor is in.
 */
const NAV: {
  slug: Slug;
  hi: string;
  en: string;
  icon: typeof Home05Icon;
}[] = [
    {
      slug: 'home',
      hi: 'होम',
      en: 'Home',
      icon: Home05Icon,
    },
    {
      slug: 'saved',
      hi: 'आपके आवेदन',
      en: 'Applications',
      icon: File02Icon,
    },
    {
      slug: 'settings',
      hi: 'सेटिंग्स',
      en: 'Settings',
      icon: Settings02Icon,
    },
  ];

/**
 * D-P2 - D-P11.
 *
 * A 264px navy rail beside the body.
 * `aside` is the second fixed panel four of these screens carry.
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
        {/* Account / signed-in user */}
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

                <div
                  style={{
                    fontSize: '11px',
                    color: '#B9CBE0',
                  }}
                >
                  {s.phone ? (
                    `+91 ${s.phone}`
                  ) : (
                    <T hi="नमस्ते" en="Hello" />
                  )}
                </div>
              </div>
            }
          />
        </div>

        <nav
          style={{
            padding: '16px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
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
                  background: on
                    ? 'var(--saffron)'
                    : 'transparent',
                  color: on ? '#fff' : '#B9CBE0',
                  fontWeight: on ? 700 : 500,
                }}
              >
                <HugeiconsIcon
                  icon={n.icon}
                  size={18}
                  strokeWidth={on ? 2.1 : 1.9}
                />

                <T hi={n.hi} en={n.en} />
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Udyam Sathi brand at the bottom of the desktop rail */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '0 22px',
            padding: '14px 0 8px',
            borderTop: '1px solid rgba(255,255,255,.12)',
            gap: '10px',
          }}
        >
          {/* Logo symbol */}
          <img
            src="/udyam-logo.png"
            alt="Udyam Sathi logo"
            style={{
              width: '44px',
              height: '44px',
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
            }}
          />

          {/* Wordmark + tagline */}
          <img
            src="/udyam-wordmark.png"
            alt="Udyam Sathi"
            style={{
              width: '145px',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              flexShrink: 1,
            }}
          />
        </div>
      </aside>

      <div className="dc-desk-main">
        <Tricolour />

        <div
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            className="dc-desk-body dc-monument reveal"
            style={{
              flex: 1,
              minWidth: 0,
              background,
              backgroundImage: 'var(--ledger)',
              padding,
              ...(gap != null
                ? {
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: `${gap}px`,
                  }
                : null),
            }}
          >
            {title ? (
              <div
                className="dc-desk-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '22px',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    minWidth: 0,
                  }}
                >
                  {title}
                </div>

                <span style={{ flex: 1 }} />

                {actions}
              </div>
            ) : null}

            {children}
          </div>

          {aside ? (
            <aside
              className="dc-desk-aside"
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

export function Legend({
  children,
}: {
  children: React.ReactNode;
}) {
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
export function Ask({
  hi,
  en,
  note,
}: {
  hi: string;
  en: string;
  note?: React.ReactNode;
}) {
  return (
    <div>
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        <T hi={hi} en={en} />
      </h1>

      {note ? (
        <p
          style={{
            fontSize: '15px',
            color: 'var(--muted)',
            margin: '8px 0 0',
            lineHeight: 1.6,
          }}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
}