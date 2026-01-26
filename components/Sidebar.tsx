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
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <MapIcon className="w-8 h-8 text-indigo-400" />
        <span className="font-bold text-lg tracking-wide">MuseumMon</span>
      </div>

      <div className="p-6 flex-1 space-y-8">
        {/* Rating Filter */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FunnelIcon className="w-4 h-4" /> Filters
          </h4>
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Min Rating: <span className="text-indigo-400 font-bold">{minRating.toFixed(1)}</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="5" 
              step="0.1" 
              value={minRating} 
              onChange={(e) => onFilterChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0.0</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4" /> Time Range
          </h4>
          
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 appearance-none cursor-pointer hover:bg-slate-750 transition-colors"
            >
              <option value="1m">Last 1 Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
            </select>
            {/* Custom chevron to replace browser default if needed, or rely on browser default for simplicity */}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Affects history charts.
          </p>
        </div>

        {/* Actions */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Actions
          </h4>
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm ${loading ? 'opacity-75' : ''}`}
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Fetching Data...' : 'Refresh Data'}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Pulls live data via Gemini Maps Grounding.
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-slate-800 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Museum Monitor<br/>
        Powered by Gemini 2.5
      </div>
    </aside>
  );
};