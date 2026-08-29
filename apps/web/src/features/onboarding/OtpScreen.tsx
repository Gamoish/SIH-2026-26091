'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useNav } from '@/lib/nav';
import { MOCK_api, MOCK_OTP, OTP_LENGTH, type SendOtpResponse } from '@/data/mock-api';
import { Header, Primary, T, useT } from '@/components';

export default function OtpScreen() {
  const { s, set } = useSession();
  const nav = useNav();
  const t = useT();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [req, setReq] = useState<SendOtpResponse | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('disha.otp');
    if (!raw) {
      nav.replace('phone');
      return;
    }
    const parsed: SendOtpResponse = JSON.parse(raw);
    setReq(parsed);
    setLeft(parsed.expiresInSec);
  }, [nav]);

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

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'Enter') verify();
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
    const res = await MOCK_api.verifyOtp({ requestId: req.requestId, phone: s.phone, code: filled });
    if (res.ok) {
      set({ verified: true });
      sessionStorage.removeItem('disha.otp');
      nav.go('social');
      return;
    }
    setError(t('कोड ग़लत है — दोबारा डालिए', 'That code is wrong — try again'));
    setCode(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
    setBusy(false);
  };

  const resend = async () => {
    if (left > 0 || busy) return;
    setBusy(true);
    setError(null);
    const res = await MOCK_api.sendOtp({ phone: s.phone });
    sessionStorage.setItem('disha.otp', JSON.stringify(res));
    setReq(res);
    setLeft(res.expiresInSec);
    setCode(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
    setBusy(false);
  };

  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('phone')} title={<T hi="कोड डालिए" en="Enter the code" />} />

      <div style={{ flex: 1, padding: '20px 20px 22px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5, marginTop: '6px' }}>
          <T
            hi={`+91 ${s.phone} पर आए ${OTP_LENGTH} अंकों का कोड डालिए`}
            en={`Enter the ${OTP_LENGTH}-digit code sent to +91 ${s.phone}`}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', margin: '22px 0 0', justifyContent: 'center' }} onPaste={onPaste}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              autoFocus={i === 0}
              value={d}
              onChange={(e) => put(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={t(`अंक ${i + 1}`, `Digit ${i + 1}`)}
              style={{
                width: '52px', height: '60px', borderRadius: '10px', textAlign: 'center',
                fontSize: '24px', fontWeight: 700, fontFamily: 'var(--sans)', color: 'var(--text)',
                border: `2px solid ${error ? 'var(--rust)' : d ? 'var(--navy)' : 'var(--line)'}`,
                background: error ? 'var(--rust-tint)' : d ? 'var(--navy-tint)' : '#fff',
                outlineColor: 'var(--saffron)',
              }}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '14px', minHeight: '20px', fontSize: '12.5px', color: error ? 'var(--rust)' : 'var(--muted)', fontWeight: error ? 600 : 400 }}>
          {error ?? (
            left > 0 ? (
              <>
                <T hi="कोड नहीं आया? " en="Didn't get it? " />
                <span style={{ color: 'var(--teal)', fontWeight: 700 }}>{mmss}</span>
              </>
            ) : (
              <button onClick={resend} style={{ background: 'transparent', border: 0, color: 'var(--teal)', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', textDecoration: 'underline', padding: '6px' }}>
                <T hi="कोड दोबारा भेजिए" en="Resend the code" />
              </button>
            )
          )}
        </div>

        <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '11px', color: 'var(--faint)', background: 'var(--panel)', border: '1px dashed var(--line)', borderRadius: '8px', padding: '8px' }}>
          <T hi={`डेमो · कोड ${MOCK_OTP}`} en={`Demo build · the code is ${MOCK_OTP}`} />
        </div>

        <Primary onClick={verify} disabled={filled.length !== OTP_LENGTH || busy} style={{ marginTop: 'auto' }}>
          {busy ? <T hi="जाँच हो रही…" en="Checking…" /> : <T hi="आगे बढ़िए" en="Continue" />}
        </Primary>
      </div>
    </div>
  );
}
