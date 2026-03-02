import { MuseumKeyword, MuseumSentiment, ReviewSample } from '../types';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'were', 'very', 'about', 'there', 'their', 'into',
  'museum', 'museums', 'visit', 'visited', 'place', 'great', 'good', 'nice', 'also', 'just', 'really', 'more',
  'aber', 'oder', 'nicht', 'eine', 'einer', 'einem', 'einen', 'eines', 'dieser', 'diese', 'dieses', 'sehr', 'auch',
  'sind', 'war', 'waren', 'mit', 'und', 'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'im', 'in', 'am', 'zu',
  'auf', 'ist', 'es', 'von', 'man', 'wir', 'sie', 'ich', 'you', 'your', 'our', 'too', 'can', 'will', 'bei', 'zum',
  'zur', 'noch', 'schon', 'hier', 'dort', 'einfach', 'immer', 'wurde', 'worden', 'been', 'was', 'are', 'is', 'it',
]);

const normalizeWord = (word: string): string =>
  word
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();

const toPercent = (value: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
};

export const deriveSentiment = (reviews: ReviewSample[], fallbackRating: number): MuseumSentiment => {
  if (!reviews.length) {
    if (fallbackRating >= 4.2) {
      return { positive: 78, neutral: 17, negative: 5 };
    }

    if (fallbackRating >= 3.6) {
      return { positive: 62, neutral: 26, negative: 12 };
    }

    return { positive: 45, neutral: 30, negative: 25 };
  }

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const review of reviews) {
    if (review.rating >= 4) {
      positive += 1;
    } else if (review.rating === 3) {
      neutral += 1;
    } else {
      negative += 1;
    }
  }

  const total = positive + neutral + negative;
  let positivePct = toPercent(positive, total);
  const neutralPct = toPercent(neutral, total);
  const negativePct = toPercent(negative, total);
  const drift = 100 - (positivePct + neutralPct + negativePct);
  positivePct = Math.max(0, Math.min(100, positivePct + drift));

  return {
    positive: positivePct,
    neutral: neutralPct,
    negative: negativePct,
  };
};

export const deriveKeywords = (reviews: ReviewSample[]): MuseumKeyword[] => {
  const frequencies = new Map<string, number>();

  for (const review of reviews) {
    const tokens = review.text.split(/\s+/g);

    for (const token of tokens) {
      const normalized = normalizeWord(token);

      if (normalized.length < 4 || STOPWORDS.has(normalized)) {
        continue;
      }

      frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1);
    }
  }

  if (!frequencies.size) {
    return [];
  }

  const ranked = Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxFrequency = ranked[0][1] || 1;

  return ranked.map(([word, count]) => ({
    text: word,
    value: Math.max(1, Math.min(10, Math.round((count / maxFrequency) * 10))),
  }));
};

export const analyzeReviews = (reviews: ReviewSample[], fallbackRating: number): { keywords: MuseumKeyword[]; sentiment: MuseumSentiment } => ({
  keywords: deriveKeywords(reviews),
  sentiment: deriveSentiment(reviews, fallbackRating),
});
