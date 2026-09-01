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
};
