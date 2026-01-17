import React from 'react';
import { FaceSmileIcon, FaceFrownIcon, NoSymbolIcon } from '@heroicons/react/24/solid';
import { FaceSmileIcon as FaceSmileOutline } from '@heroicons/react/24/outline';

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
      <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic">
        No sentiment data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <FaceSmileOutline className="w-6 h-6 text-indigo-600" />
        <h3 className="text-xl font-bold text-slate-800">Sentiment</h3>
      </div>

      {/* Visual Bar */}
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        <div
          style={{ width: `${sentiment.positive}%` }}
          className="bg-green-500 h-full transition-all duration-700 ease-out"
          title={`Positive: ${sentiment.positive}%`}
        />
        <div
          style={{ width: `${sentiment.neutral}%` }}
          className="bg-slate-400 h-full transition-all duration-700 ease-out"
          title={`Neutral: ${sentiment.neutral}%`}
        />
        <div
          style={{ width: `${sentiment.negative}%` }}
          className="bg-red-500 h-full transition-all duration-700 ease-out"
          title={`Negative: ${sentiment.negative}%`}
        />
      </div>

      {/* Legend / Stats */}
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-semibold mb-1">
            <FaceSmileIcon className="w-5 h-5" /> Positive
          </div>
          <span className="text-2xl font-black text-slate-800">{sentiment.positive}%</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold mb-1">
            <FaceSmileIcon className="w-5 h-5 text-slate-400" /> Neutral
          </div>
          <span className="text-2xl font-black text-slate-800">{sentiment.neutral}%</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-red-500 text-sm font-semibold mb-1">
            <FaceFrownIcon className="w-5 h-5" /> Negative
          </div>
          <span className="text-2xl font-black text-slate-800">{sentiment.negative}%</span>
        </div>
      </div>
    </div>
  );
};