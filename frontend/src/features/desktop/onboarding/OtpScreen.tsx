'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { api, ApiError, OTP_LENGTH, type RequestOtpResult } from '@/lib/api';
import { restoreServerSession } from '@/lib/restore-session';
import { Primary, T, useT } from '@/components';
import { SplitShell, Ask } from '../shell';

/** D-P1c. Identical verify/resend/expiry handling to the phone screen. */
export default function OtpScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  // Read straight out of sessionStorage rather than in an effect. This screen
  // only ever mounts on the client (LayoutReconciler renders nothing on the
  // server), so the initialiser is safe here, and it means the countdown starts
  // at its real value on the first frame instead of flashing 00:00 for a render.
  const [req, setReq] = useState<RequestOtpResult | null>(() => {
    const raw = sessionStorage.getItem('udyam.otp');
    return raw ? (JSON.parse(raw) as RequestOtpResult) : null;
  });
  const [left, setLeft] = useState(() => req?.expires_in_sec ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arriving here without a pending request means the phone step was skipped.
  useEffect(() => {
    if (!req) nav.replace('phone');
  }, [req, nav]);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const filled = code.join('');

  const put = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    setError(null);
    if (digit && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    setCode(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? ''));
    inputs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const verify = async () => {
    if (filled.length !== OTP_LENGTH || busy || !req) return;
    setBusy(true);
    setError(null);
    try {
      await api.verifyOtp(s.phone, filled);
      // Pull the server-owned half of the session back before navigating, so
      // the guards on the next screen evaluate a complete session. Without it
      // a returning user on a new browser has an empty session and is walked
      // through onboarding again. Merged in one set() so nothing renders
      // against a half-restored state.
      const restored = await restoreServerSession();
      set({ verified: true, ...restored });
      sessionStorage.removeItem('udyam.otp');
      // Still 'social': it is the next step for a genuinely new user, and for a
      // returning one firstRunBlock now sees a complete session and forwards
      // them on. That keeps this identical to an intact-session visit.
      nav.go('social');
      return;
    } catch (err) {
      const c = err instanceof ApiError ? err.code : 'request_failed';
      const remaining = err instanceof ApiError ? err.body.attempts_remaining : undefined;
      setError(
        c === 'too_many_attempts'
          ? t('बहुत बार ग़लत कोड — नया कोड मँगाइए', 'Too many wrong codes — request a new one')
          : c === 'code_expired' || c === 'no_active_code'
            ? t('कोड की मियाद ख़त्म — नया कोड मँगाइए', 'That code has expired — request a new one')
            : c === 'network_unreachable'
              ? t(
                  'सर्वर से संपर्क नहीं हुआ — इंटरनेट जाँचिए',
                  'Could not reach the server — check your connection',
                )
              : typeof remaining === 'number'
                ? t(
                    `कोड ग़लत है — ${remaining} कोशिश बाकी`,
                    `That code is wrong — ${remaining} ${remaining === 1 ? 'try' : 'tries'} left`,
                  )
                : t('कोड ग़लत है — दोबारा डालिए', 'That code is wrong — try again'),
      );
    }
    setCode(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
    setBusy(false);
  };

  const resend = async () => {
    if (left > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.requestOtp(s.phone);
      sessionStorage.setItem('udyam.otp', JSON.stringify(res));
      setReq(res);
      setLeft(res.expires_in_sec);
      setCode(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch (err) {
      const c = err instanceof ApiError ? err.code : 'request_failed';
      setError(
        c === 'too_many_requests'
          ? t('बहुत बार कोशिश हुई — थोड़ी देर बाद', 'Too many requests — try again shortly')
          : t('नया कोड नहीं भेजा जा सका', 'Could not send a new code'),
      );
    }
    setBusy(false);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <SplitShell step="otp">
      <Ask
        hi="कोड डालिए"
        en="Enter the code"
        note={
          <T
            hi={`+91 ${s.phone} पर भेजा गया ${OTP_LENGTH} अंकों का कोड`}
            en={`The ${OTP_LENGTH}-digit code sent to +91 ${s.phone}`}
          />
        }
      />

      <div style={{ display: 'flex', gap: '12px' }} onPaste={onPaste}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            onChange={(e) => put(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
              if (e.key === 'Enter') verify();
            }}
            inputMode="numeric"
            maxLength={1}
            aria-label={t(`अंक ${i + 1}`, `Digit ${i + 1}`)}
            style={{
              width: '68px',
              height: '80px',
              textAlign: 'center',
              fontFamily: 'var(--sans)',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text)',
              borderRadius: '12px',
              border: `2px solid ${d ? 'var(--navy)' : error ? 'var(--rust)' : 'var(--line)'}`,
              background: d ? 'var(--navy-tint2)' : 'var(--card)',
              outline: 'none',
            }}
          />
        ))}
      </div>

      {error ? <div style={{ fontSize: '14px', color: 'var(--rust)' }}>{error}</div> : null}

      <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
        {left > 0 ? (
          <T hi={`कोड ${mm}:${ss} तक चलेगा`} en={`Code valid for ${mm}:${ss}`} />
        ) : (
          <button
            onClick={resend}
            disabled={busy}
            style={{
              border: 0,
              background: 'none',
              padding: 0,
              cursor: busy ? 'not-allowed' : 'pointer',
              color: 'var(--navy)',
              fontFamily: 'var(--sans)',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'underline',
            }}
          >
            <T hi="नया कोड भेजिए" en="Send a new code" />
          </button>
        )}
      </div>

      <Primary onClick={verify} disabled={filled.length !== OTP_LENGTH || busy}>
        {busy ? <T hi="जाँचा जा रहा है…" en="Checking…" /> : <T hi="आगे बढ़िए" en="Continue" />}
      </Primary>
    </SplitShell>
  );
}
