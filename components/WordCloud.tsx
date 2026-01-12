import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';

interface WordCloudProps {
  keywords: { text: string; value: number }[];
}

export const WordCloud: React.FC<WordCloudProps> = ({ keywords }) => {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
        <TagIcon className="w-8 h-8 mb-2 opacity-50" />
        <p>No keywords available</p>
      </div>
    );
  }

  // Normalize values for sizing logic (min 1, max 10 from API)
  // We map 1-10 to font sizes 0.75rem to 1.5rem
  const getFontSize = (value: number) => {
    const minSize = 0.75;
    const maxSize = 1.75;
    const normalized = Math.max(0, Math.min(10, value)) / 10; // 0 to 1
    return `${minSize + (normalized * (maxSize - minSize))}rem`;
  };

  const getOpacity = (value: number) => {
    return 0.6 + (value / 10) * 0.4;
  };

  const colors = [
    'text-indigo-600',
    'text-blue-600',
    'text-violet-600',
    'text-fuchsia-600',
    'text-slate-600',
    'text-cyan-600'
  ];

  return (
    <div className="h-full flex flex-wrap items-center justify-center content-center gap-x-4 gap-y-2 p-4">
      {keywords.map((word, idx) => (
        <span
          key={idx}
          className={`font-semibold transition-all duration-300 hover:scale-110 cursor-default ${colors[idx % colors.length]}`}
          style={{
            fontSize: getFontSize(word.value),
            opacity: getOpacity(word.value),
          }}
          title={`Relevance score: ${word.value}/10`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
};