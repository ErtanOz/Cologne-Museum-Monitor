import React from 'react';

interface HeaderProps {
  title: string;
  lastUpdated: Date | null;
}

export const Header: React.FC<HeaderProps> = ({ title, lastUpdated }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">Cologne, Germany</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
      </div>
    </header>
  );
};