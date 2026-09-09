import type { Bilingual } from '../../types/index.ts';

export type MockVillage = {
  id: string;
  name: Bilingual;
  block: string;
  lat: number;
  lng: number;
  households: number;
  population: number;
  town?: boolean;
};

/**
 * Population and households here are HAND-TYPED, not Census 2011.
 *
 * They were reconciled against the real village table (1,429 Sonbhadra rows,
 * Census 2011, `db/seeds/villages_census_2011.sql`) by exact name match on
 * every one of the six. None of them is in it:
 *
 *   Jarha    -> nearest row is `Jaraha`   (Dudhi, 7,227)
 *   Dudhi    -> nearest row is `Dudhia`   (Ghorawal, 629)
 *   Myorpur  -> nearest row is `Mahrpur`  (Robertsganj, 466)
 *   Bijpur   -> nearest row is `Bairpur`  (Robertsganj, 3,757)
 *   Ranitali -> nearest row is `Ranitara` (Ghorawal, 1,329)
 *   Kutku    -> nearest row is `Kuhkuh`   (Robertsganj, 103)
 *
 * Those are DIFFERENT VILLAGES, not spellings of these ones - Dudhi is a
 * nagar panchayat and not in a village census at all. Adopting one of their
 * figures would put a real village's population under a demo village's name,
 * which is the same substitution `buildReport` refuses to make when a real
 * LGD village has no fixture behind it.
 *
 * So these stay hand-typed and stay labelled demo data. If a fixture is ever
 * given a genuine LGD/Census identity, take its figures from the table then.
 */
export const MOCK_VILLAGES: MockVillage[] = [
  {
    id: 'jarha',
    name: { hi: 'जरहा', en: 'Jarha' },
    block: 'Dudhi',
    lat: 24.208,
    lng: 83.245,
    households: 410,
    population: 2320,
  },
  {
    id: 'dudhi',
    name: { hi: 'दुद्धी', en: 'Dudhi' },
    block: 'Dudhi',
    lat: 24.236,
    lng: 83.238,
    households: 3100,
    population: 17400,
    town: true,
  },
  {
    id: 'myorpur',
    name: { hi: 'म्योरपुर', en: 'Myorpur' },
    block: 'Myorpur',
    lat: 24.174,
    lng: 83.196,
    households: 1240,
    population: 6900,
  },
  {
    id: 'bijpur',
    name: { hi: 'बिजपुर', en: 'Bijpur' },
    block: 'Dudhi',
    lat: 24.263,
    lng: 83.297,
    households: 980,
    population: 5400,
  },
  {
    id: 'ranitali',
    name: { hi: 'रानीताली', en: 'Ranitali' },
    block: 'Dudhi',
    lat: 24.148,
    lng: 83.312,
    households: 520,
    population: 2900,
  },
  {
    id: 'kutku',
    name: { hi: 'कुटकू', en: 'Kutku' },
    block: 'Myorpur',
    lat: 24.291,
    lng: 83.151,
    households: 340,
    population: 1900,
  },
];

/** Straight-line km. Takes anything with coordinates, not only a fixture village. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
