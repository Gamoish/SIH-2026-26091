'use client';
import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav, useStartCheck } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { isGap } from '@/domain/finance';
import { label } from '@/domain/feasibility';
import { inr } from '@/lib/format';
import { Dock, ICON, Primary, Row, T } from '@/components';

export default function HomeScreen() {
  const { s } = useSession();
  const nav = useNav();
  const startCheck = useStartCheck();
  const { report, plan } = useCase();
  const done = s.savedAt != null && report != null;
  const money = plan && !isGap(plan) ? plan : null;

  return (
    <div className="dc-phone">
      <div style={{ background: 'var(--navy)', color: '#fff', flex: 'none', padding: '16px 18px 14px' }}>
        <div style={{ fontSize: '12px', color: '#9FB6D3' }}>
          <T hi="नमस्ते" en="Hello" />
        </div>
        <div style={{ fontSize: '19px', fontWeight: 700 }}>{s.name || `+91 ${s.phone}`}</div>
      </div>

      <div
        style={{ flex: 1, padding: '13px 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {done && report ? (
          <button
            onClick={() => nav.go('feasibility')}
            style={{
              width: '100%',
              textAlign: 'left',
              background: '#fff',
              border: '2px solid var(--navy)',
              borderRadius: '15px',
              padding: '13px 15px',
              boxShadow: '0 0 0 4px var(--navy-tint),var(--e2)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                <T hi="आपकी पिछली जाँच" en="Your last check" />
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: '#8A4E06',
                  background: 'var(--saffron-tint)',
                  borderRadius: '20px',
                  padding: '2px 8px',
                }}
              >
                <T hi="बैंक को दिखाना बाक़ी" en="Ready for the bank" />
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>
              {label(report.business.name, s.lang)} · {label(report.village.name, s.lang)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '9px' }}>
              <div style={{ fontSize: '30px', fontWeight: 700, color: 'var(--navy-dark)' }}>
                {report.score}
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>/100</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.4 }}>
                {money ? (
                  `${money.scheme.code} · ${inr(money.loanAmount)}`
                ) : (
                  <T hi="ऋण आँकड़े लंबित" en="Loan figures pending" />
                )}
              </div>
            </div>
          </button>
        ) : (
          <div
            style={{
              background: 'var(--panel)',
              border: '1px dashed var(--line)',
              borderRadius: '15px',
              padding: '22px 16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                background: 'var(--navy-tint)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 12px',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--navy)"
                strokeWidth="2"
              >
                {ICON.doc}
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>
              <T hi="आपने अभी कोई जाँच पूरी नहीं की" en="You haven't finished a check yet" />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '5px', lineHeight: 1.55 }}>
              <T
                hi="अपना कारोबार बताइए — हम बताएँगे कि यह यहाँ कितना चलेगा"
                en="Tell us your business — we'll tell you how well it works here"
              />
            </div>
          </div>
        )}

        <Primary onClick={startCheck}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            {ICON.add}
          </svg>
          <T
            hi={done ? 'नई जाँच शुरू करें' : 'पहली जाँच शुरू करें'}
            en={done ? 'Start a new check' : 'Start your first check'}
          />
        </Primary>

        {done ? (
          <Row
            onClick={() => nav.go('share')}
            iconBg="var(--teal-tint)"
            icon={
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--teal)"
                strokeWidth="2.2"
              >
                {ICON.doc}
              </svg>
            }
            title={<T hi="बैंक वाला सारांश" en="The bank summary" />}
            sub={new Date(s.savedAt!).toLocaleDateString(s.lang === 'en' ? 'en-IN' : 'hi-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
        ) : null}

        <Row
          onClick={() => nav.go('saved')}
          icon={
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--muted)"
              strokeWidth="2.2"
            >
              {ICON.home}
            </svg>
          }
          title={<T hi="आपके सभी आवेदन" en="All your applications" />}
          sub={<T hi={`${done ? 1 : 0} आवेदन`} en={`${done ? 1 : 0} application`} />}
        />

        <Dock active="home" />
      </div>
    </div>
  );
}
