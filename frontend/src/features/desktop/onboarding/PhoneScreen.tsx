'use client';

import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api, ApiError } from '@/lib/api';
import { Primary, T, useT } from '@/components';
import { SplitShell, Ask } from '../shell';

const isValid = (d: string) => /^[6-9]\d{9}$/.test(d);

/** D-P1b. Same request/error handling as the phone screen, one wide column. */
export default function PhoneScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const [digits, setDigits] = useState(s.phone);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isValid(digits) || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.requestOtp(digits);
      set({ phone: digits, verified: false });
      sessionStorage.setItem('disha.otp', JSON.stringify(res));
      nav.go('otp');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'request_failed';
      setError(
        code === 'too_many_requests'
          ? t(
              'बहुत बार कोशिश हुई — थोड़ी देर बाद दोबारा कीजिए',
              'Too many requests — please try again in a little while',
            )
          : code === 'network_unreachable'
            ? t(
                'सर्वर से संपर्क नहीं हुआ — इंटरनेट जाँचिए',
                'Could not reach the server — check your connection',
              )
            : t('अभी भेजा नहीं जा सका — दोबारा कोशिश कीजिए', 'Could not send just now — please try again'),
      );
      setSending(false);
    }
  };

  return (
    <SplitShell>
      <Ask
        hi="अपना मोबाइल नंबर डालिए"
        en="Enter your mobile number"
        note={<T hi="इसी नंबर पर कोड भेजा जाएगा" en="The code will be sent to this number" />}
      />

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          border: `1.5px solid ${error ? 'var(--rust)' : 'var(--navy-tint)'}`,
          borderRadius: '14px',
          padding: '18px 22px',
          background: 'var(--card)',
        }}
      >
        <span style={{ fontSize: '22px', fontWeight: 600, color: 'var(--muted)' }}>+91</span>
        <span style={{ width: '1px', height: '30px', background: 'var(--line)' }} />
        <input
          value={digits}
          onChange={(e) => {
            setDigits(e.target.value.replace(/\D/g, '').slice(0, 10));
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="98765 43210"
          aria-label={t('मोबाइल नंबर', 'Mobile number')}
          style={{
            flex: 1,
            border: 0,
            outline: 'none',
            fontFamily: 'var(--sans)',
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '.04em',
            color: 'var(--text)',
            background: 'transparent',
            minWidth: 0,
          }}
        />
      </label>

      {error ? <div style={{ fontSize: '14px', color: 'var(--rust)' }}>{error}</div> : null}

      <Primary onClick={submit} disabled={!isValid(digits) || sending}>
        {sending ? <T hi="भेजा जा रहा है…" en="Sending…" /> : <T hi="OTP भेजिए" en="Send OTP" />}
      </Primary>
    </SplitShell>
  );
}
