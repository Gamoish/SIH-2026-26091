'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Lang, Session } from '@/types';

export type { Lang, Session, SocialCategory, BusinessId } from '@/types';

const EMPTY: Session = {
  lang: 'hi',
  name: '',
  phone: '',
  photo: null,
  verified: false,
  social: null,
  village: null,
  villageLgdCode: null,
  villageName: null,
  tehsil: null,
  radiusKm: 5,
  capital: null,
  business: null,
  savedAt: null,
};

const KEY = 'udyam.session.v1';

type Ctx = {
  s: Session;
  set: (patch: Partial<Session>) => void;
  reset: () => void;
  ready: boolean;
};

const SessionCtx = createContext<Ctx>({ s: EMPTY, set: () => {}, reset: () => {}, ready: false });

export const useSession = () => useContext(SessionCtx);
export const useLang = () => {
  const { s, set } = useSession();
  return { lang: s.lang, setLang: (lang: Lang) => set({ lang }) };
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Session>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute('data-lang', s.lang);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }, [s, ready]);

  const set = useCallback((patch: Partial<Session>) => setS((p) => ({ ...p, ...patch })), []);
  const reset = useCallback(() => setS(EMPTY), []);
  const value = useMemo(() => ({ s, set, reset, ready }), [s, set, reset, ready]);

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
