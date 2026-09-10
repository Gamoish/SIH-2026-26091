'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav, useStartCheck } from '@/lib/nav';
import { api, ApiError, type Application } from '@/lib/api';
import { fileCounts, sortByFiled, type SortOrder } from '@/lib/applications';
import { Action, Icon, Pill, Primary, Stat, T, useT, verdictTone, type Verdict } from '@/components';
import { DesktopShell, Legend, ScreenHead } from '../shell';

type State =
  { at: 'loading' } | { at: 'ready'; rows: Application[] } | { at: 'error'; code: string; status: number };

/**
 * D-P9. The applications this account has filed.
 *
 * Every field here comes off the row the endpoint sends. The score, business
 * and village are read out of the stored `feasibility_report` - the report as
 * it was when the case was filed, not one recomputed now, which could differ
 * from what the applicant actually submitted. A row filed before that JSON was
 * stored simply shows less.
 *
 * Two things this screen deliberately does NOT show:
 *
 *   - an "In review" state. The status enum is `draft | complete`, in the
 *     column check (migration 001) and in the route's zod schema alike, so
 *     there is no review stage to report and inventing one would be a badge
 *     the database can never produce.
 *   - a progress bar. The phone list draws one and fills it from the score,
 *     which reads as "this application is 72% filed" when the number rates the
 *     business idea and says nothing about how far the paperwork has got. Here
 *     the two are separate elements: a status badge for the row's `status`,
 *     and the score beside the tags as a plain labelled figure.
 *
 * The list arrives newest-first from the server (`ORDER BY created_at DESC`),
 * which is what the note under the legend states.
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

  const [order, setOrder] = useState<SortOrder>('newest');

  /**
   * The one moment this page animates, and it answers a press rather than a
   * page load. Starting a check is a route change that has to fetch and
   * re-guard before anything moves, so without this the button looked ignored
   * for that beat. Both doors to the same action share the flag, so pressing
   * one visibly settles the other too.
   */
  const [starting, setStarting] = useState(false);
  const begin = () => {
    setStarting(true);
    startCheck();
  };

  const rows = state.at === 'ready' ? state.rows : [];
  const n = fileCounts(rows);

  return (
    <DesktopShell padding="36px 44px">
      <ScreenHead
        title={<T hi="आपके आवेदन" en="Your applications" />}
        sub={<T hi="अब तक भेजी गई हर जाँच" en="Every check you have filed so far" />}
        actions={<AddCheck onClick={begin} busy={starting} />}
      />

      {rows.length > 0 ? (
        /* A row of tiles sized to what they say, not three panels stretched
           across 1130px with the figure alone in the left sixth of each. They
           wrap rather than shrink, so a narrow body drops one to the next line
           instead of squeezing all three. */
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
          <Stat
            tone="navy"
            size="sm"
            icon={<Icon name="filed" size={19} />}
            label={<T hi="भेजे गए" en="Filed" />}
            value={<span data-testid="count-filed">{n.filed}</span>}
            sub={<T hi="अब तक भेजे गए कुल आवेदन" en="Total applications submitted" />}
          />
          <Stat
            tone="green"
            size="sm"
            icon={<Icon name="complete" size={19} />}
            label={<T hi="पूरे" en="Completed" />}
            value={<span data-testid="count-complete">{n.complete}</span>}
            sub={<T hi="पूरी जाँच के साथ दाख़िल" en="Filed with the check finished" />}
          />
          <Stat
            tone="amber"
            size="sm"
            icon={<Icon name="pending" size={19} />}
            label={<T hi="बाक़ी" en="Pending" />}
            value={<span data-testid="count-pending">{n.pending}</span>}
            sub={<T hi="अभी ड्राफ़्ट में पड़े हैं" en="Still sitting as drafts" />}
          />
        </div>
      ) : null}

      {state.at === 'loading' ? (
        <Note>
          <T hi="आपके आवेदन लाए जा रहे हैं…" en="Fetching your applications…" />
        </Note>
      ) : null}

      {state.at === 'error' ? <ErrorNote code={state.code} status={state.status} nav={nav} /> : null}

      {state.at === 'ready' && rows.length === 0 ? (
        <Note>
          <T
            hi="अभी कोई आवेदन नहीं भेजा गया। जाँच पूरी करके इसे यहाँ सहेजिए।"
            en="No applications filed yet. Finish a check and save it to see it here."
          />
          <div style={{ maxWidth: '260px', marginTop: '18px' }}>
            <Primary onClick={begin} disabled={starting} arrow>
              <T hi="पहली जाँच शुरू कीजिए" en="Start your first check" />
            </Primary>
          </div>
        </Note>
      ) : null}

      {rows.length > 0 ? (
        <>
          <Legend>
            <T hi="भेजे गए आवेदन" en="Filed applications" />
          </Legend>
          <SortPicker value={order} onChange={setOrder} />
          <div style={{ display: 'grid', gap: '16px' }}>
            {sortByFiled(rows, order).map((a) => (
              <Row key={a.id} app={a} lang={s.lang} />
            ))}
          </div>
          <AddAnother onClick={begin} busy={starting} />
        </>
      ) : null}
    </DesktopShell>
  );
}

/**
 * How the list is ordered.
 *
 * This was a line of static text reading "Newest first" - true, because the
 * endpoint sends `ORDER BY created_at DESC`, but a claim the reader could not
 * act on. It is now the control it looked like, over the same real filed
 * dates: `sortByFiled` re-sorts the fetched rows by `created_at`.
 *
 * A native <select>. The options are two, the value is one of them, and the
 * browser already gives it a keyboard, a screen-reader role and a touch
 * picker - all of which a div-and-popover would have to rebuild to be no
 * better.
 */
