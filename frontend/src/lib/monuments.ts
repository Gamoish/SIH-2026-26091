import type { Slug } from './nav';

export const MONUMENTS: Record<Slug, string> = {
  language: 'india-gate',
  phone: 'taj-mahal',
  otp: 'jantar-mantar',
  social: 'amer-fort',
  location: 'ghat-of-varanasi',
  capital: 'parliament',
  category: 'charminar',
  loading: 'akshardham',
  feasibility: 'gateway-of-india',
  report: 'mumbai-high-court',
  swot: 'goa-cathedral',
  competitors: 'jama-masjid',
  pricing: 'lotus-mahal',
  scheme: 'red-fort',
  emi: 'jal-mahal',
  share: 'mumbai-high-court',
  home: 'hawa-mahal',
  saved: 'mysore-palace',
  settings: 'victoria-memorial',
  'edit-photo': 'lotus-temple',
  'edit-category': 'charminar',
  empty: 'akshardham',
};

export function monumentVar(slug: string): string | undefined {
  const file = MONUMENTS[slug as Slug];
  return file ? `url('/monuments/${file}.svg')` : undefined;
}
