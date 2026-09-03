'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';
import { useCase } from '@/hooks/use-case';
import { label } from '@/domain/feasibility';
import { Stat, T } from '@/components';
import { DesktopShell, Legend } from '../shell';

/**
 * D-P3c. The suggested price and the band around it, straight from the report.
 * Exported separately from the page so the report can open it in a modal
 * without a second copy of the layout.
 */
export function PricingBody() {
  const { s } = useSession();
  const { report } = useCase();
  if (!report) return null;

  const unit = label(report.business.unit, s.lang);
  const money = (n: number) => (n < 10 ? `₹${n.toFixed(2)}` : `₹${n.toLocaleString('en-IN')}`);
  const { low, suggested, high } = report.pricing;
  const spread = Math.max(0.0001, high - low);
  const at = ((suggested - low) / spread) * 100;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 320px',
        gap: '30px',
        alignItems: 'start',
      }}
    >
      <div>
        <Legend>
          <T hi="दाम की पट्टी" en="The price band" />
        </Legend>

        <div style={{ textAlign: 'center', margin: '10px 0 26px' }}>
          <div style={{ fontSize: '54px', fontWeight: 700, color: 'var(--navy-dark)', lineHeight: 1 }}>
            {money(suggested)}
          </div>
          <div style={{ fontSize: '15px', color: 'var(--muted)', marginTop: '6px' }}>{unit}</div>
        </div>

        <div
          style={{
            position: 'relative',
            height: '14px',
            borderRadius: '7px',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '0',
              right: '0',
              top: '0',
              bottom: '0',
              borderRadius: '7px',
              background: 'linear-gradient(90deg,var(--teal-tint),var(--green-tint),var(--amber-tint))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${at}%`,
              top: '-7px',
              width: '4px',
              height: '28px',
              borderRadius: '2px',
              background: 'var(--navy)',
              transform: 'translateX(-2px)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--muted)',
            marginTop: '10px',
          }}
        >
          <span>{money(low)}</span>
          <span>{money(high)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '14px' }}>
        <Stat size="sm" label={<T hi="कम से कम" en="Low end" />} value={money(low)} />
        <Stat size="sm" tone="green" label={<T hi="सुझाया दाम" en="Suggested" />} value={money(suggested)} />
        <Stat
          size="sm"
          tone="amber"
          label={<T hi="ज़्यादा से ज़्यादा" en="High end" />}
          value={money(high)}
        />
      </div>
    </div>
  );
}

export default function PricingScreen() {
  return (
    <DesktopShell padding="36px 44px" title={<T hi="सुझाया दाम" en="Suggested price" />}>
      <PricingBody />
    </DesktopShell>
  );
}
