'use client';

/**
 * The real app API. Replaces `src/data/stubs/mock-api.ts` for everything that touches
 * a user account: auth, the village directory, onboarding profiles and saved
 * applications.
 *
 * The user id is never sent from here. It lives in the signed token, and the
 * server reads it from there - see backend/src/plugins/auth.ts.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'udyam.token.v1';

/** Digits in a one-time code. The server confirms this as `code_length`. */
export const OTP_LENGTH = 4;

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

/** An error carrying the API's machine-readable code, so screens can branch. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly body: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    // offline, DNS failure, API not running
    throw new ApiError('network_unreachable', 0);
  }

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(typeof body.error === 'string' ? body.error : 'request_failed', res.status, body);
  }
  return body as T;
}

// --- auth -------------------------------------------------------------------

export type RequestOtpResult = {
  ok: true;
  phone_number: string;
  expires_in_sec: number;
  code_length: number;
  dev_mode: boolean;
};

export type VerifyOtpResult = {
  token: string;
  user: { id: string; phone_number: string };
  is_new_user: boolean;
};

export const api = {
  requestOtp: (phone_number: string) =>
    request<RequestOtpResult>('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number }),
    }),

  verifyOtp: async (phone_number: string, code: string) => {
    const res = await request<VerifyOtpResult>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number, code }),
    });
    tokenStore.set(res.token);
    return res;
  },

  me: () => request<{ user: { id: string; phone_number: string } }>('/api/auth/me'),

  // --- villages -------------------------------------------------------------

  villages: (params: { q?: string; tehsil?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.tehsil) qs.set('tehsil', params.tehsil);
    if (params.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<{ loaded: boolean; count: number; villages: Village[] }>(`/api/villages${suffix}`);
  },

  tehsils: () => request<{ tehsils: { tehsil: string; village_count: number }[] }>('/api/villages/tehsils'),

  // --- onboarding -----------------------------------------------------------

  getProfile: () => request<{ profile: OnboardingProfile | null }>('/api/onboarding/profile'),

  saveProfile: (patch: ProfilePatch) =>
    request<{ profile: OnboardingProfile }>('/api/onboarding/profile', {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  newProfile: () =>
    request<{ profile: OnboardingProfile }>('/api/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  // --- applications ---------------------------------------------------------

  applications: () => request<{ applications: Application[] }>('/api/applications'),

  createApplication: (input: {
    onboarding_profile_id: string;
    feasibility_report?: unknown;
    financial_roadmap?: unknown;
    status?: 'draft' | 'complete';
  }) =>
    request<{ application: Application }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

export type Village = { lgd_code: string; name: string; tehsil: string };

export type OnboardingProfile = {
  id: string;
  village_lgd_code: string | null;
  village_name: string | null;
  tehsil: string | null;
  category: 'SC' | 'ST' | 'OBC' | 'GEN' | null;
  capital: number | null;
  business_category: string | null;
  created_at: string;
};

export type ProfilePatch = Partial<{
  village_lgd_code: string | null;
  category: 'SC' | 'ST' | 'OBC' | 'GEN' | null;
  capital: number | null;
  business_category: string | null;
}>;

export type Application = {
  id: string;
  onboarding_profile_id: string;
  feasibility_report: unknown;
  financial_roadmap: unknown;
  status: 'draft' | 'complete';
  created_at: string;
  updated_at: string;
};
