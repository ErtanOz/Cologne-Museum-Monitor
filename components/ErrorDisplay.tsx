import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4 mb-6">
      <ExclamationTriangleIcon className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-red-800 font-bold mb-1">Data Retrieval Failed</h3>
        <p className="text-red-600 text-sm mb-4">{message}</p>
        <button 
          onClick={onRetry}
          className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};