'use client';
import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { label } from '@/domain/feasibility';
import type { Bilingual } from '@/types';
import { Header, T } from '@/components';

type Quad = {
  key: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  hi: string; en: string;
  color: string; bg: string; line: string;
};

const QUADS: Quad[] = [
  { key: 'strengths',     hi: 'मज़बूती', en: 'Strengths',     color: 'var(--green)', bg: 'var(--green-tint)', line: 'var(--green-line)' },
  { key: 'weaknesses',    hi: 'कमज़ोरी', en: 'Weaknesses',    color: 'var(--amber)', bg: 'var(--amber-tint)', line: 'var(--amber-line)' },
  { key: 'opportunities', hi: 'मौका',    en: 'Opportunities', color: 'var(--navy)',  bg: 'var(--navy-tint)',  line: '#B9D2EE' },
  { key: 'threats',       hi: 'जोखिम',   en: 'Threats',       color: 'var(--rust)',  bg: 'var(--rust-tint)',  line: '#E4C4BA' },
];

export default function SwotScreen() {
  const { s } = useSession();
  const nav = useNav();
  const { report } = useCase();
  const [open, setOpen] = useState<Quad['key']>('strengths');
  if (!report) return null;

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('report')} title={<T hi="मज़बूती और जोखिम" en="Strengths & risks" />} />

      <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center' }}>
          <T hi="किसी भी हिस्से को दबाकर खोलिए" en="Tap any section to open it" />
        </div>
        {QUADS.map((q) => {
          const items: Bilingual[] = report.swot[q.key];
          const isOpen = open === q.key;
          return (
            <div key={q.key} style={{ background: q.bg, border: `${isOpen ? 1.5 : 1}px solid ${isOpen ? q.color : q.line}`, borderRadius: '14px', boxShadow: isOpen ? 'var(--e2)' : 'var(--e1)' }}>
              <button
                onClick={() => setOpen(q.key)}
                aria-expanded={isOpen}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer', padding: '12px 13px', display: 'flex', alignItems: 'center', gap: '11px', minHeight: '52px' }}
              >
                <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: q.color, flex: 'none' }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: q.color }}>
                    <T hi={q.hi} en={q.en} />
                  </span>
                  {!isOpen && items[0] ? (
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text)', marginTop: '1px', lineHeight: 1.35 }}>
                      {label(items[0], s.lang)}
                    </span>
                  ) : null}
                </span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: q.color, background: '#fff', border: `1px solid ${q.line}`, borderRadius: '20px', padding: '2px 8px', flex: 'none' }}>
                  {items.length}
                </span>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: isOpen ? q.color : '#fff', display: 'grid', placeItems: 'center', color: isOpen ? '#fff' : q.color, flex: 'none', border: isOpen ? 0 : `1px solid ${q.line}` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d={isOpen ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
                  </svg>
                </span>
              </button>

              {isOpen ? (
                <div style={{ padding: '0 13px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', background: '#fff', borderRadius: '9px', padding: '9px 10px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: q.color, marginTop: '5px', flex: 'none' }} />
                      <div style={{ fontSize: '12px', lineHeight: 1.45, color: 'var(--text)' }}>{label(it, s.lang)}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
