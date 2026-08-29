'use client';
import React from 'react';
import { useNav } from '@/lib/nav';
import { useCase } from '@/hooks/use-case';
import { isGap } from '@/domain/finance';
import { inr } from '@/lib/format';
import { Header, Primary, T } from '@/components';

export default function EmiScreen() {
  const nav = useNav();
  const { report, plan } = useCase();
  if (!plan || isGap(plan)) return null;

  const monthly = report ? report.estimatedAnnualRevenue / 12 : 0;
  const emiShare = monthly > 0 ? Math.round((plan.emi / monthly) * 100) : null;
  const gracePct = (plan.moratoriumMonths / plan.tenureMonths) * 100;
  const reserve = plan.emi * 3;

  return (
    <div className="dc-phone">
      <Header onBack={() => nav.go('scheme')} title={<T hi="वापसी का समय" en="Repayment plan" />} />

      <div style={{ flex: 1, padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ background: 'var(--navy)', color: '#fff', borderRadius: '16px', padding: '15px 16px', boxShadow: 'var(--e2)', display: 'flex', alignItems: 'center', gap: '14px', backgroundImage: 'var(--ledger-ink)' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#9FB6D3' }}><T hi="हर महीने किश्त (EMI)" en="Monthly instalment (EMI)" /></div>
            <div style={{ fontSize: '40px', fontWeight: 700, lineHeight: 1 }}>{inr(plan.emi)}</div>
            <div style={{ fontSize: '11px', color: '#9FB6D3', marginTop: '3px' }}>
              <T
                hi={`माह ${plan.moratoriumMonths + 1} से · ${plan.instalmentCount} किश्तें`}
                en={`From month ${plan.moratoriumMonths + 1} · ${plan.instalmentCount} instalments`}
              />
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right', background: 'var(--saffron-tint)', color: '#8A4E06', borderRadius: '10px', padding: '9px 11px' }}>
            <div style={{ fontSize: '11px' }}><T hi={`शुरू ${plan.moratoriumMonths} माह`} en={`First ${plan.moratoriumMonths} months`} /></div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}><T hi="कुछ नहीं" en="Nothing" /></div>
            <div style={{ fontSize: '9.5px' }}><T hi="छूट (moratorium)" en="Grace (moratorium)" /></div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '14px', padding: '13px', boxShadow: 'var(--e1)' }}>
          <div style={{ display: 'flex', height: '38px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--line)' }}>
            <div style={{ width: `${gracePct}%`, background: 'repeating-linear-gradient(45deg,var(--saffron) 0,var(--saffron) 6px,#B8540A 6px,#B8540A 12px)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '10px', fontWeight: 700 }}>
              <T hi="छूट" en="Grace" />
            </div>
            <div style={{ flex: 1, background: 'var(--navy)', display: 'flex', alignItems: 'center', paddingLeft: '12px', color: '#fff', fontSize: '11.5px', fontWeight: 600 }}>
              <T hi={`${plan.instalmentCount} किश्तें · ${inr(plan.emi)}`} en={`${plan.instalmentCount} instalments · ${inr(plan.emi)}`} />
            </div>
          </div>
          <div style={{ display: 'flex', fontSize: '10px', color: 'var(--muted)', marginTop: '6px' }}>
            <div style={{ width: `${gracePct}%` }}>M0</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
              <span>M{plan.moratoriumMonths + 1}</span>
              <span>M{Math.round(plan.tenureMonths / 2)}</span>
              <span>M{plan.tenureMonths} <T hi="पूरा" en="done" /></span>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '14px', padding: '14px', boxShadow: 'var(--e1)', flex: 1 }}>
          <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: '10px' }}><T hi="साल-वार हिसाब" en="Year by year" /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {plan.years.map((y) => {
              const last = y.balance === 0;
              const dot = y.hasGrace ? 'var(--saffron)' : last ? 'var(--green)' : 'var(--navy)';
              return (
                <div key={y.year} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: dot, flex: 'none', boxShadow: `0 0 0 3px ${dot}22` }} />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px dashed var(--line)', paddingBottom: '7px' }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600 }}><T hi={`साल ${y.year}`} en={`Year ${y.year}`} /></div>
                      <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                        {y.hasGrace
                          ? <T hi={`${plan.moratoriumMonths} माह छूट + ${y.instalments} किश्तें`} en={`${plan.moratoriumMonths} months grace + ${y.instalments} instalments`} />
                          : <T hi={`${y.instalments} किश्तें · शेष ${inr(y.balance)}`} en={`${y.instalments} instalments · ${inr(y.balance)} left`} />}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: last ? 'var(--green)' : 'var(--text)' }}>{inr(y.paid)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'var(--navy-800)', color: '#fff', borderRadius: '12px', padding: '11px 13px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#9FB6D3' }}><T hi="कुल वापस" en="Total repaid" /></div>
            <div style={{ fontSize: '18px', fontWeight: 700 }}>{inr(plan.totalRepaid)}</div>
          </div>
          <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,.18)' }} />
          {emiShare != null ? (
            <div>
              <div style={{ fontSize: '11px', color: '#9FB6D3' }}><T hi="कमाई से किश्त" en="EMI vs income" /></div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: emiShare > 40 ? '#E6B94F' : '#CFE7D8' }}>~{emiShare}%</div>
            </div>
          ) : null}
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#9FB6D3' }}><T hi="सुरक्षित नक़दी" en="Safe reserve" /></div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--saffron-tint)' }}>{inr(reserve)}</div>
          </div>
        </div>

        <Primary onClick={() => nav.go('share')} arrow>
          <T hi="आगे · बैंक को दिखाइए" en="Next · show to the bank" />
        </Primary>
      </div>
    </div>
  );
}
