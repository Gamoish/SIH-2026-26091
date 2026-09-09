'use client';

import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api } from '@/lib/api';
import { planLoan, isGap } from '@/domain/finance';
import { costBreakdown, label } from '@/domain/feasibility';
import { MOCK_BUSINESSES } from '@/data/fixtures/businesses';
import { inr } from '@/lib/format';
import { Field, Primary, T, useT } from '@/components';
import { TopBarShell, Ask } from '../shell';

/**
 * D-P1e. The live eligibility preview beside the input is `planLoan()` - the
 * same deterministic engine the report uses - so the figure a user sees here
 * is the figure they get later, never an illustration.
 *
 * `planLoan` takes no business: the scheme, rate and project cost are the same
 * whatever is being started. What IS business-specific is where the money
 * goes, so now that the category step runs before this one, the aside breaks
 * the project cost down over the chosen business's own `costSplit` instead of
 * stopping at a total.
 */
export default function CapitalScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const [digits, setDigits] = useState(s.capital != null ? String(s.capital) : '');

  const capital = digits === '' ? 0 : Number(digits);
  const plan = s.social && capital > 0 ? planLoan(capital, s.social) : null;
  const money = plan && !isGap(plan) ? plan : null;
  const business = s.business ? MOCK_BUSINESSES[s.business] : null;

  const submit = async () => {
    if (capital <= 0) return;
    set({ capital });
    try {
      await api.saveProfile({ capital });
    } catch {
      // local session holds it; the next step re-saves
    }
    nav.go('loading');
  };

  return (
    <TopBarShell
      step="capital"
      contentWidth={560}
      asideWidth={460}
      asideBackground="var(--navy-800)"
      aside={
        <>
          <div style={{ fontSize: '12px', letterSpacing: '.06em', color: '#B9CCE5' }}>
            <T hi="आप कितने के हक़दार हैं" en="WHAT YOU QUALIFY FOR" />
          </div>
          {money ? (
            <>
              <div style={{ fontSize: '44px', fontWeight: 700, lineHeight: 1.05 }}>
                {inr(money.loanAmount)}
              </div>
              <div style={{ fontSize: '14px', color: '#CBDAEC', lineHeight: 1.6 }}>
                <T
                  hi={`${money.scheme.code} · ${money.interestPct}% ब्याज़ · कुल परियोजना ${inr(money.projectCost)}`}
                  en={`${money.scheme.code} · ${money.interestPct}% interest · project cost ${inr(money.projectCost)}`}
                />
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,.15)', margin: '6px 0' }} />
              <Line k={<T hi="आपके पास" en="You have" />} v={inr(money.capital)} />
              <Line k={<T hi="योजना जोड़ती है" en="The scheme adds" />} v={inr(money.loanAmount)} />
              <Line k={<T hi="कुल परियोजना" en="Project cost" />} v={inr(money.projectCost)} />

              {business ? (
                <>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,.15)', margin: '6px 0' }} />
                  <div style={{ fontSize: '12px', letterSpacing: '.06em', color: '#B9CCE5' }}>
                    <T
                      hi={`${business.name.hi} में यह पैसा कहाँ जाएगा`}
                      en={`WHERE THIS GOES IN ${business.name.en.toUpperCase()}`}
                    />
                  </div>
                  {costBreakdown(money.projectCost, business).map((c) => (
                    <Line key={c.label.en} k={label(c.label, s.lang)} v={inr(c.amount)} />
                  ))}
                </>
              ) : null}
            </>
          ) : (
            <div style={{ fontSize: '14px', color: '#CBDAEC', lineHeight: 1.7 }}>
              {plan && isGap(plan) ? (
                <T
                  hi="इस वर्ग की योजना के आँकड़े अभी पुष्ट नहीं — राशि आगे दिखाई जाएगी।"
                  en="This category's scheme figures are unconfirmed — the amount is withheld for now."
                />
              ) : (
                <T
                  hi="अपनी पूँजी भरिए, और यहाँ तुरंत दिखेगा कि सरकार कितना जोड़ सकती है।"
                  en="Enter your capital and this shows, instantly, how much the scheme can add."
                />
              )}
            </div>
          )}
        </>
      }
    >
      <Ask
        hi="आपके पास शुरू करने के लिए कितना पैसा है?"
        en="How much money do you have to start?"
        note={
          <T
            hi="इसी पर तय होता है कि सरकार से कितना मिल सकता है"
            en="This decides how much the government scheme can add"
          />
        }
      />

      <Field
        label={t('आपकी पूँजी (₹)', 'Your capital (₹)')}
        value={digits}
        onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 8))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        inputMode="numeric"
        placeholder="22000"
        style={{ fontSize: '30px', fontWeight: 700 }}
      />

      <Primary onClick={submit} disabled={capital <= 0} arrow>
        <T hi="जाँच शुरू कीजिए" en="Run the check" />
      </Primary>
    </TopBarShell>
  );
}

/** One row in the dark eligibility panel. */
function Line({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', fontSize: '14px' }}>
      <span style={{ flex: 1, color: '#B9CCE5' }}>{k}</span>
      <span style={{ fontWeight: 700 }}>{v}</span>
    </div>
  );
}
