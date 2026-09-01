'use client';

import React from 'react';

/** The profile picture, or the user's initial when there is no photo yet. */
export function Avatar({ photo, name, size = 44 }: { photo: string | null; name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div
      aria-hidden
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        flex: 'none',
        overflow: 'hidden',
        background: photo ? 'var(--panel)' : 'var(--navy-tint)',
        border: '1px solid var(--line)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--navy-dark)',
        fontSize: `${Math.round(size * 0.4)}px`,
        fontWeight: 700,
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initial || '?'
      )}
    </div>
  );
}
