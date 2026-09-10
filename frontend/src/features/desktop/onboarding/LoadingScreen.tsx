'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { MOCK_api } from '@/data/stubs/mock-api';
import { Primary, T } from '@/components';
import { TopBarShell, Legend } from '../shell';

/**
 * D-P10. The report assembling itself, in the shape it will land in - the same
 * `1.3fr 1fr` headline row and `1fr 1fr` SWOT grid the report screen uses, so
 * the layout does not jump when the wait ends.
 *
 * Everything on it is a shimmer. `caseFrom()` could compute most of these
 * figures on the spot, and an earlier pass did show them - which made this
 * read as the finished report, so advancing to the real one looked like the
 * page changing by itself. A loading screen has one job: look like one. No
 * fake numbers counting up either.
 */
export default function LoadingScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  // Derived, not stored: a chosen village with no demo fixture behind it is a
  // fact about the session, knowable during render. Setting it from an effect
  // meant a wasted render pass and, worse, one frame of shimmer promising a
  // report that was never coming.
  const noFixture = !!s.business && s.capital != null && !s.village;
  const [requestFailed, setRequestFailed] = useState(false);
  const failed = requestFailed || noFixture;

  useEffect(() => {
    // A village with no demo fixture behind it has no figures for the engine to
    // work from. Say so straight away: returning here left the screen shimmering
    // for ever, because nothing would ever navigate or fail.
    if (!s.business || s.capital == null) return; // the route guard redirects
    if (!s.village) return; // `noFixture` below already reports this
    let live = true;
    MOCK_api.feasibility({
      villageId: s.village,
      businessId: s.business,
      radiusKm: s.radiusKm,
      capital: s.capital,
    })
      .then((r) => {
        if (!live) return;
        if (!r) return setRequestFailed(true);
        // Stamped here, not read off the clock on the verdict screen: this is
        // the moment the report was actually produced, and the screen that
        // shows it can be revisited days later from Applications. Written
        // before the navigation so the next screen already has it.
        set({ reportAt: new Date().toISOString() });
        nav.replace('feasibility');
      })
      .catch(() => live && setRequestFailed(true));
    return () => {
      live = false;
    };
  }, [s.village, s.business, s.capital, s.radiusKm, nav, set]);

  if (failed) {
    return (
      <TopBarShell padding="44px" contentWidth={560}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
          <T hi="जाँच पूरी नहीं हो सकी" en="The check could not finish" />
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
          <T
            hi="इस गाँव के लिए अभी आँकड़े नहीं हैं। दूसरा गाँव चुनकर देखिए।"
            en="There are no figures for this village yet. Try choosing another one."
          />
        </p>
        <Primary onClick={() => nav.go('location')} style={{ maxWidth: '280px' }}>
          <T hi="गाँव बदलिए" en="Change village" />
        </Primary>
      </TopBarShell>
    );
  }

  return (
    <TopBarShell padding="44px">
      <div>
        <div style={{ fontSize: '20px', fontWeight: 700 }}>
          <T hi="व्यवहार्यता रिपोर्ट" en="Feasibility report" />
        </div>
        <div
          style={{
            fontSize: '14.5px',
            color: 'var(--muted)',
            marginTop: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
          }}
        >
          <Pulse />
          <T hi="आपकी रिपोर्ट बन रही है…" en="Building your report…" />
        </div>
      </div>

      {/* headline row - the same 1.3fr 1fr the report lands in */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="skel" style={{ width: '112px', height: '112px', borderRadius: '50%' }} />
            <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: '9px' }}>
              <Bar w="70%" h={18} />
              <Bar w="45%" h={13} />
            </div>
          </div>
        </Card>

        <Card>
          <Caps>
            <T hi="बाज़ार पहुँच" en="Market reach" />
          </Caps>
          <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
            <Bar w="80%" />
            <Bar w="65%" />
            <Bar w="72%" />
          </div>
        </Card>
      </div>

      <Legend>
        <T hi="मज़बूती और जोखिम" en="Strengths & risks" />
      </Legend>

      {/* SWOT - the same 1fr 1fr grid the SWOT screen uses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map((key, i) => (
          <Card key={key}>
            <Caps>
              {
                [
                  <T key="s" hi="मज़बूती" en="Strengths" />,
                  <T key="w" hi="कमज़ोरी" en="Weaknesses" />,
                  <T key="o" hi="मौके" en="Opportunities" />,
                  <T key="t" hi="जोखिम" en="Risks" />,
                ][i]
              }
            </Caps>
            <div style={{ display: 'grid', gap: '9px', marginTop: '10px' }}>
              <Bar w="90%" />
              <Bar w="75%" />
            </div>
          </Card>
        ))}
      </div>
    </TopBarShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="dc-desk-card" style={{ padding: '20px 22px', minHeight: '124px' }}>
      {children}
    </div>
  );
}

function Caps({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11.5px',
        fontWeight: 700,
        color: 'var(--faint)',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
      }}
    >
      {children}
    </div>
  );
}

/** A shimmer stand-in for a value that genuinely is not known yet. */
function Bar({ w, h = 12 }: { w: string; h?: number }) {
  return <div className="skel" style={{ width: w, height: `${h}px` }} aria-hidden />;
}

function Pulse() {
  return (
    <span
      aria-hidden
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--navy)',
        animation: 'shimmer 1.3s linear infinite',
        flex: 'none',
      }}
    />
  );
}
