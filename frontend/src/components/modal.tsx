'use client';

import React, { useEffect, useRef } from 'react';

/**
 * A large centred dialog, used by the desktop report to open its detail views
 * in place instead of navigating away.
 *
 * Built on the native <dialog> element deliberately. `showModal()` gives focus
 * trapping, Esc-to-close, top-layer stacking above every z-index on the page,
 * and inertness of the content behind - all of which a div-based overlay has
 * to reimplement badly. The only thing added here is closing on a backdrop
 * click, which the platform does not do on its own.
 *
 * Desktop only. The phone layout keeps its full-screen routes: a modal on a
 * 360px viewport is just a screen with the back button hidden.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // showModal() throws if the dialog is already open, and close() on an
    // already-closed dialog fires a spurious `close` event, so both are
    // guarded on the element's own state rather than on React's.
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className="dc-modal"
      // Fires on Esc as well as close(); routing it through onClose keeps the
      // parent's state the single source of truth for what is open.
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click landing on the dialog itself is the backdrop: the panel's
        // own content sits in the children below and stops the event there.
        if (e.target === ref.current) onClose();
      }}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className="dc-modal-head">
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'var(--serif)',
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--navy-dark)',
          }}
        >
          {title}
        </div>
        <button className="dc-modal-x" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="dc-modal-body">{children}</div>
    </dialog>
  );
}
