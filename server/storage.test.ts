/** @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { upsertDailyHistory } from './storage';
import { MuseumData } from '../types';

const museum = (name: string, rating: number, reviewCount: number): MuseumData => ({
  name,
  placeId: `${name}-place`,
  rating,
  reviewCount,
  address: 'Address',
  url: 'https://maps.google.com',
  reviewsSample: [],
  keywords: [],
  sentiment: { positive: 0, neutral: 0, negative: 0 },
  source: 'synthetic_engine',
  fetchedAt: '2026-03-02T10:00:00.000Z',
});

describe('storage history upsert', () => {
  it('keeps one snapshot per museum per day', () => {
    const initial = [
      { name: 'Museum Ludwig', date: '2026-03-01', rating: 4.5, reviewCount: 9000 },
      { name: 'Museum Ludwig', date: '2026-03-02', rating: 4.4, reviewCount: 9100 },
    ];

    const next = upsertDailyHistory(initial, '2026-03-02', [museum('Museum Ludwig', 4.7, 10000)]);
    const entriesForDay = next.filter((entry) => entry.name === 'Museum Ludwig' && entry.date === '2026-03-02');

    expect(entriesForDay).toHaveLength(1);
    expect(entriesForDay[0].rating).toBe(4.7);
  });
});
