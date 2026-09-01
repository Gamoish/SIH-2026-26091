import type { Slug } from './nav';

export const MONUMENTS: Record<Slug, string> = {
  language: 'india-gate',
  phone: 'charminar',
  otp: 'qutub-minar',
  social: 'sanchi-stupa',
  location: 'konark-sun-temple',
  capital: 'taj-mahal',
  category: 'hawa-mahal',
  loading: 'ellora-caves',
  feasibility: 'golden-temple',
  report: 'mysore-palace',
  swot: 'brihadeeswarar-temple',
  competitors: 'red-fort',
  pricing: 'gateway-of-india',
  scheme: 'rashtrapati-bhavan',
  emi: 'victoria-memorial',
  share: 'lotus-temple',
  home: 'amber-fort',
  saved: 'humayuns-tomb',
  settings: 'meenakshi-temple',
  'edit-photo': 'gol-gumbaz',
  'edit-category': 'jantar-mantar',
  empty: 'amber-fort',
};

export function monumentVar(slug: string): string | undefined {
  const file = MONUMENTS[slug as Slug];
  return file ? `url('/monuments/${file}.svg')` : undefined;
}
