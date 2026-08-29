'use client';

import { useLang } from '@/hooks/use-session';

export { useLang } from '@/hooks/use-session';
export type { Lang } from '@/hooks/use-session';

export function LangToggle() {
  const { lang, setLang } = useLang();
  const pill = (active: boolean) => ({
    border: 0,
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
    fontWeight: 600,
    padding: '7px 13px',
    borderRadius: '6px',
    background: active ? '#fff' : 'transparent',
    color: active ? 'var(--navy-dark)' : '#9FB6D3',
    boxShadow: active ? '0 1px 2px rgba(15,52,98,.25)' : 'none',
  });
  return (
    <div
      style={{
        position: 'fixed',
        right: '10px',
        top: '10px',
        zIndex: 50,
        display: 'flex',
        background: 'var(--navy)',
        borderRadius: '9px',
        padding: '3px',
        gap: '2px',
        boxShadow: 'var(--e2)',
      }}
    >
      <button onClick={() => setLang('en')} style={{ ...pill(lang === 'en'), fontSize: '12px' }} aria-label="English">
        EN
      </button>
      <button onClick={() => setLang('hi')} style={{ ...pill(lang === 'hi'), fontSize: '13px' }} aria-label="हिंदी">
        हिं
      </button>
    </div>
  );
}
