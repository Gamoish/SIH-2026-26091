'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';
import { useSession } from '@/hooks/use-session';
import { label } from '@/domain/feasibility';
import type { FeasibilityReport } from '@/domain/feasibility';
import { MOCK_COMPETITOR_POINTS, type MockCompetitorPoint } from '@/data/fixtures/sample-competitors';
import { DistrictLocator } from './district-locator';
import { T } from './bilingual';

/**
 * The competitor map.
 *
 * Leaflet with OpenStreetMap raster tiles, loaded only when this panel is
 * actually rendered - Mapbox and Google both forbid the tile caching this
 * audience needs, and a WebGL layer is a lot of bundle for a district-scale
 * disc of dots.
 *
 * WHAT IS REAL AND WHAT IS NOT. The village positions, the radius circle and
 * the number of dots are the engine's own figures. The individual dots are
 * invented sample data - see `sample-competitors.ts`. The badge saying so is
 * rendered outside the map pane on purpose, so it survives the offline
 * fallback below.
 *
 * OFFLINE. Tiles are the only thing here that needs the network. A tile error,
 * or six seconds without a single tile, swaps the whole pane for the static
 * district locator plus a plain list - never a grey box.
 */

const TILE_TIMEOUT_MS = 6000;

// Literals, not var(--navy): Leaflet writes these into SVG presentation
// attributes, where a CSS custom property does not resolve. Mirrors tokens.css.
const NAVY = '#123b6d';
const RUST = '#a9321f';

type State = 'loading' | 'live' | 'fallback';

export function CompetitorMap({ report, height = 380 }: { report: FeasibilityReport; height?: number }) {
  const { s } = useSession();
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const [state, setState] = useState<State>('loading');

  const points = useMemo(() => MOCK_COMPETITOR_POINTS(report), [report]);

  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    let ro: ResizeObserver | undefined;

    (async () => {
      const L = (await import('leaflet')).default;
      if (!live || !el.current) return;

      const centre: [number, number] = [report.village.lat, report.village.lng];
      const m = L.map(el.current, { attributionControl: true, scrollWheelZoom: false }).setView(
        centre,
        report.radiusKm <= 3 ? 13 : report.radiusKm <= 5 ? 12 : 11,
      );
      map.current = m;

      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '© OpenStreetMap contributors',
      });
      /**
       * Fall back only when NOT ONE tile arrives - either every request errors,
       * or nothing answers inside the timeout. A single failed tile on a flaky
       * link is not worth throwing the map away for.
       *
       * Deliberately not Leaflet's `load` event: it fires once the layer stops
       * loading, and an errored tile counts as finished, so `load` arrives even
       * when every tile failed and would clobber the fallback.
       */
      let loaded = 0;
      let settled = false;
      const settle = (next: State) => {
        if (!live || settled) return;
        settled = true;
        setState(next);
      };
      tiles.on('tileload', () => {
        loaded++;
        settle('live');
      });
      tiles.on('tileerror', () => loaded === 0 && settle('fallback'));
      timer = setTimeout(() => loaded === 0 && settle('fallback'), TILE_TIMEOUT_MS);
      tiles.addTo(m);

      // The radius the user chose, and their own village at its centre.
      const ring = L.circle(centre, {
        radius: report.radiusKm * 1000,
        color: NAVY,
        weight: 1.4,
        dashArray: '5 4',
        fillOpacity: 0.05,
      }).addTo(m);
      L.circleMarker(centre, {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: NAVY,
        fillOpacity: 1,
      })
        .addTo(m)
        .bindPopup(
          `<b>${label(report.village.name, s.lang)}</b><br>${s.lang === 'en' ? 'your village' : 'आपका गाँव'}`,
        );

      // Sample points. circleMarker, not Marker: no icon image to 404 offline.
      for (const p of points) {
        L.circleMarker([p.lat, p.lng], {
          radius: 5,
          color: '#fff',
          weight: 1.5,
          fillColor: RUST,
          fillOpacity: 0.9,
        })
          .addTo(m)
          .bindPopup(
            `<b>${label(p.name, s.lang)}</b><br>${label(p.village, s.lang)} · ${p.km} km<br>` +
              `<i>${s.lang === 'en' ? 'sample data, not a real listing' : 'नमूना आँकड़ा, असली दुकान नहीं'}</i>`,
          );
      }

      // The ring that is already on the map, not a fresh one: Circle.getBounds()
      // projects through `this._map`, so an unadded circle throws.
      m.fitBounds(ring.getBounds(), { padding: [12, 12] });

      // The container is not always its final size when the map is built: the
      // report opens this inside a <dialog> that showModal()s after the child
      // effect runs, and the phone mounts it as a <details> expands. Without
      // this the map lays out against a zero-height box and stays blank.
      ro = new ResizeObserver(() => m.invalidateSize());
      ro.observe(el.current);
      // Anything thrown in here is an unhandled rejection - invisible outside
      // the dev overlay, and it leaves a half-built map on screen. The list
      // fallback is the honest thing to show instead.
    })().catch(() => {
      if (live) setState('fallback');
    });

    return () => {
      live = false;
      clearTimeout(timer);
      ro?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, [report, points, s.lang]);

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      <SampleBadge count={report.totalCompetitors} />

      {state === 'fallback' ? (
        <Fallback report={report} points={points} lang={s.lang} />
      ) : (
        <div
          ref={el}
          role="application"
          aria-label={s.lang === 'en' ? 'Competitor map' : 'प्रतियोगी नक्शा'}
          style={{
            height: `${height}px`,
            borderRadius: '12px',
            border: '1px solid var(--line)',
            background: 'var(--panel)',
            zIndex: 0,
          }}
        />
      )}
    </div>
  );
}

/**
 * Always visible, and outside the map pane so the fallback keeps it. Amber is
 * what the village picker already uses to mark a demo row.
 */
function SampleBadge({ count }: { count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '4px 8px',
        background: 'var(--saffron-tint)',
        border: '1px solid var(--amber)',
        borderRadius: '9px',
        padding: '8px 11px',
        fontSize: '12px',
        lineHeight: 1.5,
        color: '#8A4E06',
      }}
    >
      <b style={{ fontWeight: 700 }}>
        <T hi="नमूना आँकड़े — सिर्फ़ दिखाने के लिए" en="Sample data — for demonstration" />
      </b>
      <span>
        <T
          hi={`दुकानों की जगह बनाई हुई है, किसी सरकारी सूची से नहीं। गिनती (${count}) रिपोर्ट की अपनी है।`}
          en={`Shop positions are invented, not from any government listing. The count (${count}) is the report's own figure.`}
        />
      </span>
    </div>
  );
}

/** No tiles: the static district outline plus the same points as a list. */
function Fallback({
  report,
  points,
  lang,
}: {
  report: FeasibilityReport;
  points: MockCompetitorPoint[];
  lang: 'hi' | 'en';
}) {
  return (
    <div
      className="dc-desk-card"
      style={{ padding: '14px 16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
    >
      <div style={{ flex: 'none' }}>
        <DistrictLocator tehsil={report.village.block} width={150} />
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px', maxWidth: '150px' }}>
          <T hi="नक्शा नहीं आ सका — नेटवर्क नहीं" en="Map tiles unavailable — no network" />
        </div>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', flex: 1, display: 'grid', gap: '6px' }}>
        {points.map((p) => (
          <li
            key={p.id}
            style={{ fontSize: '12.5px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}
          >
            <span>{label(p.name, lang)}</span>
            <span style={{ color: 'var(--faint)', whiteSpace: 'nowrap' }}>
              {label(p.village, lang)} · {p.km} km
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
