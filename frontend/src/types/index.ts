export type Lang = 'hi' | 'en';

export type SocialCategory = 'SC' | 'ST' | 'OBC' | 'GEN';

export type BusinessId = 'leaf-plates' | 'tailoring' | 'grocery' | 'carpentry' | 'poultry';

export type Bilingual = { hi: string; en: string };

export type Session = {
  lang: Lang;
  name: string;
  phone: string;
  photo: string | null;
  verified: boolean;
  social: SocialCategory | null;
  /** Fixture id backing the demo feasibility figures, null for a real LGD village. */
  village: string | null;
  /** The authoritative location, as stored in onboarding_profiles. */
  villageLgdCode: string | null;
  villageName: string | null;
  tehsil: string | null;
  radiusKm: number;
  capital: number | null;
  business: BusinessId | null;
  savedAt: string | null;
  /**
   * When the feasibility check last finished, ISO. Set by the loading screen -
   * the one point where the report is known to have been built - so the
   * verdict screen can date what it is showing instead of printing today.
   *
   * Distinct from `savedAt`, which marks the much later moment the case was
   * filed as an application; most sessions have this and never get that.
   */
  reportAt: string | null;
};
