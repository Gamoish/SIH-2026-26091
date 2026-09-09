import React from 'react';
import { T } from './bilingual';

/**
 * The one disclosure that has to sit under any screen showing scheme terms or
 * modelled market figures.
 *
 * Both kinds of number on those screens are honest-but-not-authoritative: the
 * rate/tenure/moratorium come from published scheme structures rather than a
 * live circular, and everything derived from competitor density is modelled on
 * demo data. A user reading "6% interest" or "Rs 1,57,153 a year" has no way to
 * tell that from a quoted fact unless the screen says so.
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
        hi="यहाँ दिए आँकड़े सिर्फ़ अनुमान हैं — प्रकाशित योजना ढाँचे और नमूना स्थानीय आँकड़ों पर आधारित। आवेदन से पहले अपनी बैंक शाखा या NSFDC/NSTFDC कार्यालय से मौजूदा शर्तें ज़रूर पूछ लें।"
        en="Figures shown are illustrative, based on published scheme structures and modelled local data — confirm current terms with your bank or NSFDC/NSTFDC office before applying."
      />
    </div>
  );
}
