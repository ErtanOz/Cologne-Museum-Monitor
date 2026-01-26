import React from 'react';
import { FaceSmileIcon, FaceFrownIcon, FaceSmileIcon as FaceNeutralIcon } from '@heroicons/react/24/outline';

interface SentimentAnalysisProps {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ sentiment }) => {
  if (!sentiment || (sentiment.positive === 0 && sentiment.neutral === 0 && sentiment.negative === 0)) {
    return (
      <div className="h-24 flex items-center justify-center text-slate-400 text-sm">
        No sentiment data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual Bar */}
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div 
          style={{ width: `${sentiment.positive}%` }} 
          className="bg-green-500 h-full transition-all duration-500"
          title={`Positive: ${sentiment.positive}%`}
        />
        <div 
          style={{ width: `${sentiment.neutral}%` }} 
          className="bg-slate-400 h-full transition-all duration-500"
          title={`Neutral: ${sentiment.neutral}%`}
        />
        <div 
          style={{ width: `${sentiment.negative}%` }} 
          className="bg-red-500 h-full transition-all duration-500"
          title={`Negative: ${sentiment.negative}%`}
        />
      </div>

      {/* Legend / Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-green-700 text-sm font-medium">
             <FaceSmileIcon className="w-4 h-4" /> Positive
          </div>
          <span className="text-xl font-bold text-slate-800">{sentiment.positive}%</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-slate-600 text-sm font-medium">
             <FaceNeutralIcon className="w-4 h-4 text-slate-400" /> Neutral
          </div>
          <span className="text-xl font-bold text-slate-800">{sentiment.neutral}%</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
             <FaceFrownIcon className="w-4 h-4" /> Negative
          </div>
          <span className="text-xl font-bold text-slate-800">{sentiment.negative}%</span>
        </div>
      </div>
    </div>
  );
};