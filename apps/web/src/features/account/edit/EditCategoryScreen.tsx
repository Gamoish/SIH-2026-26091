'use client';

import React, { useState } from 'react';
import { useSession, type SocialCategory } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { CategoryList, GeneralNote, Header, Primary, T } from '@/components';

/**
 * Change the social category on an existing account. A full screen rather than a
 * sheet because the choice carries scheme consequences that need the room to
 * explain. Separate from the first-run identity step by design.
 */
export default function EditCategoryScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const [social, setSocial] = useState<SocialCategory | null>(s.social);

  const save = () => {
    if (!social) return;
    set({ social });
    nav.back();
  };

  return (
    <div className="dc-phone">
      <Header
        onBack={() => nav.back()}
        title={<T hi="आपका वर्ग बदलिए" en="Change your category" />}
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
        <CategoryList value={social} onChange={setSocial} />

        {social !== s.social ? (
          <div
            style={{
              fontSize: '11.5px',
              lineHeight: 1.55,
              color: 'var(--muted)',
              background: 'var(--navy-tint2)',
              borderRadius: '10px',
              padding: '10px 12px',
            }}
          >
            <T
              hi="वर्ग बदलने पर आपकी योजना और किस्त की गणना दोबारा होगी।"
              en="Changing your category recalculates which scheme applies and your repayment figures."
            />
          </div>
        ) : null}

        {social === 'GEN' ? <GeneralNote /> : null}

        <Primary onClick={save} disabled={!social} style={{ marginTop: 'auto' }}>
          <T hi="सहेजिए" en="Save" />
        </Primary>
      </div>
    </div>
  );
}
