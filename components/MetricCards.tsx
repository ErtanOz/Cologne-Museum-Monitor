import React from 'react';
import { MuseumData } from '../types';
import { StarIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/solid';

interface MetricCardsProps {
  topMuseums: MuseumData[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ topMuseums }) => {
  const colors = [
    'bg-gradient-to-br from-yellow-400 to-yellow-600',
    'bg-gradient-to-br from-slate-300 to-slate-500',
    'bg-gradient-to-br from-orange-400 to-orange-600',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {topMuseums.map((museum, index) => (
        <div key={museum.name} className="relative overflow-hidden bg-white rounded-xl shadow-sm border border-slate-100 p-6 group hover:shadow-md transition-shadow">
          <div className={`absolute top-0 right-0 p-3 rounded-bl-xl text-white ${colors[index] || 'bg-slate-400'}`}>
            <TrophyIcon className="w-5 h-5" />
          </div>
          
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rank #{index + 1}</div>
              <h3 className="text-lg font-bold text-slate-800 line-clamp-1" title={museum.name}>
                {museum.name}
              </h3>
            </div>
            
            <div className="mt-4 flex items-end gap-4">
              <div className="flex items-center gap-1.5">
                <StarIcon className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold text-slate-900">{museum.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <UserGroupIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{museum.reviewCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {topMuseums.length === 0 && (
        <div className="col-span-3 text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          No data available to determine top museums.
        </div>
      )}
    </div>
  );
};