'use client';

import { useLang } from '@/hooks/use-session';

export function T({ hi, en }: { hi: string; en: string }) {
  return (
    <>
      <span className="l-hi">{hi}</span>
      <span className="l-en">{en}</span>
    </>
  );
}

export function useT() {
  const { lang } = useLang();
  return (hi: string, en: string) => (lang === 'en' ? en : hi);
}
