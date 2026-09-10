'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav, useStartCheck } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { isGap } from '@/domain/finance';
import { label } from '@/domain/feasibility';
import { inr } from '@/lib/format';
import { Icon, Pill, Primary, ScoreDial, T, verdictColor, type IconName } from '@/components';
import { DesktopShell, Legend, ScreenHead } from '../shell';

/**
 * D-P6. The returning user's landing view. With no finished check this is the
 * empty state rather than a card full of blanks - `redirectFor` allows `home`
 * for any onboarded user, so the screen has to handle both.
 */
export default function HomeScreen() {
  const { s } = useSession();
  const nav = useNav();
  const startCheck = useStartCheck();
  const { report, plan } = useCase();
  const money = plan && !isGap(plan) ? plan : null;

  // `name` is a real field the social step collects, not a generated id - but
  // it is stored locally only (see restore-session.ts), so a returning user on
  // a fresh browser has their case back and their name blank. The phone home
  // screen falls back to the number in exactly this way; matching it here
  // keeps one person greeted the same on both.
  const who = s.name || (s.phone ? `+91 ${s.phone}` : '');
  const place = report ? `${label(report.village.name, s.lang)}, ${report.village.block}` : null;

  return (
    <DesktopShell padding="36px 44px">
      <ScreenHead
        title={who ? <T hi={`नमस्ते, ${who}`} en={`Hello, ${who}`} /> : <T hi="नमस्ते" en="Hello" />}
        sub={
          <T
            hi="आपकी जाँच, कर्ज़ के विकल्प और अगला कदम"
            en="Your check, your loan options and what to do next"
          />
        }
        actions={place ? <LocationPill place={place} /> : null}
      />

      {report ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr',
              gap: '22px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                background: 'var(--navy)',
                backgroundImage: 'var(--ledger-ink)',
                color: '#fff',
                borderRadius: '14px',
                padding: '26px 30px',
                display: 'flex',
                alignItems: 'center',
                gap: '26px',
                boxShadow: 'var(--e2)',
              }}
            >
              {/* The same gauge the verdict screen heads itself with, in its
                  on-navy tone: one score, one arc, one animation, wherever it
                  is shown. */}
              <ScoreDial score={report.score} size={116} onDark />
              <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,.2)' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#9FB6D3', letterSpacing: '.06em' }}>
                  <T hi="चल रही जाँच" en="ACTIVE CHECK" />
                </div>

                {/* The verdict heads the card, not the business name, so the
                    four chips below are the only place each of those values
                    appears. Repeating the business and the village as a
                    headline AND as chips would be the same text twice in one
                    card, which is what the chips are meant to replace. */}
                <div
                  style={{
                    fontSize: '21px',
                    fontWeight: 700,
                    marginTop: '4px',
                    // The shared mapping: green for good, amber for
                    // worth-checking, lightened for this navy card. Both
                    // verdicts used to be oranges here, so "Good opportunity"
                    // was a warning colour on the dashboard and a success
                    // colour on the result screen.
                    color: verdictColor(report.verdict, true),
                  }}
                >
                  {report.verdict === 'good' ? (
                    <T hi="अच्छा मौका" en="Good opportunity" />
                  ) : (
                    <T hi="पहले जाँच लीजिए" en="Worth checking first" />
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '11px' }}>
                  <Pill tone="on-dark">{label(report.business.name, s.lang)}</Pill>
                  <Pill tone="on-dark">{place}</Pill>
                  {money ? (
                    <>
                      {/* Both of these were bare values: a four-letter code
                          and a rupee figure with nothing saying what either
                          one was. The business and the village name
                          themselves; these two do not, so they carry the
                          word that says what they are. */}
                      <Pill tone="on-dark">
                        <T hi={`योजना ${money.scheme.code}`} en={`Scheme ${money.scheme.code}`} />
                      </Pill>
                      <Pill tone="solid">
                        <T hi={`ऋण ${inr(money.loanAmount)}`} en={`Loan ${inr(money.loanAmount)}`} />
                      </Pill>
                    </>
                  ) : (
                    <Pill tone="on-dark">
                      <T hi="योजना आँकड़े पुष्ट नहीं" en="Scheme figures unconfirmed" />
                    </Pill>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={startCheck}
              style={{
                border: '2px dashed var(--navy-tint)',
                background: 'var(--navy-tint2)',
                borderRadius: '14px',
                fontFamily: 'var(--sans)',
                color: 'var(--navy-dark)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '20px',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '1px solid var(--navy-tint)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span style={{ color: 'var(--navy)', display: 'grid' }}>
                  <Icon name="add" size={24} />
                </span>
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>
                <T hi="नई जाँच शुरू करें" en="Start a new check" />
              </span>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                  maxWidth: '210px',
                  textAlign: 'center',
                }}
              >
                <T
                  hi="दूसरा गाँव, दूसरा कारोबार या दूसरी पूँजी परखिए"
                  en="Try another village, business or amount of capital"
                />
              </span>
            </button>
          </div>

          <Legend>
            <T hi="अगला कदम" en="Next steps" />
          </Legend>
          {/* No "View guide" link: there is no guide. The only Help row in the
              app points at the phone settings screen, which is not one. */}
          <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '-6px 0 16px', lineHeight: 1.6 }}>
            <T
              hi="जाँच पूरी हो चुकी है। आगे तीन काम किए जा सकते हैं।"
              en="The check is done. Three things you can do with it."
            />
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            <Step
              onClick={() => nav.go('report')}
              tint="var(--teal-tint)"
              stroke="var(--teal)"
              icon="filed"
              hi="पूरी रिपोर्ट"
              en="Full report"
              sub={<T hi="प्रतियोगी, दाम, जोखिम" en="Competitors, price, risks" />}
              footTint="var(--teal-tint)"
              footColor="#0F4E68"
              foot={
                <T
                  hi={`${report.totalCompetitors} प्रतियोगी और दाम की रेंज, गाँव दर गाँव।`}
                  en={`All ${report.totalCompetitors} competitors and the price range, village by village.`}
                />
              }
            />
            <Step
              onClick={() => nav.go('emi')}
              tint="var(--green-tint)"
              stroke="var(--green)"
              icon="plan"
              hi="वापसी योजना"
              en="Repayment plan"
              sub={
                money ? (
                  <T hi={`${inr(money.emi)}/माह`} en={`${inr(money.emi)}/month`} />
                ) : (
                  <T hi="आँकड़े पुष्ट नहीं" en="Figures unconfirmed" />
                )
              }
              footTint="var(--green-tint)"
              footColor="#0E6234"
              foot={
                money ? (
                  <T
                    hi={`${money.scheme.code} पर ${money.interestPct}%, किश्त दर किश्त।`}
                    en={`${money.interestPct}% under ${money.scheme.code}, instalment by instalment.`}
                  />
                ) : (
                  <T
                    hi="इस वर्ग की योजना की दर अभी पुष्ट नहीं है।"
                    en="This category's scheme rate is not confirmed yet."
                  />
                )
              }
            />
            <Step
              onClick={() => nav.go('share')}
              tint="var(--saffron-tint)"
              stroke="var(--saffron)"
              icon="bank"
              hi="बैंक को दिखाइए"
              en="Show to bank"
              sub={<T hi="एक पन्ने का सारांश" en="One-page summary" />}
              footTint="var(--saffron-tint)"
              footColor="#8A4E06"
              foot={
                <T
                  hi="छापिए या PDF बनाइए और बैंक या CSC केंद्र पर दिखाइए।"
                  en="Print it or save a PDF to take to a bank or CSC centre."
                />
              }
            />
          </div>
        </>
      ) : (
        <div style={{ maxWidth: '520px' }}>
          <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.7 }}>
            <T
              hi="आपने अभी कोई जाँच पूरी नहीं की। गाँव, पूँजी और कारोबार बताइए — रिपोर्ट कुछ ही पल में तैयार हो जाएगी।"
              en="You haven't finished a check yet. Tell us your village, capital and business — the report takes moments."
            />
          </p>
          <Primary onClick={startCheck} arrow>
            <T hi="पहली जाँच शुरू कीजिए" en="Start your first check" />
          </Primary>
        </div>
      )}
    </DesktopShell>
  );
}

