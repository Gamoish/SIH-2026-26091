'use client';

import React, { useEffect, useRef } from 'react';
import { useSession } from '@/hooks/use-session';
import { useCase } from '@/hooks/use-case';
import { saveCase } from '@/lib/save-case';
import { isGap } from '@/domain/finance';
import { label, narrate } from '@/domain/feasibility';
import { inr } from '@/lib/format';
import { T, useT } from '@/components';
import { DesktopShell, Legend } from '../shell';

/** Stable per user+village, so the same case always carries the same reference. */
const hash = (v: string) => [...v].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);

/**
 * D-P7. The one-page summary to hand a bank or CSC. Printing is the browser's
 * own - `utilities.css` strips the rail and title bar, leaving the sheet.
 */
export default function ShareScreen() {
  const { s, set } = useSession();
  const t = useT();
  const { report, plan } = useCase();

  // Filing the case is what makes it exist beyond this browser: `savedAt` is
  // only the local marker that stops it being filed again on a later visit. If
  // the write fails the marker is not set, so the next visit retries rather
  // than showing a case the applications list has never heard of.
  //
  // The ref is not redundant with `savedAt`: setting session state is async, so
  // a second run of this effect - React's development double-invoke, or any
  // re-render before the state lands - passed the `savedAt` check and filed the
  // same case twice. The ref closes in the same tick the request starts.
  const filing = useRef(false);
  useEffect(() => {
    if (s.savedAt || !report || filing.current) return;
    filing.current = true;
    let live = true;
    saveCase({ report, plan })
      .then((id) => {
        if (live && id) set({ savedAt: new Date().toISOString() });
      })
      .catch(() => {
        // offline or unauthenticated: let the next visit try again
        filing.current = false;
      });
    return () => {
      live = false;
    };
  }, [s.savedAt, set, report, plan]);

  if (!report) return null;
  const money = plan && !isGap(plan) ? plan : null;
  const ref = `SNB-${String((Math.abs(hash(s.phone + report.village.id)) % 9000) + 1000)}`;

  return (
    <DesktopShell
      padding="40px"
      background="var(--panel)"
      asideWidth={460}
      asideBackground="#fff"
      title={<T hi="बैंक को दिखाइए" en="Show this to the bank" />}
      aside={
        <>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>
            <T hi="अगला क़दम" en="Your next step" />
          </div>
          <p style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
            <T
              hi="इस पन्ने को छापिए या PDF बनाइए, और बैंक, CSC केंद्र या किसी मददगार को दिखाइए।"
              en="Print this page or save it as a PDF, and show it at a bank, a CSC centre, or to anyone helping you."
            />
          </p>
          <div style={{ height: '1px', background: 'var(--line-soft)', margin: '4px 0' }} />
          <Row k={t('संदर्भ', 'Reference')} v={ref} />
          <Row
            k={t('बनी', 'Created')}
            v={s.savedAt ? new Date(s.savedAt).toLocaleDateString('en-IN') : '—'}
          />
          <div style={{ flex: 1 }} />
          <button
            onClick={() => window.print()}
            className="no-print"
            style={{
              border: 0,
              background: 'var(--saffron)',
              color: '#fff',
              borderRadius: '12px',
              padding: '15px',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <T hi="छापिए / PDF बनाइए" en="Print / save as PDF" />
          </button>
        </>
      }
      actions={
        <button
          onClick={() => window.print()}
          className="no-print"
          style={{
            border: 0,
            background: 'var(--saffron)',
            color: '#fff',
            borderRadius: '9px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
          }}
        >
          <T hi="छापिए / PDF" en="Print / PDF" />
        </button>
      }
    >
      <div className="print-card dc-desk-card" style={{ padding: '38px 44px', maxWidth: '840px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid var(--navy)',
            paddingBottom: '16px',
            marginBottom: '22px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--navy-dark)',
              }}
            >
              <T hi="व्यवहार्यता सारांश" en="Feasibility summary" />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '3px' }}>
              <T hi="उद्यम साथी · भारत सरकार" en="Udyam Sathi · Government of India" />
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--muted)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{ref}</div>
            <div>{s.savedAt ? new Date(s.savedAt).toLocaleDateString('en-IN') : ''}</div>
          </div>
        </div>

        <Row k={t('नाम', 'Name')} v={s.name || '—'} />
        <Row k={t('वर्ग', 'Category')} v={s.social ?? '—'} />
        <Row k={t('गाँव', 'Village')} v={`${label(report.village.name, s.lang)}, ${report.village.block}`} />
        <Row k={t('कारोबार', 'Business')} v={label(report.business.name, s.lang)} />
        <Row k={t('अंक', 'Score')} v={`${report.score} / 100`} />
        <Row k={t('सुझाया दाम', 'Suggested price')} v={inr(report.pricing.suggested)} />
        {money ? (
          <>
            <Row k={t('योजना', 'Scheme')} v={`${money.scheme.code} · ${money.interestPct}%`} />
            <Row k={t('कुल परियोजना', 'Project cost')} v={inr(money.projectCost)} />
            <Row k={t('ऋण राशि', 'Loan amount')} v={inr(money.loanAmount)} />
            <Row k={t('मासिक किश्त', 'Monthly instalment')} v={inr(money.emi)} />
            <Row
              k={t('राहत अवधि', 'Grace period')}
              v={t(`${money.moratoriumMonths} महीने`, `${money.moratoriumMonths} months`)}
            />
          </>
        ) : (
          <Row k={t('योजना', 'Scheme')} v={t('आँकड़े पुष्ट नहीं', 'figures unconfirmed')} />
        )}

        <div style={{ marginTop: '22px' }}>
          <Legend>
            <T hi="जाँच का नतीजा" en="What the check found" />
          </Legend>
          <p style={{ fontSize: '14.5px', lineHeight: 1.7, margin: 0, color: 'var(--text)' }}>
            {narrate(report, s.lang)}
          </p>
        </div>

        <p
          style={{
            fontSize: '11.5px',
            color: 'var(--faint)',
            lineHeight: 1.6,
            marginTop: '26px',
            marginBottom: 0,
          }}
        >
          <T
            hi="यह एक अनुमान है, ऋण की स्वीकृति नहीं। अंतिम निर्णय बैंक या चैनलाइज़िंग एजेंसी का होगा।"
            en="This is an estimate, not a loan approval. The final decision rests with the bank or channelizing agency."
          />
        </p>
      </div>
    </DesktopShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: '16px',
        padding: '9px 0',
        borderBottom: '1px solid var(--line-soft)',
        fontSize: '14.5px',
      }}
    >
      <div style={{ color: 'var(--muted)' }}>{k}</div>
      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</div>
    </div>
  );
}
