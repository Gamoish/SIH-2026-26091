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
      className="dc-tricolour"
      style={{
        height: '6px',
        flex: 'none',
        background: 'linear-gradient(90deg,var(--saffron-flag) 0%,#fff 50%,var(--green-flag) 100%)',
      }}
    />
  );
}

/** The full vertical lockup that heads the navy branding panel (D-P1a). */
function Mark() {
  return (
    <img
      src="/logo1.png"
      alt="उद्यम साथी · Udyam Sathi"
      style={{ width: 'min(300px, 70%)', height: 'auto', flex: 'none' }}
    />
  );
}

/**
 * PLACEHOLDER for the Ministry of Social Justice & Empowerment lockup, the
 * navy-panel twin of the one on the phone language screen.
 *
 * Same reasoning as there: the real asset has not been supplied, and an
 * official emblem is the wrong thing to approximate - a hand-drawn State
 * Emblem would be both inaccurate and improper to ship. Swap this for an
 * <img> once the file lands in public/.
 *
 * The phone version is dashed grey on white. That styling would nearly vanish
 * on `--navy`, so the treatment is translated rather than copied: a
 * translucent white fill and dashed white border carry the same "not real yet"
 * reading against the dark panel, and the label uses `#C7D8EC` - the muted
 * on-navy colour the tagline below it already uses.
 */
function MinistryMark() {
  return (
    <div
      role="img"
      aria-label="MoSJE logo"
      style={{
        width: '132px',
        height: '44px',
        flex: 'none',
        border: '1px dashed rgba(255,255,255,.45)',
        borderRadius: '9px',
        background: 'rgba(255,255,255,.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        color: '#C7D8EC',
      }}
    >
      MoSJE logo
    </div>
  );
}

/** Mark beside wordmark, for the two navy bars. Both assets are white-on-transparent,
 *  so they only ever sit on `--navy`. */
function Lockup({ h }: { h: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${h * 0.3}px`, flex: 'none' }}>
      <img src="/udyam-logo.png" alt="" style={{ height: `${h}px`, width: 'auto' }} />
      <img
        src="/udyam-wordmark.png"
        alt="उद्यम साथी · Udyam Sathi"
        style={{ height: `${h * 0.72}px`, width: 'auto' }}
      />
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
          className="step-dot"
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      <T hi="पिछला क़दम" en="Previous step" />
    </button>
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
  step,
  ministryMark = false,
  children,
}: {
  tagline?: React.ReactNode;
  /**
   * Shows the ministry placeholder under the site mark. Opt-in because this
   * shell also backs the phone, OTP and social steps, and the phone layout
   * carries the placeholder on the language screen only - turning it on here
   * for everyone would put it on three screens that never had it.
   */
  ministryMark?: boolean;
  /** Enables the "Previous step" control; omit on screens outside onboarding. */
  step?: Slug;
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
          {ministryMark ? <MinistryMark /> : null}
          <div style={{ fontSize: '17.5px', color: '#C7D8EC', maxWidth: '400px', lineHeight: 1.85 }}>
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
        className="dc-flag dc-onb-top"
        style={{
          background: 'var(--navy)',
          color: '#fff',
          padding: '14px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          flex: 'none',
        }}
      >
        <Lockup h={60} />
        <span style={{ flex: 1 }} />
        <Steps at={step} />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
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

/** Hugeicons (free pack, MIT) - the same three the phone dock uses, so one
 *  destination carries one mark whichever layout the visitor is in. */
const NAV: { slug: Slug; hi: string; en: string; icon: typeof Home05Icon }[] = [
  { slug: 'home', hi: 'होम', en: 'Home', icon: Home05Icon },
  { slug: 'saved', hi: 'आपके आवेदन', en: 'Applications', icon: File02Icon },
  { slug: 'settings', hi: 'सेटिंग्स', en: 'Settings', icon: Settings02Icon },
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
        {/* Who is signed in heads the rail; the service's own mark and tagline
            sit at the foot, below the nav. */}
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
                className="navitem"
              >
                <HugeiconsIcon icon={n.icon} size={18} strokeWidth={on ? 2.1 : 1.9} />
                <T hi={n.hi} en={n.en} />
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Anchored to the bottom by the spacer above, so it stays at the foot
            of a 264px rail whatever the nav does. The separator is the same
            rule that used to sit between these two blocks - it moved with
            them rather than being added or dropped. */}
        <div
          style={{
            margin: '0 22px',
            padding: '14px 0 2px',
            borderTop: '1px solid rgba(255,255,255,.12)',
          }}
        >
          <Lockup h={34} />
          <div style={{ fontSize: '11.5px', color: '#B9CBE0', lineHeight: 1.55, marginTop: '10px' }}>
            <T hi="एक सरकारी व्यवहार्यता और ऋण सलाहकार" en="A government feasibility and loan adviser" />
          </div>
        </div>
      </aside>

      {/* No <Tricolour /> here, unlike the onboarding chromes. A full-width
          band of flag colour across the top of every post-onboarding screen
          read as theme chrome rather than as anything about the page, and the
          service is already marked twice over on these screens - the flag
          corner from `.dc-flag`, and the lockup at the head of the rail. */}
      <div className="dc-desk-main">
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div
            className="dc-desk-body dc-monument reveal"
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
              <div
                className="dc-desk-title"
                style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}
              >
                <div style={{ fontSize: '20px', fontWeight: 700, minWidth: 0 }}>{title}</div>
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

/**
 * The row that heads a rail screen: a way back, the title and its subtitle,
 * then whatever that screen wants on the right.
 *
 * Extracted from the verdict screen, which grew it first, so the dashboard and
 * anything after it get the same row rather than a second one that drifts a
 * pixel and a font-size away. The two slots are what actually differ between
 * screens - the verdict screen puts the generated-on date in `meta` and a
 * Print button in `actions`; the dashboard puts its location pill there - so
 * they are slots rather than props with opinions.
 *
 * Keeps `dc-desk-title`, the class `utilities.css` already hides when
 * printing: this row is chrome, and a printed sheet should start at the
 * content. It replaces `DesktopShell`'s own `title` prop on the screens that
 * use it; that prop still backs the screens that only want a plain heading.
 */
export function ScreenHead({
  title,
  sub,
  onBack,
  backLabel,
  meta,
  actions,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  /** Omit for a screen with nothing sensible behind it; the control is then not rendered. */
  onBack?: () => void;
  /** Where back goes, for screen readers - "Back" alone says nothing useful. */
  backLabel?: string;
  /** Quiet supporting text on the right, before the actions. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="dc-desk-title"
      style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '22px' }}
    >
      {onBack ? (
        <button
          onClick={onBack}
          aria-label={backLabel}
          style={{
            flex: 'none',
            marginTop: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            border: '1px solid var(--line)',
            background: 'var(--card)',
            color: 'var(--muted)',
            cursor: 'pointer',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      ) : null}

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
        {sub ? (
          <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '2px' }}>{sub}</div>
        ) : null}
      </div>

      <span style={{ flex: 1 }} />

      {meta ? (
        <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '7px', flex: 'none' }}>
          {meta}
        </div>
      ) : null}
      {actions}
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
