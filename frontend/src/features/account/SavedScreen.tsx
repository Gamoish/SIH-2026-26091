'use client';
import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav, useStartCheck } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { isGap } from '@/domain/finance';
import { label } from '@/domain/feasibility';
import { Dock, Header, T } from '@/components';

export default function SavedScreen() {
  const { s } = useSession();
  const nav = useNav();
  const startCheck = useStartCheck();
  const { report, plan } = useCase();
  const money = plan && !isGap(plan) ? plan : null;

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('home')} title={<T hi="आपके आवेदन" en="Your applications" />} />

      <div
        style={{ flex: 1, padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '11px' }}
      >
        {report ? (
          <button
            onClick={() => nav.go(s.savedAt ? 'share' : 'feasibility')}
            style={{
              width: '100%',
              textAlign: 'left',
              background: '#fff',
              border: '2px solid var(--navy)',
              borderRadius: '14px',
              padding: '13px 14px',
              boxShadow: '0 0 0 3px var(--navy-tint),var(--e1)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{label(report.business.name, s.lang)}</span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  borderRadius: '20px',
                  padding: '2px 8px',
                  color: s.savedAt ? '#0E6234' : '#8A4E06',
                  background: s.savedAt ? 'var(--green-tint)' : 'var(--saffron-tint)',
                }}
              >
                {s.savedAt ? <T hi="पूरा" en="Complete" /> : <T hi="चल रहा" en="In progress" />}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              {label(report.village.name, s.lang)} · {report.village.block} · Sonbhadra
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--navy-dark)' }}>
                  {report.score}
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--faint)' }}>
                  <T hi="स्कोर" en="Score" />
                </div>
              </div>
              <div>
                <div
                  style={{ fontSize: '15px', fontWeight: 700, color: money ? 'var(--teal)' : 'var(--faint)' }}
                >
                  {money ? money.scheme.code : '—'}
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--faint)' }}>
                  <T hi="योजना" en="Scheme" />
                </div>
              </div>
              {s.savedAt ? (
                <div style={{ marginLeft: 'auto', fontSize: '10.5px', color: 'var(--muted)' }}>
                  {new Date(s.savedAt).toLocaleDateString(s.lang === 'en' ? 'en-IN' : 'hi-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              ) : null}
            </div>
          </button>
        ) : (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--muted)',
              textAlign: 'center',
              padding: '28px 12px',
              lineHeight: 1.6,
            }}
          >
            <T
              hi="अभी कोई आवेदन नहीं। नीचे से नई जाँच शुरू कीजिए।"
              en="No applications yet. Start a new check below."
            />
          </div>
        )}

        <button
          onClick={startCheck}
          style={{
            border: '1px dashed var(--line)',
            borderRadius: '14px',
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--faint)',
            background: 'transparent',
            cursor: 'pointer',
            minHeight: '80px',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
            <T hi="नई जाँच जोड़ें" en="Add a new check" />
          </span>
        </button>
      </div>

      <Dock active="saved" />
    </div>
  );
}
