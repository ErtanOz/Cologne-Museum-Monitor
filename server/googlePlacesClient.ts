import { MuseumData, ReviewSample } from '../types';
import { GOOGLE_MAPS_API_KEY, GOOGLE_PLACES_BASE_URL, hasGoogleApiKey } from './config';
import { analyzeReviews } from './analysis';
import { MuseumTarget } from './types';

interface SearchTextResponse {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    googleMapsUri?: string;
  }>;
}

interface PlaceDetailsResponse {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
    authorAttribution?: { displayName?: string };
  }>;
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalized = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenSet = (value: string): Set<string> => new Set(normalized(value).split(' ').filter((token) => token.length >= 3));

const isLikelyMatch = (targetName: string, candidateName: string, address: string): boolean => {
  const targetTokens = tokenSet(targetName);
  const candidateTokens = tokenSet(candidateName);
  const addressText = normalized(address);

  let overlap = 0;
  for (const token of targetTokens) {
    if (candidateTokens.has(token)) {
      overlap += 1;
    }
  }

  const overlapRatio = targetTokens.size ? overlap / targetTokens.size : 0;
  return overlapRatio >= 0.4 && (addressText.includes('cologne') || addressText.includes('koln') || addressText.includes('koeln'));
};

const requestJson = async <T>(url: string, init: RequestInit, attempt = 1): Promise<T> => {
  const response = await fetch(url, init);

  if (!response.ok) {
    if (RETRYABLE.has(response.status) && attempt < 4) {
      await sleep(Math.min(8000, Math.pow(2, attempt - 1) * 1000));
      return requestJson<T>(url, init, attempt + 1);
    }

    const body = await response.text();
    throw new Error(`Google Places API ${response.status}: ${body || response.statusText}`);
  }

  return (await response.json()) as T;
};

const headers = (fieldMask: string): HeadersInit => ({
  'Content-Type': 'application/json',
  'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
  'X-Goog-FieldMask': fieldMask,
});

const searchPlace = async (target: MuseumTarget): Promise<{ placeId: string; displayName: string; formattedAddress: string; mapsUrl: string } | null> => {
  const response = await requestJson<SearchTextResponse>(
    `${GOOGLE_PLACES_BASE_URL}/places:searchText`,
    {
      method: 'POST',
      headers: headers('places.id,places.displayName,places.formattedAddress,places.googleMapsUri'),
      body: JSON.stringify({
        textQuery: target.textQuery,
        regionCode: 'DE',
        languageCode: 'en',
        maxResultCount: 1,
      }),
    }
  );

  const candidate = response.places?.[0];
  if (!candidate?.id) {
    return null;
  }

  const displayName = candidate.displayName?.text ?? target.name;
  const formattedAddress = candidate.formattedAddress ?? '';

  if (!isLikelyMatch(target.name, displayName, formattedAddress)) {
    return null;
  }

  return {
    placeId: candidate.id,
    displayName,
    formattedAddress,
    mapsUrl: candidate.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target.textQuery)}`,
  };
};

const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetailsResponse> =>
  requestJson<PlaceDetailsResponse>(`${GOOGLE_PLACES_BASE_URL}/places/${placeId}`, {
    method: 'GET',
    headers: headers('id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,reviews'),
  });

const normalizeReviews = (input: PlaceDetailsResponse['reviews']): ReviewSample[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((review) => ({
      authorName: review.authorAttribution?.displayName?.trim() || 'Anonymous',
      rating: Math.max(1, Math.min(5, Number(review.rating) || 0)),
      text: review.text?.text?.trim() || '',
      relativeTime: review.relativePublishTimeDescription?.trim() || 'recently',
    }))
    .filter((review) => review.rating > 0)
    .slice(0, 5);
};

export const placesClient = {
  hasApiKey: hasGoogleApiKey,

  async fetchMuseum(target: MuseumTarget, knownPlaceId?: string): Promise<{ museum: MuseumData | null; resolvedPlaceId: string | null; warning: string | null }> {
    if (!hasGoogleApiKey()) {
      return {
        museum: null,
        resolvedPlaceId: knownPlaceId ?? null,
        warning: `Missing GOOGLE_MAPS_API_KEY; skipped ${target.name}.`,
      };
    }

    let placeId = knownPlaceId ?? target.placeId ?? null;

    if (!placeId) {
      const search = await searchPlace(target);
      if (!search) {
        return {
          museum: null,
          resolvedPlaceId: null,
          warning: `No confident place match for ${target.name}.`,
        };
      }

      placeId = search.placeId;
    }

    const details = await fetchPlaceDetails(placeId);

    if (!details.id) {
      return {
        museum: null,
        resolvedPlaceId: placeId,
        warning: `No place details for ${target.name}.`,
      };
    }

    const reviewsSample = normalizeReviews(details.reviews);
    const rating = Math.max(0, Math.min(5, Number(details.rating) || 0));
    const reviewCount = Math.max(0, Math.round(Number(details.userRatingCount) || 0));
    const { keywords, sentiment } = analyzeReviews(reviewsSample, rating);

    const museum: MuseumData = {
      name: details.displayName?.text?.trim() || target.name,
      placeId: details.id,
      rating: Number(rating.toFixed(1)),
      reviewCount,
      address: details.formattedAddress?.trim() || '',
      url: details.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target.textQuery)}`,
      reviewsSample,
      keywords,
      sentiment,
      source: 'google_places_api',
      fetchedAt: new Date().toISOString(),
    };

    return {
      museum,
      resolvedPlaceId: details.id,
      warning: null,
    };
  },
};
