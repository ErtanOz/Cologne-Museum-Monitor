import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';
import { MuseumData, MuseumHistory } from '../types';

// Custom Tooltip for Bar Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-yellow-400">Rating: {payload[0].value}</p>
        <p className="text-slate-300">Reviews: {payload[0].payload.reviewCount.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export const RankingChart: React.FC<{ data: MuseumData[] }> = ({ data }) => {
  // Sort data descending by rating for the chart
  const chartData = [...data].sort((a, b) => b.rating - a.rating).slice(0, 10); // Top 10 only to avoid clutter

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" domain={[0, 5]} hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={150} 
            tick={{fontSize: 11, fill: '#64748b'}} 
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
          <Bar dataKey="rating" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TrendChart: React.FC<{ data: MuseumHistory[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-lg">
        Select a museum to view trends
      </div>
    );
  }

  // Reverse data if needed, assuming API returns descending dates, but we want ascending for chart
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => {
              const d = new Date(str);
              return `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().substr(2)}`;
            }}
            tick={{fontSize: 11, fill: '#64748b'}}
          />
          <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 11, fill: '#64748b'}} />
          <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 11, fill: '#64748b'}} />
          <Tooltip 
            contentStyle={{backgroundColor: '#1e293b', borderColor: '#1e293b', color: '#fff', borderRadius: '8px'}}
            itemStyle={{color: '#fff'}}
          />
          <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="rating" 
            stroke="#eab308" 
            strokeWidth={2} 
            name="Rating"
            dot={{r: 4, fill: '#eab308'}}
            activeDot={{r: 6}}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="reviewCount" 
            stroke="#6366f1" 
            strokeWidth={2} 
            name="Reviews"
            dot={{r: 4, fill: '#6366f1'}}
            activeDot={{r: 6}}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};