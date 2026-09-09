import { api } from './api';
import type { Case } from '@/domain/case';

/**
 * Persist the finished case as an application row.
 *
 * Reaching the share sheet used to set `session.savedAt` and nothing else, so
 * "saved" meant only that this browser remembered it: `GET /api/applications`
 * stayed empty, the applications list stayed empty, and clearing the tab lost
 * the case. This is what actually writes it to Postgres.
 *
 * Both layouts call it, so neither can drift into a different idea of what
 * "saved" means. The row is keyed to the onboarding profile the flow has been
 * writing all along - the server owns the user id, from the bearer token.
 *
 * The report and the plan go in as they are, `PlanGap` included: a scheme whose
 * rate is not confirmed is a fact about the case, and dropping it here would
 * make the stored row claim more than the engine did.
 */
// Only the two persisted halves. `Case` also carries `alternatives`, which is
// derived from the report and recomputed on every load - filing it would store
// a stale copy of something we can always work out again.
export async function saveCase(c: Pick<Case, 'report' | 'plan'>): Promise<string | null> {
  if (!c.report) return null; // nothing worth filing yet

  const { profile } = await api.getProfile();
  if (!profile) return null; // onboarding never reached the server

  const { application } = await api.createApplication({
    onboarding_profile_id: profile.id,
    feasibility_report: c.report,
    financial_roadmap: c.plan,
    status: 'complete',
  });
  return application.id;
}
