import React from 'react';
import { T } from './bilingual';
import { Alternatives } from './alternatives';
import type { CapitalFit } from '@/domain/feasibility';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * A note that the applicant's own capital falls short of the contribution the
 * scheme expects on this business, shown above the loan figures on the money
 * screens.
 *
 * ADVISORY ONLY. It never hides or changes the plan beneath it - the EMI,
 * tenure and repayment table all compute and display exactly as before. The
 * hard ₹2,000 floor is a different, separate gate that refuses to calculate at
 * all; this one just says "tight" and lets the user decide.
 *
 * Amber, the app's established "read this" colour, rather than a red error:
 * a small plan is a real plan, not a mistake.
 */
export function CapitalFitNote({ fit }: { fit: CapitalFit | null }) {
  if (!fit) return null;

  return (
    <div
      style={{
        background: 'var(--saffron-tint)',
        border: '1px solid var(--amber-line)',
        borderRadius: '12px',
        padding: '11px 13px',
        color: '#8A4E06',
      }}
    >
      <div style={{ fontSize: '12.5px', fontWeight: 700 }}>
        <T
          hi={`${fit.business.name.hi} के लिए यह रकम तंग है`}
          en={`This is tight for ${fit.business.name.en.toLowerCase()}`}
        />
      </div>
      <div style={{ fontSize: '11.5px', lineHeight: 1.55, marginTop: '3px' }}>
        <T
          hi={`आम तौर पर ऐसा काम शुरू करने में करीब ${inr(fit.anchorCost)} लगते हैं, जिसमें से ${inr(fit.requiredMargin)} आपका अपना हिस्सा बनता है — आपके पास ${inr(fit.capital)} हैं। नीचे का हिसाब फिर भी चलेगा — पर थोड़ी और पूँजी पर सोचिए।`}
          en={`A typical setup costs around ${inr(fit.anchorCost)}, of which ${inr(fit.requiredMargin)} has to be your own — you have ${inr(fit.capital)}. The figures below still work — but consider more capital.`}
        />
      </div>

      {/* The same ranked list the report screen uses, narrowed to the ones this
          capital can actually margin. Renders nothing when empty. */}
      <Alternatives items={fit.alternatives} style={{ marginTop: '10px' }} />
    </div>
  );
}
