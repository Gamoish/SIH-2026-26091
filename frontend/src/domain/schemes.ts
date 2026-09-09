import type { SocialCategory, Bilingual } from '../types/index.ts';

/**
 * One rate band inside a scheme. Both national corporations price by size
 * rather than by a single flat rate, which is why a scheme is a list of these
 * and not a row of scalars.
 */
export type SchemeTier = {
  name: Bilingual;
  /**
   * Inclusive upper bound of the amount this tier covers, measured in the
   * scheme's own `tierBasis`. `null` on the top tier - nothing above it.
   */
  upTo: number | null;
  interestPct: number;
  tenureMonths: number;
  moratoriumMonths: number;
  /** Hard ceiling on the loan itself, where the scheme states one. */
  maxLoan: number | null;
};

export type SchemeRow = {
  code: 'NSFDC' | 'NSTFDC' | 'NBCFDC';
  name: { hi: string; en: string };
  ministry: { hi: string; en: string };
  eligible: SocialCategory[];
  beneficiaryPct: number | null;
  /**
   * What the tiers are measured against. NSFDC bands by the size of the
   * PROJECT; NSTFDC bands by the size of the LOAN. They are different
   * quantities and picking the wrong one puts a borrower in the wrong band.
   */
  tierBasis: 'project-cost' | 'loan';
  /** Ascending by `upTo`. Empty means the scheme was never sourced. */
  tiers: SchemeTier[];
  source: string;
};

export const SCHEMES: SchemeRow[] = [
  {
    code: 'NSFDC',
    name: { hi: 'NSFDC ऋण', en: 'NSFDC Loan' },
    ministry: {
      hi: 'सामाजिक न्याय एवं अधिकारिता मंत्रालय · अनुसूचित जाति',
      en: 'Ministry of Social Justice & Empowerment · Scheduled Caste',
    },
    eligible: ['SC'],
    beneficiaryPct: 10,
    // NSFDC bands by PROJECT COST: which product you get is decided by how big
    // the project is, before any loan is worked out.
    tierBasis: 'project-cost',
    tiers: [
      {
        name: { hi: 'सूक्ष्म वित्त योजना', en: 'Micro Finance Scheme' },
        upTo: 140_000,
        interestPct: 6.5,
        tenureMonths: 36,
        moratoriumMonths: 3,
        maxLoan: 125_000,
      },
      {
        name: { hi: 'सावधि ऋण', en: 'Term Loan' },
        upTo: 5_000_000,
        interestPct: 8,
        tenureMonths: 84,
        moratoriumMonths: 6,
        maxLoan: 4_500_000,
      },
    ],
    // Both tiers from the NSFDC scheme page, content stated current as of
    // 08.09.2026: https://nsfdc.nic.in/scheme
    //
    // Term Loan carries a 12-month moratorium for plantation and construction
    // projects instead of 6. None of the five business categories this app
    // offers is either, so only the 6-month figure is modelled - revisit if a
    // plantation or construction category is ever added.
    source: 'NSFDC scheme page, https://nsfdc.nic.in/scheme (content as of 08.09.2026)',
  },
  {
    code: 'NSTFDC',
    name: { hi: 'NSTFDC ऋण', en: 'NSTFDC Loan' },
    ministry: {
      hi: 'जनजातीय कार्य मंत्रालय · अनुसूचित जनजाति',
      en: 'Ministry of Tribal Affairs · Scheduled Tribe',
    },
    eligible: ['ST'],
    beneficiaryPct: 10,
    // NSTFDC bands by LOAN AMOUNT, not project cost - the rate follows what is
    // actually borrowed.
    tierBasis: 'loan',
    tiers: [
      {
        name: { hi: '₹5 लाख तक', en: 'Up to ₹5 lakh' },
        upTo: 500_000,
        interestPct: 6,
        tenureMonths: 84,
        moratoriumMonths: 6,
        maxLoan: null,
      },
      {
        name: { hi: '₹5–10 लाख', en: '₹5–10 lakh' },
        upTo: 1_000_000,
        interestPct: 8,
        tenureMonths: 84,
        moratoriumMonths: 6,
        maxLoan: null,
      },
      {
        name: { hi: '₹10 लाख से ऊपर', en: 'Above ₹10 lakh' },
        upTo: null,
        interestPct: 10,
        tenureMonths: 84,
        moratoriumMonths: 6,
        maxLoan: null,
      },
    ],
    // Rate slabs and the 90% financing share from NSTFDC via PIB / Ministry of
    // Tribal Affairs: https://pib.gov.in/ and https://tribal.nic.in/
    //
    // TWO CAVEATS, both deliberate rather than hidden:
    //  - Tenure is published as a 5-10 year range, not one number. 84 months is
    //    the midpoint, used for every tier because nothing in the source ties
    //    tenure to loan size. A real sanction may fall anywhere in that range.
    //  - The 6-month moratorium is NOT in the cited source. It is carried over
    //    from the earlier figure and still needs confirming against an NSTFDC
    //    circular; it is the one number here that is not sourced.
    source:
      'NSTFDC rate slabs and 90% financing via PIB / Ministry of Tribal Affairs (https://pib.gov.in/, https://tribal.nic.in/). Tenure is the midpoint of a published 5-10 year range; the 6-month moratorium is carried over and still unconfirmed.',
  },
  {
    code: 'NBCFDC',
    name: { hi: 'NBCFDC टर्म लोन', en: 'NBCFDC Term Loan' },
    ministry: {
      hi: 'सामाजिक न्याय एवं अधिकारिता मंत्रालय · अन्य पिछड़ा वर्ग',
      en: 'Ministry of Social Justice & Empowerment · Other Backward Classes',
    },
    eligible: ['OBC'],
    beneficiaryPct: null,
    tierBasis: 'project-cost',
    // Deliberately empty. NBCFDC was not sourced in this pass, and an empty
    // tier list is what makes `planLoan` return a visible gap instead of a
    // number nobody can stand behind. Do not fill this in from memory.
    tiers: [],
    source:
      'TODO: confirm rate, tenure, moratorium and contribution percent from the NBCFDC scheme documents. Not sourced in the 08.09.2026 pass.',
  },
];

export function schemeFor(social: SocialCategory): SchemeRow | null {
  return SCHEMES.find((s) => s.eligible.includes(social)) ?? null;
}

/**
 * The tier covering `amount`, measured in the scheme's own basis, or null when
 * the amount is past the scheme's top band - NSFDC stops at a ₹50,00,000
 * project, and pretending otherwise would quote terms that do not exist.
 */
export function selectTier(scheme: SchemeRow, amount: number): SchemeTier | null {
  return scheme.tiers.find((t) => t.upTo == null || amount <= t.upTo) ?? null;
}

/** The scheme's rate as a range, for the comparison tables. */
export function rateRange(scheme: SchemeRow): string | null {
  if (!scheme.tiers.length) return null;
  const rates = scheme.tiers.map((t) => t.interestPct);
  const lo = Math.min(...rates);
  const hi = Math.max(...rates);
  return lo === hi ? `${lo}%` : `${lo}–${hi}%`;
}
