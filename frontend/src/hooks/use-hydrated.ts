'use client';

import { useSyncExternalStore } from 'react';

/** Nothing to subscribe to: the snapshot flips once, when hydration finishes. */
const neverChanges = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * `false` on the server and throughout hydration, `true` immediately after.
 *
 * This exists for components that must read a browser-only source - localStorage,
 * matchMedia - without tearing hydration. A lazy `useState` initialiser cannot do
 * it: the initialiser also runs on the server, where those APIs do not exist, and
 * even guarded it would produce different markup than the HTML React is hydrating
 * against. `getServerSnapshot` is the supported way to say "this value is
 * deliberately different before and after hydration", and unlike calling setState
 * in an effect it does not cascade an extra render pass.
 *
 * Only for components that actually render on the server. Everything mounted
 * under LayoutReconciler does not, and should use a lazy initialiser instead.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(neverChanges, onClient, onServer);
}
