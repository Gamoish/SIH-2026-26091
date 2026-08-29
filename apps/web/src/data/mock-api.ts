import { buildReport, type FeasibilityReport } from '../domain/feasibility.ts';
import { planLoan, type PlanResult } from '../domain/finance.ts';
import type { BusinessId, SocialCategory } from '../types/index.ts';

const latency = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const MOCK_OTP = '1234';
export const OTP_LENGTH = 4;

export type SendOtpRequest = { phone: string };
export type SendOtpResponse = {
  requestId: string;
  expiresInSec: number;
  MOCK_code: string;
};

export type VerifyOtpRequest = { requestId: string; phone: string; code: string };
export type VerifyOtpResponse =
  | { ok: true; token: string }
  | { ok: false; error: 'invalid_code' | 'expired' };

export type FeasibilityRequest = {
  villageId: string;
  businessId: BusinessId;
  radiusKm: number;
  capital: number;
};

export type FinancePlanRequest = { capital: number; social: SocialCategory };

export const MOCK_api = {
  async sendOtp(req: SendOtpRequest): Promise<SendOtpResponse> {
    await latency(600);
    return {
      requestId: `MOCK_${req.phone}_${Date.now()}`,
      expiresInSec: 60,
      MOCK_code: MOCK_OTP,
    };
  },

  async verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    await latency(500);
    if (req.code !== MOCK_OTP) return { ok: false, error: 'invalid_code' };
    return { ok: true, token: `MOCK_token_${req.phone}` };
  },

  async feasibility(req: FeasibilityRequest): Promise<FeasibilityReport> {
    await latency(1400);
    return buildReport(req);
  },

  async financePlan(req: FinancePlanRequest): Promise<PlanResult> {
    await latency(300);
    return planLoan(req.capital, req.social);
  },
};
