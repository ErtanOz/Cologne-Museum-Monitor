import React, { useMemo, useState } from 'react';
import { MuseumData } from '../types';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MuseumTableProps {
  data: MuseumData[];
  onSelect: (name: string) => void;
  selectedId: string | null;
}

type SortField = 'name' | 'rating' | 'reviewCount';

export const MuseumTable: React.FC<MuseumTableProps> = ({ data, onSelect, selectedId }) => {
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortField(field);
    setSortDirection('desc');
  };

  const searchedData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return data;
    }

    return data.filter((museum) => {
      const name = museum.name.toLowerCase();
      const address = (museum.address ?? '').toLowerCase();
      return name.includes(query) || address.includes(query);
    });
  }, [data, searchQuery]);

  const sortedData = useMemo(() => {
    return [...searchedData].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }, [searchedData, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <div className="w-4 h-4 ml-1 opacity-20">
          <ChevronDownIcon />
        </div>
      );
    }

    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4 ml-1 text-indigo-500" />
    ) : (
      <ChevronDownIcon className="w-4 h-4 ml-1 text-indigo-500" />
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="px-6 py-4 border-b border-slate-100 bg-white">
        <label className="relative block">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by museum or address..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            aria-label="Search museum by name or address"
          />
        </label>
      </div>

      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-medium">
          <tr>
            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
              <div className="flex items-center">
                Museum Name
                <SortIcon field="name" />
              </div>
            </th>
            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors text-right" onClick={() => handleSort('rating')}>
              <div className="flex items-center justify-end">
                Rating
                <SortIcon field="rating" />
              </div>
            </th>
            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors text-right" onClick={() => handleSort('reviewCount')}>
              <div className="flex items-center justify-end">
                Reviews
                <SortIcon field="reviewCount" />
              </div>
            </th>
            <th className="px-6 py-4 text-center">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedData.map((museum) => (
            <tr
              key={museum.name}
              onClick={() => onSelect(museum.name)}
              className={`
                hover:bg-slate-50 cursor-pointer transition-colors
                ${selectedId === museum.name ? 'bg-indigo-50/50 hover:bg-indigo-50' : ''}
              `}
            >
              <td className="px-6 py-4 font-medium text-slate-800">
                {museum.name}
                <div className="text-xs text-slate-400 font-normal truncate max-w-[220px]">{museum.address}</div>
              </td>
              <td className="px-6 py-4 text-right">
                <span
                  className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${museum.rating >= 4.5 ? 'bg-green-100 text-green-800' : museum.rating >= 4.0 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}
                `}
                >
                  {museum.rating.toFixed(1)}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-mono text-slate-500">{museum.reviewCount.toLocaleString()}</td>
              <td className="px-6 py-4 text-center">
                <a
                  href={museum.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                  onClick={(event) => event.stopPropagation()}
                  title="View on Google Maps"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </td>
            </tr>
          ))}

          {sortedData.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                No museums found matching your search or filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
