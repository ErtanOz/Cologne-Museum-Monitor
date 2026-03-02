import React from 'react';
import { FetchDiagnostics, FetchStatus } from '../types';

interface HeaderProps {
  title: string;
  lastUpdated: Date | null;
  fetchStatus: FetchStatus;
  diagnostics: FetchDiagnostics;
}

export const Header: React.FC<HeaderProps> = ({ title, lastUpdated, fetchStatus, diagnostics }) => {
  const showUpdated = fetchStatus === 'success' && !diagnostics.stale && !diagnostics.refreshSkipped;
  const showSkipped = diagnostics.refreshSkipped && fetchStatus !== 'loading';
  const showStale = diagnostics.stale && fetchStatus !== 'loading' && fetchStatus !== 'idle';
  const sourceLabel = diagnostics.provider === 'synthetic_engine' ? 'Synthetic Engine' : 'Google Places API';

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">Cologne, Germany</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showUpdated && (
          <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Updated
          </span>
        )}

        {showSkipped && (
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            Skipped (throttle)
          </span>
        )}

        {showStale && (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Stale
          </span>
        )}

        {diagnostics.partial && (
          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
            Partial
          </span>
        )}

        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          Data source: {sourceLabel}
        </span>

        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Last Sync: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
        </div>
      </div>
    </header>
  );
};
