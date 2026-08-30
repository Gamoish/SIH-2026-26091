'use client';

import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { Field, Primary, Secondary, Sheet, T, useT } from '@/components';

/** Edit the applicant's name. Purpose-built for an existing account - it shares
 *  no component with the first-run identity step. */
export default function NameSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, set } = useSession();
  const t = useT();
  const [name, setName] = useState(s.name);

  // reset the draft each time the sheet is opened, so a cancelled edit is gone
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setName(s.name);
  }

  const save = () => {
    if (!name.trim()) return;
    set({ name: name.trim() });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={<T hi="नाम बदलिए" en="Edit name" />}
      sub={
        <T
          hi="यही नाम बैंक को दिखाए जाने वाले काग़ज़ पर छपेगा"
          en="This name prints on the sheet you show the bank"
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field
          label={t('आपका नाम', 'Your name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder={t('जैसे — सुरेश खरवार', 'e.g. Suresh Kharwar')}
          autoComplete="name"
        />
        <Primary onClick={save} disabled={!name.trim()}>
          <T hi="सहेजिए" en="Save" />
        </Primary>
        <Secondary onClick={onClose} />
      </div>
    </Sheet>
  );
}
