/** @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { deriveKeywords, deriveSentiment } from './analysis';

describe('analysis', () => {
  it('derives sentiment percentages from review ratings', () => {
    const sentiment = deriveSentiment(
      [
        { authorName: 'A', rating: 5, text: 'excellent collection', relativeTime: '1 day ago' },
        { authorName: 'B', rating: 4, text: 'great museum', relativeTime: '2 days ago' },
        { authorName: 'C', rating: 3, text: 'okay', relativeTime: '3 days ago' },
        { authorName: 'D', rating: 1, text: 'crowded', relativeTime: '4 days ago' },
      ],
      4.2
    );

    expect(sentiment.positive).toBe(50);
    expect(sentiment.neutral).toBe(25);
    expect(sentiment.negative).toBe(25);
  });

  it('extracts top keywords from review samples', () => {
    const keywords = deriveKeywords([
      { authorName: 'A', rating: 5, text: 'Beautiful architecture and peaceful atmosphere', relativeTime: '1 day ago' },
      { authorName: 'B', rating: 5, text: 'Great architecture and design details', relativeTime: '2 days ago' },
      { authorName: 'C', rating: 4, text: 'Architecture is impressive', relativeTime: '3 days ago' },
    ]);

    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords[0].text).toBe('architecture');
  });
});
