import React from 'react';
import {
  FunnelIcon,
  ArrowPathIcon,
  MapIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  minRating: number;
  onFilterChange: (rating: number) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  minRating,
  onFilterChange,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  loading
}) => {
  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col h-full shrink-0 shadow-2xl">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700/50 bg-slate-800/50">
        <MapIcon className="w-8 h-8 text-indigo-400 drop-shadow-lg" />
        <span className="font-bold text-xl tracking-wide">MuseumMon</span>
      </div>

      <div className="p-6 flex-1 space-y-8 overflow-y-auto">
        {/* Rating Filter */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FunnelIcon className="w-4 h-4" /> Filters
          </h4>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Min Rating: <span className="text-indigo-400 font-bold text-lg">{minRating.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={minRating}
              onChange={(e) => onFilterChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0.0</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4" /> Time Range
          </h4>

          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 appearance-none cursor-pointer hover:bg-slate-750 transition-all shadow-sm"
            >
              <option value="1m">Last 1 Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Affects history charts.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Actions
          </h4>
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-800 disabled:to-indigo-900 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${loading ? 'opacity-75' : ''}`}
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Fetching Data...' : 'Refresh Data'}
          </button>
          <p className="mt-2 text-xs text-slate-500 text-center">
            Powered by OpenRouter AI
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-slate-700/50 text-xs text-slate-500 bg-slate-800/30">
        <div className="text-center space-y-1">
          <p>&copy; {new Date().getFullYear()} Museum Monitor</p>
          <p className="text-indigo-400 font-medium">Xiaomi MiMo v2 Flash</p>
        </div>
      </div>
    </aside>
  );
};