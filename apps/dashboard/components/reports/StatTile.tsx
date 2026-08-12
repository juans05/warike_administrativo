'use client';

import React, { useState } from 'react';
import { DELTA_POSITIVE, DELTA_NEGATIVE } from '../../lib/report-colors';

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  changePct?: number;
  isPositive?: boolean;
  tooltip?: string;
  accentClassName?: string;
}

export function StatTile({ icon, label, value, changePct, isPositive, tooltip, accentClassName = 'bg-orange-50 text-[#F26122]' }: StatTileProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hasDelta = typeof changePct === 'number';
  const deltaColor = isPositive ? DELTA_POSITIVE : DELTA_NEGATIVE;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentClassName}`}>
          {icon}
        </div>
        {tooltip && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(v => !v)}
              className="text-gray-300 hover:text-gray-400"
              aria-label={tooltip}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-6 z-10 w-52 bg-gray-900 text-white text-[11px] leading-relaxed rounded-lg p-2.5 shadow-lg">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
      {hasDelta && (
        <div className="flex items-center gap-1 mt-1.5" style={{ color: deltaColor }}>
          <svg className={`w-3 h-3 ${changePct! >= 0 ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L5.707 9.707a1 1 0 01-1.414-1.414l5-5A1 1 0 0110 3z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-bold">
            {changePct! >= 0 ? '+' : ''}{changePct}% vs. período anterior
          </span>
        </div>
      )}
    </div>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="w-9 h-9 rounded-xl bg-gray-100 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
      <div className="h-7 bg-gray-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  );
}
