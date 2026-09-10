'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { insight, type Insight } from '@/domain/case';
import { narrate, label } from '@/domain/feasibility';
import { inr, num } from '@/lib/format';
import { Primary, ScoreDial, Stat, T, useT } from '@/components';
import { DesktopShell, Legend, ScreenHead } from '../shell';

/**
 * D-P2. The verdict: one score, one plain sentence, three supporting figures,
 * and the reading those figures add up to. Every number is `buildReport()`'s -
 * the canvas's 79/100 is a placeholder and is not reproduced here.
 */
export default function FeasibilityScreen() {
  const { s } = useSession();
  const nav = useNav();
  const kase = useCase();
  const { report } = kase;
  if (!report) return null;

  const good = report.verdict === 'good';
  const business = label(report.business.name, s.lang);
  const village = label(report.village.name, s.lang);
  const place = `${village}, ${report.village.block}`;
  const read = insight(kase);

  return (
    <DesktopShell padding="32px 40px">
      <Head place={place} business={business} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '26px' }}>
            <ScoreDial score={report.score} size={168} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
                {business} · {place}
              </div>
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 700,
                  color: good ? 'var(--green)' : 'var(--amber)',
                  lineHeight: 1.2,
                }}
              >
                {good ? (
                  <T hi="अच्छा मौका" en="Good opportunity" />
                ) : (
                  <T hi="पहले जाँच लीजिए" en="Worth checking first" />
                )}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'var(--text)', margin: '0 0 26px' }}>
            {narrate(report, s.lang)}
          </p>

          {/* Plain tiles. What separates them is the line under each number
              saying what it counts - with the radius and the village pulled
              from the report rather than written into the string - not a tint
              or an icon, which would have told them apart without explaining
              anything. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
            <Stat
              size="sm"
              label={<T hi="दायरे में लोग" en="People in radius" />}
              value={num(report.marketReach.population)}
              sub={
                <T
                  hi={`${place} से ${report.radiusKm} किमी के भीतर रहने वाले लोग।`}
                  en={`People living within ${report.radiusKm} km of ${place}.`}
                />
              }
            />
            <Stat
              size="sm"
              label={<T hi="प्रतियोगी" en="Competitors" />}
              value={String(report.totalCompetitors)}
              sub={
                <T
                  hi={`${business} की इकाइयाँ जो इस दायरे में पहले से चल रही हैं।`}
                  en={`${business} units already running in that circle.`}
                />
              }
            />
            <Stat
              size="sm"
              label={<T hi="प्रति प्रतियोगी लोग" en="People per competitor" />}
              value={num(report.peoplePerCompetitor)}
              sub={
                <T
                  hi="औसतन हर मौजूदा इकाई के हिस्से इतने लोग आते हैं।"
                  en="On average, each existing unit serves about this many people."
                />
              }
            />
          </div>
        </div>

        <WhatNext report={report} onRead={() => nav.go('report')} />
      </div>

      {read ? <KeyInsight read={read} business={business} /> : null}
    </DesktopShell>
  );
}

/**
 * Breadcrumb, date and the one export this screen can actually perform.
 *
 * The row itself is `ScreenHead` in ../shell - the dashboard heads itself with
 * the same component. Only the two slots are this screen's: when the check was
 * built, and the print control.
 */
function Head({ place, business }: { place: string; business: string }) {
  const { s } = useSession();
  const nav = useNav();
  const t = useT();

  // The moment the check finished, written by the loading screen. Absent only
  // when this screen was reached without one - a deep link, or a session from
  // before the field existed - and then the line is left out rather than
  // dated with today, which would be a date nothing measured.
  const built = s.reportAt ? new Date(s.reportAt) : null;
  const when =
    built && !Number.isNaN(built.getTime())
      ? built.toLocaleDateString(s.lang === 'en' ? 'en-IN' : 'hi-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;

  return (
    <ScreenHead
      title={<T hi="आपकी जाँच का नतीजा" en="Your result" />}
      sub={<T hi="व्यवसाय व्यवहार्यता जाँच" en="Business feasibility analysis" />}
      onBack={() => nav.go('home')}
      backLabel={t('होम पर जाइए', 'Go to home')}
      meta={when ? <T hi={`${when} को बनी`} en={`Generated on ${when}`} /> : null}
      actions={
        /* Printing is the one export this screen can really perform:
           `utilities.css` already strips the rail, this row and the watermark,
           and the browser dialog is what saves the PDF. There is deliberately
           no Share button - the share sheet at /desktop/share files the case as
           an application, which is several steps further down the flow, and a
           button that quietly filed something would be worse than no button. */
        <button
          onClick={() => window.print()}
          className="no-print"
          aria-label={t(
            `${business}, ${place} की जाँच छापिए या PDF बनाइए`,
            `Print or save this check for ${business}, ${place} as a PDF`,
          )}
          style={{
            flex: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid var(--line)',
            background: 'var(--card)',
            borderRadius: '9px',
            padding: '9px 15px',
            fontSize: '13.5px',
            fontWeight: 600,
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
            color: 'var(--muted)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
            <path d="M6 9V3h12v6M6 18H4v-6h16v6h-2M8 14h8v7H8z" />
          </svg>
          <T hi="छापिए / PDF" en="Print / PDF" />
        </button>
      }
    />
  );
}

/**
 * What the full report adds, listed as what it actually contains: the three
 * detail views the report screen opens - competitors, pricing, strengths and
 * risks - under the names that screen gives them, each carrying this case's
 * own figure. Nothing here names a section the report does not have.
 */
function WhatNext({
  report,
  onRead,
}: {
  report: NonNullable<ReturnType<typeof useCase>['report']>;
  onRead: () => void;
}) {
  const forCount = report.swot.strengths.length + report.swot.opportunities.length;
  const againstCount = report.swot.weaknesses.length + report.swot.threats.length;

  // Leaf plates sell for about two rupees, and `inr()` rounds to whole ones -
  // so this screen printed "Suggested price Rs 2" for a price the phone's own
  // feasibility screen renders as Rs 2.10, and the range came out as "Rs 1 to
  // Rs 2". Same sub-Rs-10 rule the phone screen, both pricing screens and the
  // desktop report already apply; this screen was the one that missed it. The
  // figure is untouched - only how many of its digits are shown.
  const price = (n: number) => (n < 10 ? `₹${n.toFixed(2)}` : inr(n));

  return (
    <div className="dc-desk-card" style={{ padding: '22px 24px' }}>
      <Legend>
        <T hi="आगे क्या" en="What next" />
      </Legend>
      <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 14px' }}>
        <T
          hi={`सुझाया दाम ${price(report.pricing.suggested)} — पूरी रिपोर्ट में यह सब विस्तार से है।`}
          en={`Suggested price ${price(report.pricing.suggested)} — the full report covers each of these in detail.`}
        />
      </p>

      <ul style={{ listStyle: 'none', margin: '0 0 18px', padding: 0, display: 'grid', gap: '9px' }}>
        <Item>
          <T
            hi={`प्रतियोगी — गाँव दर गाँव, सभी ${report.totalCompetitors}`}
            en={`Competitors — village by village, all ${report.totalCompetitors}`}
          />
        </Item>
        <Item>
          <T
            hi={`सुझाया दाम — ${price(report.pricing.low)} से ${price(report.pricing.high)} तक की रेंज`}
            en={`Suggested price — the ${price(report.pricing.low)} to ${price(report.pricing.high)} range`}
          />
        </Item>
        <Item>
          <T
            hi={`मज़बूती और जोखिम — ${forCount} पक्ष, ${againstCount} जोखिम`}
            en={`Strengths & risks — ${forCount} for, ${againstCount} against`}
          />
        </Item>
      </ul>

      {/* No arrow: it pointed at nothing in particular, and the label already
          says what the button does. */}
      <Primary onClick={onRead}>
        <T hi="पूरी रिपोर्ट देखिए" en="Read the full report" />
      </Primary>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13.5px', lineHeight: 1.5 }}
    >
      <svg
        aria-hidden
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--green)"
        strokeWidth="2.6"
        style={{ flex: 'none', marginTop: '2px' }}
      >
        <path d="M4 12.5l5.5 5.5L20 7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

/**
 * What the score's own inputs mean, in a sentence.
 *
 * Every figure is `insight()`'s, and the sentence changes with them: the
 * reading, both counts, which ceiling the revenue estimate hit and the
 * shortfall clause are all read off this case. A fixed line saying the market
 * "appears moderately competitive" would have said it under a crowded market
 * and an empty one alike.
 */
function KeyInsight({ read, business }: { read: Insight; business: string }) {
  const pct = Math.round(read.headroom * 100);
  const per = num(read.perCompetitor);
  const need = num(read.viableCatchment);
  const b = business.toLowerCase();

  const reading =
    read.reading === 'room' ? (
      <T
        hi={`यहाँ हर मौजूदा इकाई के हिस्से लगभग ${per} लोग आते हैं, और ${b} की एक इकाई को चलने के लिए क़रीब ${need} लोग चाहिए — यानी ज़रूरत का लगभग ${pct}%। इस दायरे में एक और इकाई के लिए जगह दिखती है।`}
        en={`Each unit here already has about ${per} people to itself, against the roughly ${need} a ${b} unit needs to be viable — about ${pct}% of one unit worth of demand. There looks to be room for another in this circle.`}
      />
    ) : read.reading === 'tight' ? (
      <T
        hi={`यहाँ हर मौजूदा इकाई के हिस्से लगभग ${per} लोग आते हैं, जबकि ${b} की एक इकाई को क़रीब ${need} लोग चाहिए — ज़रूरत का लगभग ${pct}%। गुंजाइश है, पर ज़्यादा नहीं: कर्ज़ लेने से पहले आसपास माँग परख लीजिए।`}
        en={`Each unit here has about ${per} people to itself, against the roughly ${need} a ${b} unit needs — about ${pct}% of one unit worth of demand. There is room, but not much of it: worth testing local demand before borrowing.`}
      />
    ) : (
      <T
        hi={`यहाँ हर मौजूदा इकाई के हिस्से सिर्फ़ लगभग ${per} लोग आते हैं, जबकि ${b} की एक इकाई को क़रीब ${need} लोग चाहिए — ज़रूरत का सिर्फ़ ${pct}%। बाज़ार भरा हुआ है: दायरा बढ़ाकर देखिए, या कर्ज़ लेने से पहले माँग ज़रूर परख लीजिए।`}
        en={`Each unit here has only about ${per} people to itself, against the roughly ${need} a ${b} unit needs — just ${pct}% of one unit worth of demand. The market is crowded: widen the radius, or test demand carefully before borrowing.`}
      />
    );

  return (
    <div
      className="dc-desk-card"
      style={{ marginTop: '22px', padding: '20px 24px', borderLeft: '3px solid var(--teal)' }}
    >
      <Legend>
        <T hi="मुख्य बात" en="Key insight" />
      </Legend>
      {/* Nothing follows this on purpose. The illustration band is painted at
          the foot of the content area, so keeping the insight last is what
          puts the band directly under it instead of under a gap. */}
      <p style={{ fontSize: '15px', lineHeight: 1.7, margin: 0, color: 'var(--text)' }}>
        {reading}{' '}
        {read.limitedBy === 'capacity' ? (
          <T
            hi="कमाई का अनुमान माँग से नहीं, इस आकार के सेटअप की क्षमता से बँधा है।"
            en="The earnings estimate is capped by what a setup this size can push through, not by demand."
          />
        ) : (
          <T
            hi="कमाई का अनुमान आसपास के बाज़ार के आकार से बँधा है।"
            en="The earnings estimate is capped by the size of the local market."
          />
        )}
        {read.margin ? (
          <>
            {' '}
            <T
              hi={`साथ ही, योजना इस सेटअप पर आपकी ओर से ${inr(read.margin.requiredMargin)} माँगती है और आपके पास ${inr(read.margin.capital)} हैं।`}
              en={`On top of that, the scheme expects ${inr(read.margin.requiredMargin)} of your own on a setup this size, and you have ${inr(read.margin.capital)}.`}
            />
          </>
        ) : null}
      </p>
    </div>
  );
}
