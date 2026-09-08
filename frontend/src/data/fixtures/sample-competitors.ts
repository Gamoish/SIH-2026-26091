import type { Bilingual } from '../../types/index.ts';
import type { FeasibilityReport } from '../../domain/feasibility.ts';
import { MOCK_VILLAGES, distanceKm } from './villages.ts';

/**
 * Sample business locations for the competitor map.
 *
 * THERE IS NO REAL BUSINESS-LOCATION DATASET. Nothing here comes from a
 * registry, a survey or a government export - these are invented points,
 * scattered around the real coordinates of the demo villages so the map has
 * something to draw. Every one is named with a `नमूना / Sample` prefix and the
 * UI carries a permanent "sample data" badge, because a plotted dot reads as a
 * surveyed fact unless it is told not to.
 *
 * The one thing that IS real (as real as the engine gets): HOW MANY points
 * there are. The count per village is `buildReport()`'s own competitor figure,
 * so the map can never contradict the number printed beside it. Only the
 * individual positions and names are made up.
 */

export type MockCompetitorPoint = {
  id: string;
  /** Always carries the sample prefix - see the note above. */
  name: Bilingual;
  type: Bilingual;
  village: Bilingual;
  lat: number;
  lng: number;
  /** Distance from the user's own village, km, one decimal. */
  km: number;
};

/** Proprietor names for the invented shopfronts. Deliberately generic. */
const MOCK_PROPRIETORS: Bilingual[] = [
  { hi: 'राम', en: 'Ram' },
  { hi: 'सीता', en: 'Sita' },
  { hi: 'मुन्ना', en: 'Munna' },
  { hi: 'गीता', en: 'Geeta' },
  { hi: 'शिव', en: 'Shiv' },
  { hi: 'कमला', en: 'Kamla' },
  { hi: 'बिरजू', en: 'Birju' },
  { hi: 'सुखिया', en: 'Sukhiya' },
  { hi: 'हरि', en: 'Hari' },
  { hi: 'फूलमती', en: 'Phoolmati' },
  { hi: 'दीनू', en: 'Deenu' },
  { hi: 'रजनी', en: 'Rajni' },
];

/** Deterministic PRNG, so the same session always draws the same map. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** How far from its village a sample unit may sit. A village is not a point. */
const SPREAD_KM = 1.4;
const KM_PER_DEG = 111.32;

/**
 * One point per competitor the report counts, jittered around its village.
 *
 * Returns [] for a report with no fixture village behind it, which cannot
 * happen today (`buildReport` only returns for fixtures) but keeps the caller
 * from having to care.
 */
export function MOCK_COMPETITOR_POINTS(report: FeasibilityReport): MockCompetitorPoint[] {
  const centre = report.village;
  const rand = mulberry32(hash(`${centre.id}|${report.business.id}|${report.radiusKm}`));
  const points: MockCompetitorPoint[] = [];

  for (const row of report.competitors) {
    const village = MOCK_VILLAGES.find((v) => v.name.en === row.name.en);
    if (!village) continue;

    for (let i = 0; i < row.count; i++) {
      const angle = rand() * Math.PI * 2;
      // sqrt keeps the scatter even across the disc instead of clumping at the
      // village centre
      const dist = SPREAD_KM * Math.sqrt(rand());
      let dLat = (Math.sin(angle) * dist) / KM_PER_DEG;
      let dLng = (Math.cos(angle) * dist) / (KM_PER_DEG * Math.cos((village.lat * Math.PI) / 180));

      // Pull the point back until it is inside the radius the user chose. The
      // village itself is always inside it, so halving always terminates.
      let lat = village.lat + dLat;
      let lng = village.lng + dLng;
      for (let n = 0; n < 8 && distanceKm(centre, { lat, lng }) > report.radiusKm; n++) {
        dLat /= 2;
        dLng /= 2;
        lat = village.lat + dLat;
        lng = village.lng + dLng;
      }

      // Offset by the running count so a random draw never repeats the same
      // proprietor twice in a row - three identical rows in the fallback list
      // read as duplicated records rather than as separate shops.
      const who =
        MOCK_PROPRIETORS[
          (Math.floor(rand() * MOCK_PROPRIETORS.length) + points.length) % MOCK_PROPRIETORS.length
        ];
      points.push({
        id: `${village.id}-${i}`,
        name: {
          hi: `नमूना: ${who.hi} की ${report.business.name.hi}`,
          en: `Sample: ${who.en}'s ${report.business.name.en.toLowerCase()}`,
        },
        type: report.business.name,
        village: village.name,
        lat,
        lng,
        km: Math.round(distanceKm(centre, { lat, lng }) * 10) / 10,
      });
    }
  }

  return points;
}
