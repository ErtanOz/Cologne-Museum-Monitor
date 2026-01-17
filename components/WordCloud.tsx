import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface WordCloudProps {
  keywords: { text: string; value: number }[];
}

export const WordCloud: React.FC<WordCloudProps> = ({ keywords }) => {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
        <ChatBubbleLeftRightIcon className="w-10 h-10 mb-2 opacity-20" />
        <p className="font-medium">No topics identified yet</p>
      </div>
    );
  }

  // Map values 1-10 to font sizes 1.25rem to 2.5rem for a "premium" list feel
  const getFontSize = (value: number) => {
    const minSize = 1.25;
    const maxSize = 2.5;
    const normalized = Math.max(0, Math.min(10, value)) / 10;
    return `${minSize + (normalized * (maxSize - minSize))}rem`;
  };

  const getOpacity = (value: number) => {
    return 0.7 + (value / 10) * 0.3;
  };

  // High-end curated purple/blue palette
  const colors = [
    'text-indigo-600',
    'text-violet-600',
    'text-blue-600',
    'text-purple-600',
    'text-fuchsia-600',
    'text-indigo-500',
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50/30 rounded-xl border border-slate-100/50">
      <div className="flex items-center gap-2 mb-6 self-start">
        <ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-600" />
        <h3 className="text-xl font-bold text-slate-800">Review Topics</h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full scale-90 sm:scale-100">
        {keywords.slice(0, 5).map((word, idx) => (
          <span
            key={idx}
            className={`font-black tracking-tight leading-tight transition-all duration-500 hover:scale-110 cursor-default drop-shadow-sm ${colors[idx % colors.length]}`}
            style={{
              fontSize: getFontSize(word.value),
              opacity: getOpacity(word.value),
              textAlign: 'center'
            }}
            title={`Topic importance: ${word.value}/10`}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
};