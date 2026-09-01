import { SCHEMES } from '@/domain/schemes';
import type { SocialCategory } from '@/types';

/**
 * The four statutory social categories, in the order they are offered. Shared by
 * the first-run identity step and the Settings edit screen so the two can never
 * drift apart.
 */
export const CATEGORIES: { id: SocialCategory; hi: string; en: string; noteHi: string; noteEn: string }[] = [
  { id: 'SC', hi: 'अनुसूचित जाति', en: 'Scheduled Caste', noteHi: 'SC', noteEn: 'SC' },
  { id: 'ST', hi: 'अनुसूचित जनजाति', en: 'Scheduled Tribe', noteHi: 'ST', noteEn: 'ST' },
  { id: 'OBC', hi: 'अन्य पिछड़ा वर्ग', en: 'Other Backward Class', noteHi: 'OBC', noteEn: 'OBC' },
  { id: 'GEN', hi: 'सामान्य', en: 'General', noteHi: 'इनमें से कोई नहीं', noteEn: 'none of these' },
];

/** The scheme code this category routes to, or null when none applies. */
export function routeNote(id: SocialCategory) {
  return SCHEMES.find((s) => s.eligible.includes(id))?.code ?? null;
}
