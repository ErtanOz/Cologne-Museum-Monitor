import dotenv from 'dotenv';

dotenv.config({ quiet: true });
dotenv.config({ path: '.env.local', override: true, quiet: true });

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const SERVER_PORT = toInt(process.env.PORT, 8787);
export const MAX_CONCURRENCY = toInt(process.env.SYNC_CONCURRENCY, 3);
export const SYNC_MIN_INTERVAL_MINUTES = toInt(process.env.SYNC_MIN_INTERVAL_MINUTES, 30);
export const SYNC_MIN_INTERVAL_MS = SYNC_MIN_INTERVAL_MINUTES * 60 * 1000;
export const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000;

export const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';
export const GOOGLE_MAPS_API_KEY = (process.env.GOOGLE_MAPS_API_KEY ?? '').trim();
const dataProviderEnv = (process.env.DATA_PROVIDER ?? 'synthetic_engine').trim();
export const DATA_PROVIDER: 'synthetic_engine' | 'google_places_api' =
  dataProviderEnv === 'google_places_api' ? 'google_places_api' : 'synthetic_engine';

export const hasGoogleApiKey = (): boolean => GOOGLE_MAPS_API_KEY.length > 0;
export const shouldUseGooglePlaces = (): boolean => DATA_PROVIDER === 'google_places_api' && hasGoogleApiKey();
