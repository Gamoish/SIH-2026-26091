'use client';

import React, { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { MOCK_api, OTP_LENGTH, type SendOtpResponse } from '@/data/mock-api';
import { Field, Primary, Secondary, Sheet, T, useT } from '@/components';

const isValid = (d: string) => /^[6-9]\d{9}$/.test(d);

/**
 * Change the mobile number on an existing account. The phone number IS the
 * login for this app, so a change is re-verified by OTP here in the sheet -
 * never by sending the user back through the first-run phone/otp screens.
 */
export default function PhoneSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, set } = useSession();
  const t = useT();
  const [digits, setDigits] = useState(s.phone);
  const [code, setCode] = useState('');
  const [sent, setSent] = useState<SendOtpResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDigits(s.phone);
      setCode('');
      setSent(null);
      setBusy(false);
      setError(null);
    }
  }

  const sendCode = async () => {
    if (!isValid(digits) || busy) return;
    setBusy(true);
    setError(null);
    try {
      setSent(await MOCK_api.sendOtp({ phone: digits }));
    } catch {
      setError(t('अभी भेजा नहीं जा सका — दोबारा कोशिश कीजिए', 'Could not send just now — please try again'));
    }
    setBusy(false);
  };

  const confirm = async () => {
    if (!sent || code.length !== OTP_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    const res = await MOCK_api.verifyOtp({ requestId: sent.requestId, phone: digits, code });
    setBusy(false);
    if (!res.ok) {
      setError(t('वह कोड ग़लत है — दोबारा कोशिश कीजिए', 'That code is wrong — try again'));
      return;
    }
    set({ phone: digits });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={<T hi="फ़ोन नंबर बदलिए" en="Change phone number" />}
      sub={
        sent ? (
          <T hi={`+91 ${digits} पर भेजा गया कोड डालिए`} en={`Enter the code sent to +91 ${digits}`} />
        ) : (
          <T hi="नया नंबर OTP से जाँचा जाएगा" en="The new number is confirmed by OTP" />
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sent ? (
          <Field
            label={t('OTP कोड', 'OTP code')}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••"
            error={!!error}
            style={{ letterSpacing: '.5em', textAlign: 'center' }}
          />
        ) : (
          <Field
            label={t('नया मोबाइल नंबर', 'New mobile number')}
            value={digits}
            onChange={(e) => {
              setDigits(e.target.value.replace(/\D/g, '').slice(0, 10));
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && sendCode()}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            error={!!error}
          />
        )}

        <div style={{ minHeight: '18px', fontSize: '12px', color: error ? 'var(--rust)' : 'var(--muted)' }}>
          {error ??
            (!sent && digits.length > 0 && !isValid(digits) ? (
              <T hi="10 अंकों का नंबर डालिए (6–9 से शुरू)" en="Enter a 10-digit number starting 6–9" />
            ) : null)}
        </div>

        {sent ? (
          <Primary onClick={confirm} disabled={code.length !== OTP_LENGTH || busy}>
            {busy ? <T hi="जाँचा जा रहा…" en="Checking…" /> : <T hi="सहेजिए" en="Save" />}
          </Primary>
        ) : (
          <Primary onClick={sendCode} disabled={!isValid(digits) || digits === s.phone || busy}>
            {busy ? <T hi="भेजा जा रहा…" en="Sending…" /> : <T hi="OTP भेजिए" en="Send OTP" />}
          </Primary>
        )}
        <Secondary onClick={onClose} />
      </div>
    </Sheet>
  );
}
