/**
 * The project-cost breakdown both capital screens must render, for ₹22,000 of
 * own capital (project cost ₹2,20,000 at the 10% NSTFDC contribution).
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
      ['Plate machines', '₹1,29,800'],
      ['Shed + power', '₹39,600'],
      ['Leaves + working', '₹50,600'],
    ],
  },
  poultry: {
    button: 'Poultry',
    rows: [
      ['Shed + cages', '₹96,800'],
      ['Chicks', '₹46,200'],
      ['Feed + working', '₹77,000'],
    ],
  },
} as const;
