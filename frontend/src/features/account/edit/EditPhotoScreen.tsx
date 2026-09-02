'use client';

import React, { useRef, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { Header, Primary, Secondary, T, useT } from '@/components';
import { toSquareDataUrl } from '@/lib/photo';

/**
 * Pick or remove the profile picture. A full screen rather than a sheet because
 * the preview needs the room. Purpose-built for an existing account - nothing
 * here is shared with the first-run flow.
 */
export default function EditPhotoScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const file = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(s.photo);
  const [error, setError] = useState<string | null>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setError(null);
    try {
      setDraft(await toSquareDataUrl(f));
    } catch {
      setError(
        t('यह फ़ाइल पढ़ी नहीं जा सकी — कोई फ़ोटो चुनिए', 'Could not read that file — please pick a photo'),
      );
    }
  };

  const save = () => {
    set({ photo: draft });
    nav.back();
  };

  return (
    <div className="dc-phone">
      <Header
        onBack={() => nav.back()}
        title={<T hi="फ़ोटो बदलिए" en="Change photo" />}
        sub={<T hi="बीच का हिस्सा गोल तस्वीर में दिखेगा" en="The centre of the picture is what shows" />}
      />

      <div
        style={{
          flex: 1,
          padding: '20px 18px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '184px',
            height: '184px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: draft ? 'var(--panel)' : 'var(--navy-tint)',
            border: '2px solid var(--line)',
            boxShadow: 'var(--e2)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--navy-dark)',
            fontSize: '64px',
            fontWeight: 700,
            flex: 'none',
          }}
        >
          {draft ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft}
              alt={t('आपकी फ़ोटो', 'Your photo')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            s.name.trim().charAt(0).toUpperCase() || '?'
          )}
        </div>

        <div style={{ minHeight: '18px', fontSize: '12px', color: 'var(--rust)' }}>{error}</div>

        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          aria-label={t('फ़ोटो चुनिए', 'Choose a photo')}
          onChange={(e) => pick(e.target.files?.[0])}
        />

        <div
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}
        >
          <Secondary onClick={() => file.current?.click()}>
            <T hi="फ़ोटो चुनिए" en="Choose a photo" />
          </Secondary>
          {draft ? (
            <Secondary onClick={() => setDraft(null)}>
              <T hi="फ़ोटो हटाइए" en="Remove photo" />
            </Secondary>
          ) : null}
          <Primary onClick={save} disabled={draft === s.photo}>
            <T hi="सहेजिए" en="Save" />
          </Primary>
        </div>
      </div>
    </div>
  );
}
