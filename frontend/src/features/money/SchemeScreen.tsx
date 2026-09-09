'use client';
import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { compareAgainst, isGap } from '@/domain/finance';
import { SCHEMES } from '@/domain/schemes';
import { label } from '@/domain/feasibility';
import { inr } from '@/lib/format';
import { Header, IllustrativeNote, Primary, T } from '@/components';

const COMMERCIAL_PCT = 11;

export default function SchemeScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { plan } = useCase();
  if (!plan) return null;

  if (isGap(plan)) {
    return (
      <div className="dc-phone">
        <Header onBack={() => nav.go('report')} title={<T hi="पैसे का रास्ता" en="The money path" />} />
        <div style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: '#fff',
              border: '2px solid var(--amber-line)',
              borderRadius: '15px',
              padding: '16px',
              boxShadow: 'var(--e1)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--amber)',
                fontWeight: 700,
              }}
            >
              <T hi="आँकड़े लंबित" en="Figures pending" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-dark)', marginTop: '4px' }}>
              {plan.scheme ? plan.scheme.code : <T hi="कोई योजना नहीं" en="No scheme" />}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '8px', lineHeight: 1.6 }}>
              {plan.scheme ? (
                <T
                  hi={`आपके वर्ग (${s.social}) के लिए ${plan.scheme.code} लागू होती है, पर इसकी ब्याज़ दर, अवधि और अंश अभी आधिकारिक दस्तावेज़ से पुष्टि नहीं हुए। ग़लत आँकड़ा दिखाने से बेहतर है कि यह जगह ख़ाली रहे।`}
                  en={`Your category (${s.social}) routes to ${plan.scheme.code}, but its interest rate, tenure and contribution share are not yet confirmed against the official documents. Showing a wrong figure here would be worse than leaving the gap visible.`}
                />
              ) : (
                <T
                  hi="ये तीनों योजनाएँ SC, ST और OBC वर्ग के लिए हैं। आपकी व्यवहार्यता रिपोर्ट फिर भी पूरी है।"
                  en="These three schemes serve SC, ST and OBC applicants. Your feasibility report is still complete."
                />
              )}
            </div>
          </div>
          <button
            onClick={() => nav.go('edit-category')}
            style={{
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '46px',
              boxShadow: 'var(--e1)',
            }}
          >
            <T hi="अपना वर्ग बदलें" en="Change your category" />
          </button>
          <Primary onClick={() => nav.go('share')} style={{ marginTop: 'auto' }}>
            <T hi="रिपोर्ट साझा करें" en="Share the report" />
          </Primary>
        </div>
      </div>
    );
  }

  const bank = compareAgainst(plan, COMMERCIAL_PCT);
  const maxInterest = Math.max(plan.totalInterest, bank.totalInterest);

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('report')} title={<T hi="पैसे का रास्ता" en="The money path" />} />

      <div
        style={{ flex: 1, padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <div
          style={{
            background: '#fff',
            border: '2px solid var(--teal)',
            borderRadius: '15px',
            boxShadow: 'var(--e2)',
          }}
        >
          <div
            style={{
              background: 'var(--teal)',
              color: '#fff',
              padding: '8px 13px',
              borderRadius: '13px 13px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#fff',
                display: 'grid',
                placeItems: 'center',
                flex: 'none',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal)' }} />
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '.04em' }}>
              {s.social} <T hi="वर्ग · मिलान हुआ" en="category · matched" />
            </span>
          </div>
          <div style={{ padding: '9px 14px 11px' }}>
            <div
              style={{
                fontSize: '10.5px',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              <T hi="आपकी योजना" en="Your scheme" />
            </div>
            <div
              style={{
                fontSize: '23px',
                fontWeight: 700,
                color: 'var(--navy-dark)',
                lineHeight: 1.1,
                marginTop: '2px',
              }}
            >
              {label(plan.scheme.name, s.lang)}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
              {label(plan.scheme.ministry, s.lang)}
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px' }}
            >
              <div style={{ background: 'var(--teal-tint)', borderRadius: '9px', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: '#0F4E68' }}>
                  <T hi="ब्याज़" en="Interest" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--teal)' }}>
                  {plan.interestPct}%
                </div>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: '9px', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  <T hi="अवधि" en="Tenure" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {plan.tenureMonths}{' '}
                  <span style={{ fontSize: '11px' }}>
                    <T hi="माह" en="mo" />
                  </span>
                </div>
              </div>
              <div style={{ background: 'var(--saffron-tint)', borderRadius: '9px', padding: '8px' }}>
                <div style={{ fontSize: '10px', color: '#8A4E06' }}>
                  <T hi="छूट" en="Grace" />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--saffron)' }}>
                  {plan.moratoriumMonths}{' '}
                  <span style={{ fontSize: '11px' }}>
                    <T hi="माह" en="mo" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            boxShadow: 'var(--e1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `1.1fr repeat(${SCHEMES.length},1fr)`,
              fontSize: '9.5px',
              fontWeight: 700,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              borderBottom: '1px solid var(--line-soft)',
            }}
          >
            <div style={{ padding: '7px 10px' }}>
              <T hi="तुलना" en="Compare" />
            </div>
            {SCHEMES.map((sc) => {
              const mine = sc.code === plan.scheme.code;
              return (
                <div
                  key={sc.code}
                  style={{
                    padding: '7px 4px',
                    textAlign: 'center',
                    background: mine ? 'var(--teal-tint)' : 'var(--bg)',
                    color: mine ? 'var(--teal)' : 'var(--faint)',
                  }}
                >
                  {sc.code}
                </div>
              );
            })}
          </div>
          {[
            { hi: 'वर्ग', en: 'Category', get: (sc: (typeof SCHEMES)[0]) => sc.eligible.join('/') },
            {
              hi: 'ब्याज़',
              en: 'Interest',
              get: (sc: (typeof SCHEMES)[0]) => (sc.interestPct == null ? '—' : `${sc.interestPct}%`),
            },
            {
              hi: 'पात्रता',
              en: 'Eligible?',
              get: (sc: (typeof SCHEMES)[0]) => (s.social && sc.eligible.includes(s.social) ? '✓' : 'N/A'),
            },
          ].map((row) => (
            <div
              key={row.en}
              style={{
                display: 'grid',
                gridTemplateColumns: `1.1fr repeat(${SCHEMES.length},1fr)`,
                fontSize: '11.5px',
                borderBottom: '1px solid var(--line-soft)',
              }}
            >
              <div style={{ padding: '6px 10px', color: 'var(--muted)' }}>
                <T hi={row.hi} en={row.en} />
              </div>
              {SCHEMES.map((sc) => {
                const mine = sc.code === plan.scheme.code;
                return (
                  <div
                    key={sc.code}
                    style={{
                      padding: '6px 4px',
                      textAlign: 'center',
                      background: mine ? 'var(--teal-tint)' : 'var(--bg)',
                      color: mine ? 'var(--navy-dark)' : 'var(--faint)',
                      fontWeight: mine ? 700 : 400,
                    }}
                  >
                    {row.get(sc)}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ padding: '7px 12px 8px', fontSize: '10px', color: 'var(--faint)', lineHeight: 1.5 }}>
            <T
              hi={`आप ${s.social} वर्ग में हैं — इसलिए ${plan.scheme.code} चुनी गई। "—" का मतलब उस योजना के आँकड़े अभी पुष्ट नहीं।`}
              en={`You are ${s.social}, so ${plan.scheme.code} was selected. A "—" means that scheme's figures are not confirmed yet.`}
            />
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '10px 13px',
            boxShadow: 'var(--e1)',
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--faint)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              <T hi="आपके पास" en="You have" />
            </div>
            <div style={{ fontSize: '19px', fontWeight: 700, marginTop: '2px' }}>{inr(plan.capital)}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{plan.beneficiaryPct}%</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--teal)', fontWeight: 600 }}>
              +{inr(plan.loanAmount)}
            </div>
            <svg
              width="30"
              height="14"
              viewBox="0 0 34 18"
              fill="none"
              stroke="var(--teal)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9h28M24 3l6 6-6 6" />
            </svg>
            <div style={{ fontSize: '9px', color: 'var(--faint)' }}>
              <T hi="ऋण" en="loan" />
            </div>
          </div>
          <div
            style={{
              flex: 1.1,
              textAlign: 'center',
              background: 'var(--navy)',
              borderRadius: '12px',
              padding: '8px 4px',
              color: '#fff',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#9FB6D3',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              <T hi="पूरा कारोबार" en="Full business" />
            </div>
            <div style={{ fontSize: '23px', fontWeight: 700, marginTop: '2px' }}>{inr(plan.projectCost)}</div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: '14px',
            padding: '10px 13px',
            boxShadow: 'var(--e1)',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600 }}>
            <T hi="कुल ब्याज़ की तुलना" en="Total interest comparison" />
          </div>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              {
                name: (
                  <T
                    hi={`${plan.scheme.code} ${plan.interestPct}% (आपको मिला)`}
                    en={`${plan.scheme.code} ${plan.interestPct}% (you get)`}
                  />
                ),
                v: plan.totalInterest,
                fg: 'var(--teal)',
                bg: 'var(--teal-tint)',
              },
              {
                name: <T hi={`बैंक MSME ${COMMERCIAL_PCT}%`} en={`Bank MSME ${COMMERCIAL_PCT}%`} />,
                v: bank.totalInterest,
                fg: 'var(--rust)',
                bg: 'var(--rust-tint)',
              },
            ].map((r, i) => (
              <div key={i}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11.5px',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ color: r.fg, fontWeight: 600 }}>{r.name}</span>
                  <span style={{ fontWeight: 700 }}>{inr(r.v)}</span>
                </div>
                <div style={{ height: '14px', borderRadius: '5px', background: r.bg, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round((r.v / maxInterest) * 100)}%`,
                      background: r.fg,
                      borderRadius: '5px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '11.5px',
              color: '#0E6234',
              background: 'var(--green-tint)',
              borderRadius: '8px',
              padding: '6px 9px',
            }}
          >
            <T
              hi={`योजना से करीब ${inr(bank.saved)} की बचत।`}
              en={`About ${inr(bank.saved)} saved via the scheme.`}
            />
          </div>
        </div>

        <IllustrativeNote />

        <Primary onClick={() => nav.go('emi')} arrow style={{ marginTop: 'auto' }}>
          <T hi="आगे · वापसी की योजना" en="Next · repayment plan" />
        </Primary>
      </div>
    </div>
  );
}
