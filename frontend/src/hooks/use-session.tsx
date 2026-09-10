'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { useHydrated } from './use-hydrated';
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
  reportAt: null,
};

const KEY = 'udyam.session.v1';

/**
 * localStorage is the store; React subscribes to it.
 *
 * This used to be `useState(EMPTY)` plus an effect that read localStorage and
 * called setState. That is the shape `react-hooks/set-state-in-effect` warns
 * about, and the warning is right: it renders the empty session first and the
 * real one a pass later. A lazy initialiser cannot replace it either, because
 * this provider wraps the whole app and does render on the server, where
 * localStorage does not exist - the client would then hydrate against markup
 * built from a different session.
 *
 * `useSyncExternalStore` is the supported answer: `getServerSnapshot` returns
 * EMPTY so the server and the hydrating client agree, and the real value is
 * adopted immediately afterwards.
 */
let cache: Session | null = null;
const listeners = new Set<() => void>();

/** Cached because getSnapshot must return a stable reference or React re-renders forever. */
function read(): Session {
  if (cache !== null) return cache;
  let loaded: Session = EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) loaded = { ...EMPTY, ...JSON.parse(raw) };
  } catch {}
  cache = loaded;
  return loaded;
}

/**
 * Written straight through to localStorage rather than from an effect. An effect
 * needs a render to flush, and a full page navigation inside that window throws
 * the change away - which is how a filed application lost its `savedAt` marker
 * and got filed a second time on the next visit.
 */
function write(next: Session): void {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSnapshot = () => EMPTY;

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
  const s = useSyncExternalStore(subscribe, read, serverSnapshot);
  const ready = useHydrated();

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute('data-lang', s.lang);
  }, [s.lang, ready]);

  const set = useCallback((patch: Partial<Session>) => write({ ...read(), ...patch }), []);
  const reset = useCallback(() => write(EMPTY), []);
  const value = useMemo(() => ({ s, set, reset, ready }), [s, set, reset, ready]);

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
