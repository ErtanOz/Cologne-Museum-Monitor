import React from 'react';
import { MuseumData } from '../types';
import { StarIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/solid';

interface MetricCardsProps {
  topMuseums: MuseumData[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ topMuseums }) => {
  const colors = [
    'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600',
    'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500',
    'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600',
  ];

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {topMuseums.map((museum, index) => (
        <div
          key={museum.name}
          className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 group hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slideUp"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={`absolute top-0 right-0 p-3 rounded-bl-xl text-white shadow-lg ${colors[index] || 'bg-slate-400'}`}>
            <TrophyIcon className="w-6 h-6 drop-shadow-md" />
          </div>

          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="text-2xl">{medals[index]}</span>
                Rank #{index + 1}
              </div>
              <h3 className="text-lg font-bold text-slate-800 line-clamp-2 min-h-[3.5rem]" title={museum.name}>
                {museum.name}
              </h3>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div className="flex items-center gap-2">
                <StarIcon className="w-7 h-7 text-yellow-500 drop-shadow-sm" />
                <span className="text-3xl font-bold text-slate-900">{museum.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <UserGroupIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{museum.reviewCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {topMuseums.length === 0 && (
        <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200 animate-pulse">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          No data available to determine top museums.
        </div>
      )}
    </div>
  );
};