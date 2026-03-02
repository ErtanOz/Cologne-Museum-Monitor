import { MuseumData, MuseumHistory, MuseumKeyword, MuseumSentiment, ReviewSample } from '../types';
import { SyntheticSeedEntry } from './types';

export const SYNTHETIC_GENERATOR_VERSION = 'synthetic-engine-v1';

interface MuseumState {
  rating: number;
  reviewCount: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const round1 = (value: number): number => Number(value.toFixed(1));

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const dayOfYear = (date: Date): number => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
};

const hashString = (value: string): number => {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createRandom = (seedKey: string): (() => number) => {
  let state = hashString(seedKey) || 1;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const poisson = (lambda: number, random: () => number): number => {
  if (lambda <= 0) {
    return 0;
  }

  const l = Math.exp(-lambda);
  let p = 1;
  let k = 0;

  do {
    k += 1;
    p *= random();
  } while (p > l && k < 1000);

  return Math.max(0, k - 1);
};

const normalizeSentiment = (positive: number, neutral: number, negative: number): MuseumSentiment => {
  const p = clamp(Math.round(positive), 0, 100);
  const n = clamp(Math.round(neutral), 0, 100);
  const g = clamp(Math.round(negative), 0, 100);
  const total = p + n + g;

  if (total <= 0) {
    return { positive: 60, neutral: 28, negative: 12 };
  }

  const normalizedPositive = Math.round((p / total) * 100);
  const normalizedNeutral = Math.round((n / total) * 100);
  const normalizedNegative = 100 - normalizedPositive - normalizedNeutral;

  return {
    positive: clamp(normalizedPositive, 0, 100),
    neutral: clamp(normalizedNeutral, 0, 100),
    negative: clamp(normalizedNegative, 0, 100),
  };
};

const deriveSentiment = (rating: number, random: () => number): MuseumSentiment => {
  const positiveBase = 45 + ((rating - 3.2) / 1.7) * 45;
  const neutralBase = 18 + (4.4 - rating) * 6;
  const negativeBase = 100 - positiveBase - neutralBase;

  return normalizeSentiment(
    positiveBase + (random() - 0.5) * 6,
    neutralBase + (random() - 0.5) * 5,
    negativeBase + (random() - 0.5) * 4
  );
};

const deriveKeywords = (seed: SyntheticSeedEntry, random: () => number): MuseumKeyword[] => {
  const pool = seed.themeKeywords.length ? seed.themeKeywords : ['exhibition', 'history', 'collection'];

  return pool
    .map((keyword) => {
      const base = 5 + random() * 5;
      return {
        text: keyword,
        value: clamp(Math.round(base), 1, 10),
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

const AUTHOR_NAMES = ['Alex', 'Mina', 'Jonas', 'Lea', 'Sam', 'Nora', 'Chris', 'Dilan', 'Murat', 'Sofia'];

const pickStarRating = (sentiment: MuseumSentiment, random: () => number): number => {
  const bucket = random() * 100;

  if (bucket < sentiment.positive) {
    return random() < 0.6 ? 5 : 4;
  }

  if (bucket < sentiment.positive + sentiment.neutral) {
    return 3;
  }

  return random() < 0.5 ? 2 : 1;
};

const buildReviewSamples = (seed: SyntheticSeedEntry, sentiment: MuseumSentiment, random: () => number): ReviewSample[] => {
  const templates = seed.reviewTemplates.length
    ? seed.reviewTemplates
    : ['Interesting visit with strong curation and architecture.'];

  const keywords = seed.themeKeywords.length ? seed.themeKeywords : ['museum'];

  const reviews: ReviewSample[] = [];

  for (let i = 0; i < 5; i += 1) {
    const template = templates[Math.floor(random() * templates.length)];
    const keyword = keywords[Math.floor(random() * keywords.length)];
    const rating = pickStarRating(sentiment, random);

    reviews.push({
      authorName: `${AUTHOR_NAMES[Math.floor(random() * AUTHOR_NAMES.length)]} ${String.fromCharCode(65 + (i % 26))}.`,
      rating,
      text: `${template} ${keyword} was a highlight.`.trim(),
      relativeTime: `${1 + Math.floor(random() * 30)} days ago`,
    });
  }

  return reviews;
};

const evolveDailyState = (seed: SyntheticSeedEntry, state: MuseumState, date: Date, random: () => number): MuseumState => {
  const seasonalWave = Math.sin((2 * Math.PI * dayOfYear(date)) / 365);
  const drift = (seed.baseRating - state.rating) * 0.08;
  const noise = (random() + random() + random() - 1.5) * 0.08 * seed.volatility;
  const seasonalEffect = seasonalWave * 0.03 * seed.seasonality;
  const nextRating = clamp(state.rating + drift + noise + seasonalEffect, 3.2, 4.9);

  const eventFactor = random() < 0.03 ? 1.6 : random() < 0.12 ? 1.2 : 1;
  const seasonalFactor = Math.max(0.5, 1 + seasonalWave * seed.seasonality);
  const lambda = Math.max(0.2, seed.baseDailyReviews * seasonalFactor * eventFactor);
  const dailyDelta = poisson(lambda, random);

  return {
    rating: round1(nextRating),
    reviewCount: Math.max(state.reviewCount, state.reviewCount + dailyDelta),
  };
};

const toMuseumData = (seed: SyntheticSeedEntry, state: MuseumState, date: Date, random: () => number): MuseumData => {
  const sentiment = deriveSentiment(state.rating, random);
  const keywords = deriveKeywords(seed, random);
  const reviewsSample = buildReviewSamples(seed, sentiment, random);

  return {
    name: seed.name,
    placeId: seed.placeId,
    rating: state.rating,
    reviewCount: state.reviewCount,
    address: seed.address,
    url: seed.url,
    reviewsSample,
    keywords,
    sentiment,
    source: 'synthetic_engine',
    fetchedAt: date.toISOString(),
    syntheticConfidence: 0.84,
  };
};

export interface SyntheticGenerationResult {
  data: MuseumData[];
  history: MuseumHistory[];
  seedDate: string;
}

export const generateSyntheticSnapshot = (
  seeds: SyntheticSeedEntry[],
  now: Date,
  historyDays = 365
): SyntheticGenerationResult => {
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - Math.max(1, historyDays) + 1);

  const history: MuseumHistory[] = [];
  const latest: MuseumData[] = [];

  for (const seed of seeds) {
    let state: MuseumState = {
      rating: clamp(seed.baseRating, 3.2, 4.9),
      reviewCount: Math.max(0, Math.floor(seed.baseReviewCount)),
    };

    for (let cursor = new Date(startDate); cursor <= endDate; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const day = new Date(cursor);
      const dayKey = toDateKey(day);
      const random = createRandom(`${seed.name}::${dayKey}`);

      state = evolveDailyState(seed, state, day, random);

      history.push({
        name: seed.name,
        date: dayKey,
        rating: state.rating,
        reviewCount: state.reviewCount,
      });

      if (dayKey === toDateKey(endDate)) {
        latest.push(toMuseumData(seed, state, day, random));
      }
    }
  }

  latest.sort((a, b) => b.rating - a.rating);

  return {
    data: latest,
    history,
    seedDate: toDateKey(endDate),
  };
};
