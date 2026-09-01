'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { label } from '@/domain/feasibility';
import { num } from '@/lib/format';
import { MOCK_api } from '@/data/stubs/mock-api';
import { Primary, ScoreDial, T } from '@/components';
import { TopBarShell, Legend } from '../shell';

/**
 * D-P10. The report assembling itself, in the shape it will land in - the same
 * `1.3fr 1fr` headline row and `1fr 1fr` SWOT grid the report screen uses, so
 * the layout does not jump when the wait ends.
 *
 * Every figure shown is already real. By this point the session holds village,
 * business and capital, so `caseFrom()` can compute; the wait is the
 * feasibility call, not the arithmetic. A slot is a shimmer only while its
 * value genuinely is not known yet - never a fake number counting up.
 */
export default function LoadingScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { report } = useCase();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!s.village || !s.business || s.capital == null) return;
    let live = true;
    MOCK_api.feasibility({
      villageId: s.village,
      businessId: s.business,
      radiusKm: s.radiusKm,
      capital: s.capital,
    })
      .then((r) => live && (r ? nav.replace('feasibility') : setFailed(true)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [s.village, s.business, s.capital, s.radiusKm, nav]);

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
            {report ? (
              <ScoreDial score={report.score} size={112} />
            ) : (
              <div className="skel" style={{ width: '112px', height: '112px', borderRadius: '50%' }} />
            )}
            <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: '9px' }}>
              {report ? (
                <>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>
                    {label(report.business.name, s.lang)}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    {label(report.village.name, s.lang)}, {report.village.block} · {report.radiusKm}{' '}
                    <T hi="किमी" en="km" />
                  </div>
                </>
              ) : (
                <>
                  <Bar w="70%" h={18} />
                  <Bar w="45%" h={13} />
                </>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <Caps>
            <T hi="बाज़ार पहुँच" en="Market reach" />
          </Caps>
          {report ? (
            <div style={{ display: 'grid', gap: '7px', marginTop: '8px' }}>
              <Fact k={<T hi="लोग" en="People" />} v={num(report.marketReach.population)} />
              <Fact k={<T hi="गाँव" en="Villages" />} v={String(report.marketReach.villages)} />
              <Fact k={<T hi="प्रतियोगी" en="Competitors" />} v={String(report.totalCompetitors)} />
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
              <Bar w="80%" />
              <Bar w="65%" />
              <Bar w="72%" />
            </div>
          )}
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
            {report ? (
              <ul style={{ margin: '8px 0 0', paddingLeft: '18px', display: 'grid', gap: '6px' }}>
                {report.swot[key].map((it) => (
                  <li key={it.en} style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--text)' }}>
                    {label(it, s.lang)}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ display: 'grid', gap: '9px', marginTop: '10px' }}>
                <Bar w="90%" />
                <Bar w="75%" />
              </div>
            )}
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

function Fact({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', fontSize: '13.5px' }}>
      <span style={{ flex: 1, color: 'var(--muted)' }}>{k}</span>
      <span style={{ fontWeight: 700 }}>{v}</span>
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
