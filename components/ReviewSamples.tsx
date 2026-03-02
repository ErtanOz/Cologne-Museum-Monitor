import React from 'react';
import { ChatBubbleLeftRightIcon, StarIcon } from '@heroicons/react/24/solid';
import { ReviewSample } from '../types';

interface ReviewSamplesProps {
  reviews: ReviewSample[];
}

export const ReviewSamples: React.FC<ReviewSamplesProps> = ({ reviews }) => {
  if (!reviews.length) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
        <ChatBubbleLeftRightIcon className="w-8 h-8 mb-2 opacity-50" />
        <p>No review samples available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
      {reviews.map((review, index) => (
        <article key={`${review.authorName}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <header className="flex items-center justify-between gap-3 mb-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{review.authorName}</h4>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 shrink-0">
              <StarIcon className="w-3.5 h-3.5" />
              {review.rating.toFixed(1)}
            </span>
          </header>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{review.text || 'No text provided.'}</p>
          <p className="text-xs text-slate-400 mt-1">{review.relativeTime}</p>
        </article>
      ))}
    </div>
  );
};
