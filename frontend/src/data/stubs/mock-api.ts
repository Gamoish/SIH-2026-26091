import { buildReport, type FeasibilityReport } from '../../domain/feasibility.ts';
import { planLoan, type PlanResult } from '../../domain/finance.ts';
import type { BusinessId, SocialCategory } from '../../types/index.ts';

/**
 * The remaining in-browser stand-ins for the feasibility and finance services.
 *
 * Auth used to live here too - a fixed '1234' code and an in-memory verify.
 * That is gone: phone + OTP is real, server-side, and lives in `src/lib/api.ts`
 * against backend. Nothing in this file touches a user account.
 */

const latency = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type FeasibilityRequest = {
  villageId: string;
  businessId: BusinessId;
  radiusKm: number;
  capital: number;
};

export type FinancePlanRequest = { capital: number; social: SocialCategory; businessId: BusinessId };

export const MOCK_api = {
  /** Null when the chosen village has no demo fixture behind it. */
  async feasibility(req: FeasibilityRequest): Promise<FeasibilityReport | null> {
    await latency(1400);
    return buildReport(req);
  },

  async financePlan(req: FinancePlanRequest): Promise<PlanResult> {
    await latency(300);
    return planLoan(req.capital, req.social, req.businessId);
  },
};
