/**
 * The two anchor-cost cases both layouts must render identically.
 *
 * Shared by flow.spec.ts (phone) and desktop.spec.ts (desktop) for the same
 * reason expected-cost-split.ts is: each layout asserts against THESE literals,
 * so the two are pinned to each other as well as to the engine. A layout that
 * quietly recomputed a figure of its own would have to reproduce these exact
 * strings to pass, and asserting each layout against its own rendered output
 * would let a wrong number agree with itself.
 *
 * Deliberately literal, and deliberately NOT read from planLoan(): the point is
 * to catch the engine and the screens drifting apart, which importing the
 * engine here would hide.
 */

/** The locked walkthrough. Capital clears the required margin, so NO warning. */
export const DEMO = {
  social: 'Scheduled Tribe',
  village: 'Jarha',
  radius: '10 km',
  business: 'Leaf plates',
  capital: '22000',

  // planLoan(22000, 'ST', 'leaf-plates'): the project cost is leaf-plates'
  // ₹1,80,000 anchor, not the capital grossed up to ₹2,20,000.
  projectCost: '₹1,80,000',
  loan: '₹1,58,000',
  // NSTFDC slab 1, 6% over 84 months, 6 of them a moratorium (78 instalments)
  emi: '₹2,525',

  // buildReport(): unchanged by the anchor switch, which is the point -
  // capitalFit reads raw capital and revenue is market-limited here.
  score: 75,
  revenue: '₹1,57,153',
} as const;

/**
 * Capital UNDER the scheme's required contribution: ₹12,000 against the
 * ₹22,000 that 10% of a ₹2,20,000 carpentry workshop comes to.
 *
 * The warning is soft - every figure below it still renders - so both the
 * warning copy AND the plan figures are asserted.
 */
export const SHORT_MARGIN = {
  social: 'Scheduled Tribe',
  village: 'Jarha',
  radius: '10 km',
  business: 'Carpentry',
  capital: '12000',

  projectCost: '₹2,20,000',
  loan: '₹2,08,000',

  title: 'This is tight for carpentry',
  /** The exact rupee figures in the copy, not merely that some warning showed. */
  copy: 'A typical setup costs around ₹2,20,000, of which ₹22,000 has to be your own — you have ₹12,000.',
} as const;
