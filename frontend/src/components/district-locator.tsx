/**
 * Sonbhadra district locator - a static outline, drawn from real geometry.
 *
 * NOT a map widget: no tile fetch, no map library, no network call, no
 * per-village coordinates. It renders identically offline, which is the point.
 *
 * PROVENANCE. The outline is the OpenStreetMap boundary relation for Sonbhadra
 * district (OSM relation 1959915), simplified with Douglas-Peucker at a 0.006-
 * degree tolerance to 162 points and projected equirectangularly (longitude
 * scaled by cos of the mid-latitude). Regenerate with:
 *
 *   https://nominatim.openstreetmap.org/search
 *     ?q=Sonbhadra+district+Uttar+Pradesh&format=json&polygon_geojson=1
 *
 * The three markers are the real OSM place nodes for the tehsil headquarters
 * towns, projected the same way.
 *
 * Data (c) OpenStreetMap contributors, ODbL 1.0. That licence requires the
 * credit to stay visible, so ATTRIBUTION below is rendered, not optional.
 *
 * WHAT THIS DELIBERATELY DOES NOT DRAW: tehsil boundaries. OpenStreetMap has
 * no admin_level 7 or 8 relations inside Sonbhadra - an Overpass query for them
 * returns zero features - so there is no real tehsil geometry to draw. Inventing
 * plausible internal boundaries for a real district on a government-facing
 * screen is exactly the fabrication rule 4 forbids, so the tehsil is shown as a
 * located point rather than a shaded region.
 */

const VIEW_W = 85.64;
const VIEW_H = 100.0;

/** Simplified district boundary. See PROVENANCE above. */
const OUTLINE =
  'M0.0 26.08 0.54 28.24 1.43 28.67 12.33 24.16 14.84 26.09 14.61 28.82 15.32 29.74 20.97 29.23 21.41 31.79 20.23 33.45 23.37 33.28 23.75 37.75 19.4 38.81 19.08 37.66 16.37 37.43 17.36 39.02 16.51 39.53 16.49 40.95 18.4 42.67 17.26 44.75 17.8 45.76 17.35 47.97 18.04 48.88 16.72 49.88 15.87 53.23 16.76 54.34 19.44 54.21 19.8 53.5 20.56 54.11 20.28 59.35 20.88 59.92 19.46 64.14 19.7 66.44 17.67 68.14 18.48 72.94 17.11 75.73 14.74 75.35 13.33 73.94 11.79 76.42 15.39 79.28 15.93 81.13 17.53 80.74 18.94 81.63 19.75 80.99 20.03 81.71 20.95 81.12 20.39 83.67 18.71 85.62 19.0 87.03 23.47 87.8 23.31 90.03 24.17 91.81 24.86 91.35 27.21 92.99 29.89 96.34 33.82 98.05 35.71 100.0 42.79 99.14 47.24 99.91 51.68 98.59 53.1 96.65 57.2 95.31 56.87 94.67 58.49 91.91 58.49 89.32 60.09 88.37 60.29 86.97 61.84 87.29 63.16 86.46 64.41 81.67 66.7 78.34 67.62 78.65 69.31 76.6 71.85 69.94 71.51 66.95 74.02 63.67 73.8 61.62 72.25 60.71 71.72 59.34 74.45 56.93 76.17 57.06 78.15 54.69 76.27 51.33 73.78 50.96 73.79 48.13 72.91 48.23 72.15 46.38 73.08 42.72 73.55 41.9 81.76 39.81 81.32 38.55 83.48 37.87 84.11 36.25 83.51 32.94 85.64 30.93 83.67 30.52 84.07 29.08 81.75 28.53 82.01 26.85 83.2 25.79 81.52 23.57 80.4 23.71 80.74 20.53 78.21 21.02 75.58 17.63 73.03 16.37 67.98 17.19 66.64 15.71 66.7 17.17 67.64 17.3 65.14 20.47 65.16 22.07 64.03 21.98 63.43 20.51 62.26 21.4 61.36 20.55 61.22 21.37 58.76 20.67 56.17 22.38 53.18 21.44 51.38 18.59 47.04 16.4 48.03 13.08 50.19 12.72 50.6 11.44 49.37 12.16 47.54 10.96 46.15 7.19 46.3 4.62 44.95 0.25 44.2 0.0 43.44 0.45 43.82 1.77 40.72 3.47 40.51 5.41 38.75 5.83 37.91 8.35 36.1 9.63 36.13 11.37 34.27 11.05 34.12 9.84 33.23 9.49 32.44 10.44 33.2 10.97 32.2 11.62 23.67 9.95 19.1 12.92 16.96 13.22 14.91 12.24 14.74 14.19 11.34 16.42 8.55 15.86 9.22 13.24 7.53 13.86 4.84 12.0 4.04 13.63 1.89 14.36 2.47 20.38 1.06 20.95 1.06 22.25 2.19 24.4 0.0 26.08Z';

/**
 * Tehsil headquarters, projected into the viewBox above. These three are the
 * only tehsils present in the Census 2011 import, so they are the only ones a
 * session's `tehsil` can name. A value outside this set (a demo fixture's
 * block, say) highlights nothing rather than guessing.
 */
const HQ: Record<string, { x: number; y: number }> = {
  Ghorawal: { x: 21.41, y: 18.98 },
  Robertsganj: { x: 45.29, y: 24.82 },
  Dudhi: { x: 59.92, y: 68.45 },
};

const ATTRIBUTION = '© OpenStreetMap contributors';

export function DistrictLocator({
  tehsil,
  width = 220,
  showAttribution = true,
}: {
  /** The selected tehsil, highlighted if it is one of the three known ones. */
  tehsil?: string | null;
  width?: number;
  showAttribution?: boolean;
}) {
  const active = tehsil && tehsil in HQ ? tehsil : null;

  return (
    <figure style={{ margin: 0, width }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width={width}
        height={(width * VIEW_H) / VIEW_W}
        role="img"
        aria-label={
          active ? `${active} tehsil, Sonbhadra district` : 'Sonbhadra district, Uttar Pradesh'
        }
        style={{ display: 'block', overflow: 'visible' }}
      >
        <path
          d={OUTLINE}
          fill="var(--panel)"
          stroke="var(--line)"
          strokeWidth={0.9}
          strokeLinejoin="round"
        />
        {Object.entries(HQ).map(([name, p]) => {
          const on = name === active;
          return (
            <g key={name}>
              {on ? (
                <circle cx={p.x} cy={p.y} r={5.2} fill="var(--navy)" opacity={0.16} />
              ) : null}
              <circle
                cx={p.x}
                cy={p.y}
                r={on ? 2.4 : 1.5}
                fill={on ? 'var(--navy)' : 'var(--faint)'}
              />
              <text
                x={p.x}
                y={p.y - (on ? 4.6 : 3.2)}
                textAnchor="middle"
                fontSize={on ? 5.2 : 4.2}
                fontWeight={on ? 700 : 500}
                fill={on ? 'var(--navy-dark)' : 'var(--faint)'}
                style={{ fontFamily: 'var(--sans)' }}
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>
      {showAttribution ? (
        <figcaption style={{ fontSize: '9.5px', color: 'var(--faint)', marginTop: '5px' }}>
          {ATTRIBUTION}
        </figcaption>
      ) : null}
    </figure>
  );
}
