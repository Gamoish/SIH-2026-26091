'use client';

import React, { useState } from 'react';
import { useSession, type SocialCategory } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api } from '@/lib/api';
import { CategoryList, Field, GeneralNote, Primary, T, useT } from '@/components';
import { SplitShell, Ask } from '../shell';

/**
 * There is no artboard for this screen, but the flow requires it: `nav.ts`
 * gates `location` on `s.social`, and `planLoan()` routes the scheme off it.
 * Built in the canvas's visual language from the shared primitives rather than
 * invented - `CategoryList` and `Field` are the same controls the phone uses.
 *
 * First run only: once name and category are set the account exists, and
 * `redirectFor` makes this unreachable - later edits go through Settings.
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
    <SplitShell>
      <Ask
        hi="आपका नाम और वर्ग"
        en="Your name and category"
        note={
          <T
            hi="वर्ग से तय होता है कि कौन सी सरकारी योजना आप पर लागू है"
            en="Your category decides which government scheme applies to you"
          />
        }
      />

      <Field
        label={t('आपका नाम', 'Your name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('जैसे — सुरेश खरवार', 'e.g. Suresh Kharwar')}
        autoComplete="name"
      />

      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', marginBottom: '10px' }}>
          <T hi="आपका वर्ग" en="Your category" />
        </div>
        <CategoryList value={social} onChange={setSocial} />
        {social === 'GEN' ? (
          <div style={{ marginTop: '10px' }}>
            <GeneralNote />
          </div>
        ) : null}
      </div>

      <Primary onClick={submit} disabled={!social || !name.trim()} arrow>
        <T hi="आगे बढ़िए" en="Continue" />
      </Primary>
    </SplitShell>
  );
}
