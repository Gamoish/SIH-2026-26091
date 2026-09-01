import type { SocialCategory } from '../types/index.ts';

export type SchemeRow = {
  code: 'NSFDC' | 'NSTFDC' | 'NBCFDC';
  name: { hi: string; en: string };
  ministry: { hi: string; en: string };
  eligible: SocialCategory[];
  interestPct: number | null;
  tenureMonths: number | null;
  moratoriumMonths: number | null;
  beneficiaryPct: number | null;
  source: string;
};

export const SCHEMES: SchemeRow[] = [
  {
    code: 'NSFDC',
    name: { hi: 'NSFDC टर्म लोन', en: 'NSFDC Term Loan' },
    ministry: {
      hi: 'सामाजिक न्याय एवं अधिकारिता मंत्रालय · अनुसूचित जाति',
      en: 'Ministry of Social Justice & Empowerment · Scheduled Caste',
    },
    eligible: ['SC'],
    interestPct: 6,
    tenureMonths: 48,
    moratoriumMonths: 6,
    beneficiaryPct: 10,
    source:
      'Product design spec (P4/D7 comparison table) — TODO: re-confirm against the NSFDC term-loan circular before any real application.',
  },
  {
    code: 'NSTFDC',
    name: { hi: 'NSTFDC टर्म लोन', en: 'NSTFDC Term Loan' },
    ministry: {
      hi: 'जनजातीय कार्य मंत्रालय · अनुसूचित जनजाति',
      en: 'Ministry of Tribal Affairs · Scheduled Tribe',
    },
    eligible: ['ST'],
    interestPct: 6,
    tenureMonths: 48,
    moratoriumMonths: 6,
    beneficiaryPct: 10,
    source:
      'Product design spec (P4/D7 scheme card) — TODO: re-confirm against the NSTFDC term-loan circular before any real application.',
  },
  {
    code: 'NBCFDC',
    name: { hi: 'NBCFDC टर्म लोन', en: 'NBCFDC Term Loan' },
    ministry: {
      hi: 'सामाजिक न्याय एवं अधिकारिता मंत्रालय · अन्य पिछड़ा वर्ग',
      en: 'Ministry of Social Justice & Empowerment · Other Backward Classes',
    },
    eligible: ['OBC'],
    interestPct: null,
    tenureMonths: null,
    moratoriumMonths: null,
    beneficiaryPct: null,
    source:
      'TODO: confirm rate, tenure, moratorium and contribution percent from the NBCFDC scheme documents.',
  },
];

export function schemeFor(social: SocialCategory): SchemeRow | null {
  return SCHEMES.find((s) => s.eligible.includes(social)) ?? null;
}
