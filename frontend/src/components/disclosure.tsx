import React from 'react';
import { T } from './bilingual';

/**
 * The one disclosure that has to sit under any screen showing scheme terms or
 * modelled market figures.
 *
 * The two halves now have DIFFERENT standing, and the wording says so rather
 * than flattening them into one hedge:
 *
 *  - Scheme terms (rate, tenure, moratorium, contribution) are real, sourced
 *    and dated - NSFDC's own scheme page as of 08.09.2026, NSTFDC via
 *    PIB/Ministry of Tribal Affairs. See `schemes.ts`.
 *  - The market figures are still modelled on demo fixtures.
 *
 * The "confirm before applying" half stays regardless of sourcing: government
 * scheme terms are revised, an SCA can apply its own conditions, and a dated
 * snapshot is not a sanction letter. That is honest even when the number is.
 *
 * Deliberately one note per screen, not a caveat on every line: a figure
 * fenced individually reads as doubtful, while a screen that says once where
 * its numbers come from reads as careful. Same amber as `GeneralNote` and the
 * competitor map's sample badge, so it is the app's established "read this"
 * colour rather than a new alarm.
 */
export function IllustrativeNote({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontSize: '11.5px',
        lineHeight: 1.55,
        color: '#8A4E06',
        background: 'var(--saffron-tint)',
        borderRadius: '10px',
        padding: '10px 12px',
        ...style,
      }}
    >
      <T
        hi="योजना की शर्तें (ब्याज़, अवधि, छूट) NSFDC/NSTFDC के प्रकाशित आँकड़ों से हैं (08.09.2026)। बाज़ार के आँकड़े नमूना हैं। शर्तें बदलती रहती हैं — आवेदन से पहले अपनी SCA या बैंक शाखा से मौजूदा शर्तें ज़रूर पूछ लें।"
        en="Scheme terms (interest, tenure, moratorium) are the published NSFDC/NSTFDC figures as of 08.09.2026; the market figures are modelled sample data. Scheme terms are revised from time to time — confirm current terms with your SCA or bank before applying."
      />
    </div>
  );
}
