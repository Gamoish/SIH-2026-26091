'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav, useStartCheck } from '@/lib/nav';
import { api, ApiError, type Application } from '@/lib/api';
import { Primary, T } from '@/components';
import { DesktopShell, Legend } from '../shell';

type State =
  { at: 'loading' } | { at: 'ready'; rows: Application[] } | { at: 'error'; code: string; status: number };

/**
 * D-P9. The applications this account has filed.
 *
 * Every field here comes off the row the endpoint sends. The score, business
 * and village are read out of the stored `feasibility_report` - the report as
 * it was when the case was filed, not one recomputed now, which could differ
 * from what the applicant actually submitted. A row filed before that JSON was
 * stored simply shows less. The canvas's "In review" state is still not shown:
 * the status enum is `draft | complete` and there is no review stage to report.
 */
export default function SavedScreen() {
  const { s } = useSession();
  const nav = useNav();
  const startCheck = useStartCheck();
  const [state, setState] = useState<State>({ at: 'loading' });

  useEffect(() => {
    let live = true;
    api
      .applications()
      .then((r) => live && setState({ at: 'ready', rows: r.applications }))
      .catch((e: unknown) => {
        if (!live) return;
        const err = e instanceof ApiError ? e : null;
        setState({ at: 'error', code: err?.code ?? 'request_failed', status: err?.status ?? 0 });
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <DesktopShell
      padding="36px 44px"
      title={<T hi="आपके आवेदन" en="Your applications" />}
      actions={
        <button
          onClick={startCheck}
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
          <T hi="नई जाँच जोड़ें" en="Add a new check" />
        </button>
      }
    >
      <Legend>
        <T hi="अब तक भेजे गए" en="Filed so far" />
      </Legend>

      {state.at === 'loading' ? (
        <Note>
          <T hi="आपके आवेदन लाए जा रहे हैं…" en="Fetching your applications…" />
        </Note>
      ) : null}

      {state.at === 'error' ? <ErrorNote code={state.code} status={state.status} nav={nav} /> : null}

      {state.at === 'ready' && state.rows.length === 0 ? (
        <Note>
          <T
            hi="अभी कोई आवेदन नहीं भेजा गया। जाँच पूरी करके इसे यहाँ सहेजिए।"
            en="No applications filed yet. Finish a check and save it to see it here."
          />
          <div style={{ maxWidth: '260px', marginTop: '18px' }}>
            <Primary onClick={startCheck} arrow>
              <T hi="जाँच शुरू कीजिए" en="Start a check" />
            </Primary>
          </div>
        </Note>
      ) : null}

      {state.at === 'ready' && state.rows.length > 0 ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          {state.rows.map((a) => (
            <Row key={a.id} app={a} lang={s.lang} />
          ))}
        </div>
      ) : null}
    </DesktopShell>
  );
}

/**
 * Pull the display fields out of a stored report. It is `unknown` by type and
 * jsonb by column, and rows filed by an older build may hold a different shape,
 * so every field is optional and nothing here throws.
 */
function storedReport(report: unknown, lang: 'hi' | 'en') {
  if (!report || typeof report !== 'object') return null;
  const r = report as {
    score?: unknown;
    business?: { name?: Record<string, string> };
    village?: { name?: Record<string, string>; block?: unknown };
  };
  const pick = (v: Record<string, string> | undefined) =>
    v && typeof v[lang] === 'string' ? v[lang] : undefined;
  return {
    score: typeof r.score === 'number' ? r.score : undefined,
    business: pick(r.business?.name),
    village: pick(r.village?.name),
    block: typeof r.village?.block === 'string' ? r.village.block : undefined,
  };
}

function Row({ app, lang }: { app: Application; lang: 'hi' | 'en' }) {
  const done = app.status === 'complete';
  const saved = storedReport(app.feasibility_report, lang);
  const filed = new Date(app.created_at);
  const when = Number.isNaN(filed.getTime())
    ? null
    : filed.toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  return (
    <div
      className="dc-desk-card"
      style={{ padding: '22px 26px', display: 'flex', alignItems: 'center', gap: '22px' }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '12px',
          background: done ? 'var(--teal-tint)' : 'var(--panel)',
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={done ? 'var(--teal)' : 'var(--faint)'}
          strokeWidth="2"
        >
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '15.5px', fontWeight: 700 }}>
          {saved?.business ?? (
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{app.id.slice(0, 8)}</span>
          )}
        </div>
        <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginTop: '3px' }}>
          {saved?.village ? (
            <>
              {saved.village}
              {saved.block ? `, ${saved.block}` : ''}
              {' · '}
            </>
          ) : null}
          {when}
          {app.financial_roadmap ? (
            <>
              {' · '}
              <T hi="वापसी योजना संलग्न" en="repayment plan attached" />
            </>
          ) : null}
        </div>
      </div>

      {saved?.score != null ? (
        <div style={{ textAlign: 'right', flex: 'none' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-dark)' }}>
            {saved.score}
            <span style={{ fontSize: '12px', color: 'var(--faint)', fontWeight: 600 }}> / 100</span>
          </div>
        </div>
      ) : null}

      <span
        style={{
          fontSize: '12.5px',
          fontWeight: 700,
          padding: '7px 16px',
          borderRadius: '20px',
          flex: 'none',
          background: done ? 'var(--green-tint)' : 'var(--panel)',
          color: done ? '#0E6234' : 'var(--faint)',
        }}
      >
        {done ? <T hi="पूरा" en="Complete" /> : <T hi="ड्राफ़्ट" en="Draft" />}
      </span>
    </div>
  );
}

function ErrorNote({ code, status, nav }: { code: string; status: number; nav: ReturnType<typeof useNav> }) {
  if (status === 401 || code === 'unauthorized')
    return (
      <Note>
        <T
          hi="आपके आवेदन देखने के लिए पहले फ़ोन नंबर से लॉगिन कीजिए।"
          en="Log in with your phone number to see your applications."
        />
        <div style={{ maxWidth: '220px', marginTop: '18px' }}>
          <Primary onClick={() => nav.go('phone')}>
            <T hi="लॉगिन कीजिए" en="Log in" />
          </Primary>
        </div>
      </Note>
    );

  if (code === 'network_unreachable')
    return (
      <Note>
        <T
          hi="सर्वर से संपर्क नहीं हो पा रहा। इंटरनेट जाँचिए और फिर कोशिश कीजिए।"
          en="Can't reach the server. Check your connection and try again."
        />
      </Note>
    );

  return (
    <Note>
      <T hi="आवेदन नहीं लाए जा सके।" en="Couldn't load your applications." /> <code>{code}</code>
    </Note>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="dc-desk-card"
      style={{ padding: '30px 32px', fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7 }}
    >
      {children}
    </div>
  );
}
