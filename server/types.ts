import { FetchDiagnostics, MuseumData, MuseumHistory, RefreshReason } from '../types';

export interface MuseumTarget {
  name: string;
  textQuery: string;
  placeId?: string;
}

export interface LatestStore {
  updatedAt: string | null;
  data: MuseumData[];
  diagnostics: FetchDiagnostics;
}

export interface JobStatus {
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastReason: RefreshReason | null;
  lastDurationMs: number;
  lastError: string | null;
}

export interface SyncOptions {
  reason: RefreshReason;
  force?: boolean;
}

export interface SyncResult {
  data: MuseumData[];
  history: MuseumHistory[];
  diagnostics: FetchDiagnostics;
  updatedAt: string | null;
}

export interface SyntheticSeedEntry {
  name: string;
  placeId: string;
  address: string;
  url: string;
  baseRating: number;
  baseReviewCount: number;
  baseDailyReviews: number;
  volatility: number;
  seasonality: number;
  themeKeywords: string[];
  reviewTemplates: string[];
}
