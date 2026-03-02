import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MuseumData, MuseumHistory } from '../types';

interface TooltipPayloadEntry {
  dataKey?: string;
  value?: number | string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const RankingTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const ratingEntry = payload.find((entry) => entry.dataKey === 'rating') ?? payload[0];
  const rawReviewCount = ratingEntry?.payload?.reviewCount;
  const reviewCount = typeof rawReviewCount === 'number' ? rawReviewCount : Number(rawReviewCount) || 0;
  const rating = Number(ratingEntry?.value) || 0;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs">
      <p className="font-bold mb-1 border-b border-slate-700 pb-1">{label}</p>
      <p className="text-yellow-400 mt-1">
        Rating: <span className="font-black">{rating.toFixed(1)}</span>
      </p>
      <p className="text-indigo-400">
        Reviews: <span className="font-black">{reviewCount.toLocaleString()}</span>
      </p>
    </div>
  );
};

const TrendTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const ratingEntry = payload.find((entry) => entry.dataKey === 'rating');
  const reviewEntry = payload.find((entry) => entry.dataKey === 'reviewCount');

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs min-w-[180px]">
      <p className="font-bold mb-1 border-b border-slate-700 pb-1">{label}</p>
      <p className="text-yellow-400 mt-1">
        Rating: <span className="font-black">{(Number(ratingEntry?.value) || 0).toFixed(1)}</span>
      </p>
      <p className="text-indigo-400">
        Reviews: <span className="font-black">{(Number(reviewEntry?.value) || 0).toLocaleString()}</span>
      </p>
    </div>
  );
};

const SafeChartContainer: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setReady(rect.width > 0 && rect.height > 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={hostRef} className={className}>{ready ? children : null}</div>;
};

export const RankingChart: React.FC<{ data: MuseumData[] }> = ({ data }) => {
  const chartData = useMemo(() => [...data].sort((a, b) => b.rating - a.rating).slice(0, 10), [data]);

  return (
    <SafeChartContainer className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" domain={[0, 5]} hide />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} interval={0} />
          <Tooltip content={<RankingTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="rating" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </SafeChartContainer>
  );
};

export const TrendChart: React.FC<{ data: MuseumHistory[] }> = ({ data }) => {
  if (!data?.length) {
    return (
      <div className="h-80 w-full flex flex-col items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
        <div className="w-12 h-12 mb-2 bg-slate-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
          </svg>
        </div>
        Select a museum to view trends
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <SafeChartContainer className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickFormatter={(dateString) => {
              const date = new Date(dateString);
              return `${date.toLocaleString('default', { month: 'short' })} '${date.getFullYear().toString().slice(-2)}`;
            }}
            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Line yAxisId="left" type="monotone" dataKey="rating" stroke="#eab308" strokeWidth={3} name="Rating" dot={{ r: 4, fill: '#eab308', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1500} />
          <Line yAxisId="right" type="monotone" dataKey="reviewCount" stroke="#6366f1" strokeWidth={3} name="Reviews" dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={1500} />
        </LineChart>
      </ResponsiveContainer>
    </SafeChartContainer>
  );
};