function SortPicker({ value, onChange }: { value: SortOrder; onChange: (v: SortOrder) => void }) {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '-8px 0 16px' }}>
      <label htmlFor="apps-sort" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
        {t('क्रम', 'Sort')}
      </label>
      <select
        id="apps-sort"
        data-testid="apps-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOrder)}
        style={{
          fontFamily: 'var(--sans)',
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'var(--text)',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '5px 9px',
          cursor: 'pointer',
        }}
      >
        <option value="newest">{t('नए पहले', 'Newest first')}</option>
        <option value="oldest">{t('पुराने पहले', 'Oldest first')}</option>
      </select>
    </div>
  );
}

/** The head's action. Same handler as the dashboard's "Start a new check"
 *  panel - `useStartCheck` clears `savedAt` and walks back to the location
 *  question, and there is one implementation of that behind both doors.
 *
 *  The shared inline button rather than its own saffron rectangle: this used
 *  to draw a fill at its own radius and type size, which was a fourth primary
 *  button on a four-page app. */
function AddCheck({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <Action
      tone="primary"
      onClick={onClick}
      busy={busy}
      testId="start-check"
      icon={<Icon name="add" size={16} />}
    >
      {busy ? <T hi="शुरू हो रही है…" en="Starting…" /> : <T hi="नई जाँच शुरू करें" en="Start a new check" />}
    </Action>
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
    verdict?: unknown;
    business?: { name?: Record<string, string> };
    village?: { name?: Record<string, string>; block?: unknown };
  };
  const pick = (v: Record<string, string> | undefined) =>
    v && typeof v[lang] === 'string' ? v[lang] : undefined;
  return {
    score: typeof r.score === 'number' ? r.score : undefined,
    verdict: (r.verdict === 'good' || r.verdict === 'check' ? r.verdict : undefined) as Verdict | undefined,
    business: pick(r.business?.name),
    village: pick(r.village?.name),
    block: typeof r.village?.block === 'string' ? r.village.block : undefined,
  };
}

/** The scheme the stored roadmap was written against, when it names one. A
 *  filed `PlanGap` carries `scheme: null`, so this is often absent. */
function storedScheme(roadmap: unknown) {
  if (!roadmap || typeof roadmap !== 'object') return undefined;
  const code = (roadmap as { scheme?: { code?: unknown } }).scheme?.code;
  return typeof code === 'string' ? code : undefined;
}

function Row({ app, lang }: { app: Application; lang: 'hi' | 'en' }) {
  const done = app.status === 'complete';
  const saved = storedReport(app.feasibility_report, lang);
  const scheme = storedScheme(app.financial_roadmap);
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
      data-testid="application-row"
      style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}
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
        <span style={{ color: done ? 'var(--teal)' : 'var(--faint)', display: 'grid' }}>
          <Icon name="filed" size={24} />
        </span>
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
          {/* Only when a roadmap was actually filed alongside the row. */}
          {app.financial_roadmap ? (
            <>
              {' · '}
              <T hi="वापसी योजना संलग्न" en="repayment plan attached" />
            </>
          ) : null}
        </div>

        <div
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '9px' }}
        >
          {saved?.verdict ? (
            <Pill tone={verdictTone(saved.verdict)}>
              {saved.verdict === 'good' ? (
                <T hi="अच्छा मौका" en="Good opportunity" />
              ) : (
                <T hi="पहले जाँच लीजिए" en="Worth checking first" />
              )}
            </Pill>
          ) : null}
          {scheme ? <Pill>{scheme}</Pill> : null}

          {/* The feasibility score, beside the tags and plainly labelled: it
              rates the business idea, it is not progress toward filing. The
              badge on the right is the only thing that says how far this row
              has actually got. */}
          {saved?.score != null ? (
            <span
              data-testid="application-score"
              style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}
            >
              <T hi="व्यवहार्यता अंक" en="Feasibility score" />{' '}
              <span style={{ color: 'var(--navy-dark)', fontWeight: 700 }}>{saved.score}</span>
              <span style={{ color: 'var(--faint)' }}> / 100</span>
            </span>
          ) : null}
        </div>
      </div>

      <span data-testid="application-status">
        <Pill tone={done ? 'good' : 'quiet'}>
          {done ? <T hi="पूरा" en="Complete" /> : <T hi="ड्राफ़्ट" en="Draft" />}
        </Pill>
      </span>
    </div>
  );
}

/** Below the list: the same start-a-check action the head offers, phrased for
 *  someone who has already filed one. */
function AddAnother({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  const t = useT();
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-busy={busy || undefined}
      className="rowh dc-desk-card press"
      style={{
        opacity: busy ? 0.72 : 1,
        marginTop: '20px',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'var(--sans)',
        border: '2px dashed var(--navy-tint)',
        background: 'var(--navy-tint2)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
      }}
    >
      <span
        aria-hidden
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: '#fff',
          border: '1px solid var(--navy-tint)',
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
        }}
      >
        <span style={{ color: 'var(--navy)', display: 'grid' }}>
          <Icon name="add" size={22} />
        </span>
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '15.5px', fontWeight: 700, color: 'var(--navy-dark)' }}>
          {busy ? t('शुरू हो रही है…', 'Starting…') : t('नई जाँच शुरू करें', 'Start a new check')}
        </span>
        <span style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginTop: '3px' }}>
          {t(
            'दूसरा गाँव, दूसरा कारोबार या दूसरी पूँजी परखिए',
            'Try another village, business or amount of capital',
          )}
        </span>
      </span>
    </button>
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
