'use client';
import React, { useState } from 'react';
import { useSession, type SocialCategory } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api } from '@/lib/api';
import { CategoryList, Field, GeneralNote, Header, Primary, T, useT } from '@/components';

/**
 * First run only. Once name and category are set the account exists, and
 * `redirectFor` makes this screen unreachable - later edits go through Settings.
 */
export default function SocialScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const [name, setName] = useState(s.name);
  const [social, setSocial] = useState<SocialCategory | null>(s.social);

  const submit = async () => {
    if (!social || !name.trim()) return;
    set({ name: name.trim(), social });
    try {
      await api.saveProfile({ category: social });
    } catch {
      // the local session already holds it; later steps re-save
    }
    nav.go('location');
  };

  return (
    <div className="dc-phone">
      <Header
        onBack={() => nav.go('phone')}
        title={<T hi="आपके बारे में" en="About you" />}
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
        <Field
          label={t('आपका नाम', 'Your name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('जैसे — सुरेश खरवार', 'e.g. Suresh Kharwar')}
          autoComplete="name"
        />

        <div>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '8px' }}>
            <T hi="आपका वर्ग" en="Your category" />
          </div>
          <CategoryList value={social} onChange={setSocial} />
        </div>

        {social === 'GEN' ? <GeneralNote /> : null}

        <Primary onClick={submit} disabled={!social || !name.trim()} arrow style={{ marginTop: 'auto' }}>
          <T hi="आगे · जगह बताइए" en="Next · your location" />
        </Primary>
      </div>
    </div>
  );
}
