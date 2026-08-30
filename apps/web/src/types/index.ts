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
  village: string | null;
  radiusKm: number;
  capital: number | null;
  business: BusinessId | null;
  savedAt: string | null;
};
