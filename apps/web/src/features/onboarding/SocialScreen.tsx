'use client';
import React, { useState } from 'react';
import { useSession, type SocialCategory } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { SCHEMES } from '@/domain/schemes';
import { Header, Primary, T, useT } from '@/components';

const CATEGORIES: { id: SocialCategory; hi: string; en: string; noteHi: string; noteEn: string }[] = [
  { id: 'SC', hi: 'अनुसूचित जाति', en: 'Scheduled Caste', noteHi: 'SC', noteEn: 'SC' },
  { id: 'ST', hi: 'अनुसूचित जनजाति', en: 'Scheduled Tribe', noteHi: 'ST', noteEn: 'ST' },
  { id: 'OBC', hi: 'अन्य पिछड़ा वर्ग', en: 'Other Backward Class', noteHi: 'OBC', noteEn: 'OBC' },
  { id: 'GEN', hi: 'सामान्य', en: 'General', noteHi: 'इनमें से कोई नहीं', noteEn: 'none of these' },
];

function routeNote(id: SocialCategory) {
  const scheme = SCHEMES.find((s) => s.eligible.includes(id));
  if (!scheme) return null;
  return scheme.code;
}

export default function SocialScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const [name, setName] = useState(s.name);
  const [social, setSocial] = useState<SocialCategory | null>(s.social);

  const editing = s.savedAt != null;

  const submit = () => {
    if (!social || !name.trim()) return;
    set({ name: name.trim(), social });
    nav.go(editing ? 'home' : 'location');
  };

  return (
    <div className="dc-phone">
      <Header
        onBack={() => nav.go('phone')}
        title={<T hi="आपके बारे में" en="About you" />}
        sub={
          <T
            hi="इससे तय होता है कि कौन सी सरकारी योजना लागू होगी"
            en="This decides which government scheme applies"
          />
        }
      />

      <div
        style={{ flex: 1, padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '6px' }}>
            <T hi="आपका नाम" en="Your name" />
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('जैसे — सुरेश खरवार', 'e.g. Suresh Kharwar')}
            autoComplete="name"
            style={{
              width: '100%',
              border: '2px solid var(--navy)',
              borderRadius: '13px',
              padding: '14px 15px',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: 'var(--sans)',
              color: 'var(--text)',
              background: '#fff',
              boxShadow: '0 0 0 3px var(--navy-tint)',
              outline: 'none',
            }}
          />
        </label>

        <div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '8px' }}>
            <T hi="आपका वर्ग" en="Your category" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {CATEGORIES.map((c) => {
              const on = social === c.id;
              const route = routeNote(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setSocial(c.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    minHeight: '58px',
                    padding: '11px 14px',
                    borderRadius: '13px',
                    cursor: 'pointer',
                    background: on ? 'var(--navy-tint)' : '#fff',
                    border: on ? '2px solid var(--navy)' : '1px solid var(--line)',
                    boxShadow: on ? '0 0 0 3px rgba(18,59,109,.10)' : 'var(--e1)',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      flex: 'none',
                      border: on ? '6px solid var(--navy)' : '2px solid var(--line)',
                      background: '#fff',
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '14.5px',
                        fontWeight: 600,
                        color: on ? 'var(--navy-dark)' : 'var(--text)',
                      }}
                    >
                      <T hi={c.hi} en={c.en} />
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                      <T hi={c.noteHi} en={c.noteEn} />
                    </span>
                  </span>
                  {route ? (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: 'var(--teal)',
                        background: 'var(--teal-tint)',
                        borderRadius: '20px',
                        padding: '3px 9px',
                        flex: 'none',
                      }}
                    >
                      {route}
                    </span>
                  ) : (
                    <span style={{ fontSize: '10.5px', color: 'var(--faint)', flex: 'none' }}>
                      <T hi="कोई योजना नहीं" en="no scheme" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {social === 'GEN' ? (
          <div
            style={{
              fontSize: '11.5px',
              lineHeight: 1.55,
              color: '#8A4E06',
              background: 'var(--saffron-tint)',
              borderRadius: '10px',
              padding: '10px 12px',
            }}
          >
            <T
              hi="ये तीनों योजनाएँ SC, ST और OBC वर्ग के लिए हैं। व्यवहार्यता रिपोर्ट फिर भी बनेगी, पर ऋण का हिस्सा लागू नहीं होगा।"
              en="These three schemes serve SC, ST and OBC applicants. The feasibility report still works, but the loan section will not apply."
            />
          </div>
        ) : null}

        <Primary
          onClick={submit}
          disabled={!social || !name.trim()}
          arrow={!editing}
          style={{ marginTop: 'auto' }}
        >
          {editing ? <T hi="सहेजिए" en="Save" /> : <T hi="आगे · जगह बताइए" en="Next · your location" />}
        </Primary>
      </div>
    </div>
  );
}
