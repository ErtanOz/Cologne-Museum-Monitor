/** @vitest-environment node */

import { describe, expect, it } from 'vitest';
import { generateSyntheticSnapshot } from './syntheticGenerator';
import { SyntheticSeedEntry } from './types';

const seeds: SyntheticSeedEntry[] = [
  {
    name: 'Museum Alpha',
    placeId: 'synthetic-alpha',
    address: 'Alpha Street, Cologne, Germany',
    url: 'https://maps.google.com/?q=alpha',
    baseRating: 4.4,
    baseReviewCount: 1200,
    baseDailyReviews: 4,
    volatility: 0.35,
    seasonality: 0.11,
    themeKeywords: ['art', 'gallery', 'modern', 'design'],
    reviewTemplates: [
      'Great curated spaces and excellent exhibitions.',
      'Very pleasant visit and strong collection quality.',
    ],
  },
  {
    name: 'Museum Beta',
    placeId: 'synthetic-beta',
    address: 'Beta Square, Cologne, Germany',
    url: 'https://maps.google.com/?q=beta',
    baseRating: 4.1,
    baseReviewCount: 800,
    baseDailyReviews: 3,
    volatility: 0.42,
    seasonality: 0.08,
    themeKeywords: ['history', 'exhibits', 'collection', 'family'],
    reviewTemplates: [
      'Informative displays and engaging storytelling.',
      'Solid museum experience with clear explanations.',
    ],
  },
];

describe('syntheticGenerator', () => {
  it('is deterministic for the same seed data and date', () => {
    const now = new Date('2026-03-02T12:00:00.000Z');
    const first = generateSyntheticSnapshot(seeds, now, 30);
    const second = generateSyntheticSnapshot(seeds, now, 30);

    expect(first).toEqual(second);
  });

  it('keeps ratings/reviews/sentiment within valid bounds', () => {
    const now = new Date('2026-03-02T12:00:00.000Z');
    const result = generateSyntheticSnapshot(seeds, now, 45);

    for (const museum of result.data) {
      expect(museum.rating).toBeGreaterThanOrEqual(3.2);
      expect(museum.rating).toBeLessThanOrEqual(4.9);
      expect(museum.reviewCount).toBeGreaterThanOrEqual(0);
      expect(museum.sentiment.positive + museum.sentiment.neutral + museum.sentiment.negative).toBe(100);
      expect(museum.reviewsSample.length).toBeGreaterThan(0);
      for (const review of museum.reviewsSample) {
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
      }
    }
  });

  it('creates full backfill history and monotonic review counts', () => {
    const days = 365;
    const now = new Date('2026-03-02T12:00:00.000Z');
    const result = generateSyntheticSnapshot(seeds, now, days);

    expect(result.history).toHaveLength(seeds.length * days);

    for (const seed of seeds) {
      const entries = result.history
        .filter((entry) => entry.name === seed.name)
        .sort((a, b) => a.date.localeCompare(b.date));

      expect(entries).toHaveLength(days);

      for (let i = 1; i < entries.length; i += 1) {
        expect(entries[i].reviewCount).toBeGreaterThanOrEqual(entries[i - 1].reviewCount);
      }
    }
  });
});
