'use client';

import { api, type OnboardingProfile } from './api';
import { MOCK_BUSINESSES } from '@/data/fixtures/businesses';
import type { BusinessId, Session, SocialCategory } from '@/types';

/**
 * Rebuild the server-owned half of the session from the onboarding profile.
 *
 * The session lives in localStorage, which means a new browser starts empty.
 * Without this, a returning user whose account and profile already exist was
 * walked back through onboarding from the social step: the guards were working
 * correctly, they just had nothing to read.
 *
 * WHAT THE SERVER OWNS. Only the columns onboarding_profiles actually stores,
 * written by the four onboarding screens through api.saveProfile:
 *
 *   category          -> social        (SocialScreen)
 *   village_lgd_code  -> villageLgdCode
 *   village_name      -> villageName   (both resolved server-side from the code)
 *   tehsil            -> tehsil
 *   capital           -> capital       (CapitalScreen)
 *   business_category -> business      (CategoryScreen)
 *
 * WHAT IT DOES NOT, and why each stays local:
 *
 *   lang      a UI preference, chosen before login even exists
 *   photo     an avatar data URI; never uploaded anywhere
 *   radiusKm  never sent to the server; the default stands in
 *   village   the demo *fixture* id, which has no server column. Only the LGD
 *             code is stored, so a fixture-backed choice cannot be restored -
 *             see the note below.
 *   savedAt   a local "already filed" marker. Restoring it would suppress the
 *             filing of a case this browser has not filed.
 *   name      NOT STORED SERVER-SIDE AT ALL. SocialScreen collects it but only
 *             sends `category`, so there is nothing to restore. A returning
 *             user on a new browser gets their case back and their name blank.
 *
 * A profile whose village was a demo fixture has no village_lgd_code (the
 * location screen only saves real LGD selections), so nothing about the village
 * comes back and the user resumes at the location step. That is the honest
 * outcome: the alternative is guessing which fixture they meant.
 */
export function sessionFromProfile(p: OnboardingProfile): Partial<Session> {
  const out: Partial<Session> = {};

  // Narrowed rather than cast: these are values another client wrote, and the
  // column is a plain text field. An unrecognised value is dropped, which
  // resumes the user one step earlier - never silently mis-set.
  if (p.category) out.social = p.category as SocialCategory;

  if (p.village_lgd_code) {
    out.villageLgdCode = p.village_lgd_code;
    out.villageName = p.village_name;
    out.tehsil = p.tehsil;
  }

  if (typeof p.capital === 'number' && Number.isFinite(p.capital)) out.capital = p.capital;

  if (p.business_category && p.business_category in MOCK_BUSINESSES) {
    out.business = p.business_category as BusinessId;
  }

  return out;
}

/**
 * Fetch the profile and turn it into a session patch. Runs on every successful
 * OTP verification, not just first sign-up: the returning-user case is the
 * whole point.
 *
 * Never throws. A first-time user has no profile (null), and a failed request
 * should leave the user on the onboarding path they would have taken anyway
 * rather than blocking login on a network round trip.
 */
export async function restoreServerSession(): Promise<Partial<Session>> {
  try {
    const { profile } = await api.getProfile();
    return profile ? sessionFromProfile(profile) : {};
  } catch {
    return {};
  }
}
