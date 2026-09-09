/**
 * The project-cost breakdown both capital screens must render, for ₹22,000 of
 * own capital. The project cost is the BUSINESS's anchor cost now, not the
 * capital grossed up - so leaf-plates is ₹1,80,000 and poultry ₹1,60,000, and
 * these two lists no longer sum to the same total.
 *
 * Deliberately literal, and deliberately shared by the phone and desktop
 * specs: each layout asserts against THIS, so the two are pinned to each other
 * as well as to the engine. Reading the values out of MOCK_BUSINESSES instead
 * would let a screen that shows one business for every selection agree with
 * itself. Two businesses, so a single default cannot satisfy both.
 */
export const CAPITAL = '22000';

export const EXPECTED_SPLIT = {
  'leaf-plates': {
    button: 'Leaf plates',
    rows: [
      ['Plate machines', '₹1,06,200'],
      ['Shed + power', '₹32,400'],
      ['Leaves + working', '₹41,400'],
    ],
  },
  poultry: {
    button: 'Poultry',
    rows: [
      ['Shed + cages', '₹70,400'],
      ['Chicks', '₹33,600'],
      ['Feed + working', '₹56,000'],
    ],
  },
} as const;
