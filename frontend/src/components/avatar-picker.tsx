'use client';

import React, { useRef, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { toSquareDataUrl } from '@/lib/photo';
import { Avatar } from './avatar';
import { Icon } from './icon';
import { useT } from './bilingual';

/**
 * The profile picture, updatable in place.
 *
 * The phone has a whole screen for this (`/screens/edit-photo`) because a
 * touch target and a preview need the room. On desktop there is a file dialog
 * one click away, so the avatar itself is the control: pick, crop, save. Both
 * write `session.photo` through the same `toSquareDataUrl`, so a photo set on
 * one layout is the same photo on the other.
 */
export function AvatarPicker({
  size = 44,
  onDark = false,
  label,
}: {
  size?: number;
  /** On the navy rail the hint ring has to read against a dark ground. */
  onDark?: boolean;
  label?: React.ReactNode;
}) {
  const { s, set } = useSession();
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setError(false);
    try {
      set({ photo: await toSquareDataUrl(f) });
    } catch {
      setError(true);
    }
  };

  const hint = t('फ़ोटो बदलिए', 'Change photo');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
      <button
        type="button"
        onClick={() => file.current?.click()}
        title={hint}
        aria-label={hint}
        style={{
          position: 'relative',
          padding: 0,
          border: 0,
          background: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          flex: 'none',
          lineHeight: 0,
        }}
      >
        <Avatar photo={s.photo} name={s.name} size={size} />
        {/* a small camera badge, so the avatar reads as something you can act on */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: '-2px',
            bottom: '-2px',
            width: `${Math.round(size * 0.42)}px`,
            height: `${Math.round(size * 0.42)}px`,
            borderRadius: '50%',
            background: 'var(--saffron)',
            border: `2px solid ${onDark ? 'var(--navy-800)' : '#fff'}`,
            display: 'grid',
            placeItems: 'center',
            // the glyph inherits this; it used to be `stroke="#fff"` on a
            // hand-drawn camera at its own stroke weight
            color: '#fff',
          }}
        >
          <Icon name="camera" size={Math.round(size * 0.22)} />
        </span>
      </button>

      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        aria-label={t('फ़ोटो चुनिए', 'Choose a photo')}
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {label}
      {error ? (
        <span style={{ fontSize: '11px', color: 'var(--rust)' }}>
          {t('फ़ोटो पढ़ी नहीं जा सकी', 'Could not read that file')}
        </span>
      ) : null}
    </div>
  );
}
