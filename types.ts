export type FetchStatus = 'idle' | 'loading' | 'success' | 'degraded' | 'error';

export type RefreshReason = 'manual' | 'page_load' | 'daily';
export type DataProvider = 'synthetic_engine' | 'google_places_api';
export type DataSource = 'synthetic_engine' | 'google_places_api';

export interface ReviewSample {
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
}

export interface MuseumKeyword {
  text: string;
  value: number;
}

export interface MuseumSentiment {
  positive: number;
  neutral: number;
  negative: number;
}

export interface MuseumData {
  name: string;
  placeId: string;
  rating: number;
  reviewCount: number;
  address: string;
  url: string;
  reviewsSample: ReviewSample[];
  keywords: MuseumKeyword[];
  sentiment: MuseumSentiment;
  source: DataSource;
  fetchedAt: string;
  syntheticConfidence?: number;
}

export interface MuseumHistory {
  name: string;
  date: string;
  rating: number;
  reviewCount: number;
}

export interface FetchDiagnostics {
  provider: DataProvider;
  lastSyncAt: string | null;
  refreshAttempted: boolean;
  refreshSkipped: boolean;
  refreshReason: RefreshReason | null;
  stale: boolean;
  partial: boolean;
  warnings: string[];
  message: string;
  generatorVersion: string;
  seedDate: string;
}

export interface MuseumsPayload {
  data: MuseumData[];
  diagnostics: FetchDiagnostics;
}

export interface MuseumHistoryPayload {
  history: MuseumHistory[];
}
