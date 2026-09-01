'use client';
import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api, ApiError } from '@/lib/api';
import { Header, Primary, T, useT } from '@/components';

const isValid = (d: string) => /^[6-9]\d{9}$/.test(d);

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

  const onChange = (v: string) => {
    setDigits(v.replace(/\D/g, '').slice(0, 10));
    setError(null);
  };

  return (
    <div className="dc-phone">
      <Header
        onBack={() => nav.go('language')}
        title={<T hi="अपना मोबाइल नंबर डालिए" en="Enter your mobile number" />}
        sub={<T hi="इस नंबर पर OTP भेजा जाएगा" en="An OTP will be sent to this number" />}
      />

      <div style={{ flex: 1, padding: '20px 20px 22px', display: 'flex', flexDirection: 'column' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: `2px solid ${error ? 'var(--rust)' : 'var(--navy)'}`,
            borderRadius: '14px',
            padding: '15px 16px',
            background: '#fff',
            boxShadow: error ? '0 0 0 4px var(--rust-tint)' : '0 0 0 4px var(--navy-tint),var(--e2)',
            marginTop: '18px',
            cursor: 'text',
          }}
        >
          <span style={{ fontSize: '22px', fontWeight: 700 }}>+91</span>
          <span style={{ width: '1px', height: '26px', background: 'var(--line)' }} />
          <input
            autoFocus
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={digits.replace(/(\d{5})(\d+)/, '$1 $2')}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="98765 43210"
            aria-label={t('मोबाइल नंबर', 'Mobile number')}
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: 'none',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '.02em',
              fontFamily: 'var(--sans)',
              background: 'transparent',
            }}
          />
        </label>

        <div
          style={{
            marginTop: '10px',
            minHeight: '18px',
            fontSize: '12px',
            color: error ? 'var(--rust)' : 'var(--muted)',
          }}
        >
          {error ??
            (digits.length > 0 && !isValid(digits) ? (
              <T hi="10 अंकों का नंबर डालिए (6–9 से शुरू)" en="Enter a 10-digit number starting 6–9" />
            ) : null)}
        </div>

        <Primary onClick={submit} disabled={!isValid(digits) || sending} style={{ marginTop: 'auto' }}>
          {sending ? <T hi="भेजा जा रहा…" en="Sending…" /> : <T hi="OTP भेजिए" en="Send OTP" />}
        </Primary>
      </div>
    </div>
  );
}