/**
 * Where the active check is. Read-only.
 *
 * Deliberately not a control: there is nothing for it to do yet. Changing the
 * location would mean running a new check - which the panel beside the active
 * card already offers - so wiring this to that would be a second, less obvious
 * door to the same place, and wiring it to nothing at all would be a button
 * that lies. It is a label until there is a real behaviour to give it, so it
 * carries no chevron, no hover and no pointer cursor.
 */
function LocationPill({ place }: { place: string }) {
  return (
    <Pill
      tone="outline"
      size="md"
      icon={
        <span aria-hidden style={{ color: 'var(--saffron)', display: 'grid', flex: 'none' }}>
          <Icon name="place" size={15} />
        </span>
      }
    >
      {place}
    </Pill>
  );
}

function Step({
  onClick,
  tint,
  stroke,
  icon,
  hi,
  en,
  sub,
  foot,
  footTint,
  footColor,
}: {
  onClick: () => void;
  tint: string;
  stroke: string;
  icon: IconName;
  hi: string;
  en: string;
  sub: React.ReactNode;
  /** The second line, in the tinted strip along the foot of the card. */
  foot: React.ReactNode;
  footTint: string;
  footColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rowh dc-desk-card"
      style={{
        textAlign: 'left',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <span style={{ display: 'block', padding: '20px 22px 16px', flex: 1 }}>
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: tint,
            marginBottom: '14px',
          }}
        >
          <span style={{ color: stroke, display: 'grid' }}>
            <Icon name={icon} size={20} />
          </span>
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '15.5px',
            fontWeight: 700,
            marginBottom: '4px',
            color: 'var(--text)',
          }}
        >
          <T hi={hi} en={en} />
        </span>
        <span style={{ display: 'block', fontSize: '13.5px', color: 'var(--muted)' }}>{sub}</span>
      </span>

      {/* The explanatory line, in the card's own colour so the three read as
          three different actions rather than three copies of one card. */}
      <span
        style={{
          display: 'block',
          background: footTint,
          color: footColor,
          padding: '10px 22px',
          fontSize: '12px',
          lineHeight: 1.5,
          fontWeight: 600,
        }}
      >
        {foot}
      </span>
    </button>
  );
}
