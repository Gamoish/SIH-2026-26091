import type { Bilingual } from '../types/index.ts';

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

export function distanceKm(a: MockVillage, b: MockVillage): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
