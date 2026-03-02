import { DataProvider, FetchDiagnostics, MuseumData, MuseumHistory, RefreshReason } from '../types';
import { MAX_CONCURRENCY, MEMORY_CACHE_TTL_MS, SYNC_MIN_INTERVAL_MS, shouldUseGooglePlaces } from './config';
import { placesClient } from './googlePlacesClient';
import { SYNTHETIC_GENERATOR_VERSION, generateSyntheticSnapshot } from './syntheticGenerator';
import {
  ensureDataFiles,
  readHistory,
  readLatestStore,
  readSyntheticSeed,
  readTargets,
  upsertDailyHistory,
  upsertTargetPlaceId,
  writeHistory,
  writeJobStatus,
  writeLatestStore,
} from './storage';
import { LatestStore, MuseumTarget, SyncOptions, SyncResult } from './types';

const PLACES_GENERATOR_VERSION = 'places-sync-v1';

let bootstrapped = false;
let inFlight: Promise<SyncResult> | null = null;
let memoryCache: { at: number; latest: LatestStore; history: MuseumHistory[] } | null = null;

const createDiagnostics = (
  provider: DataProvider = 'synthetic_engine',
  overrides?: Partial<FetchDiagnostics>
): FetchDiagnostics => ({
  provider,
  lastSyncAt: null,
  refreshAttempted: false,
  refreshSkipped: false,
  refreshReason: null,
  stale: true,
  partial: false,
  warnings: [],
  message: 'No data available yet.',
  generatorVersion: provider === 'synthetic_engine' ? SYNTHETIC_GENERATOR_VERSION : PLACES_GENERATOR_VERSION,
  seedDate: new Date().toISOString().slice(0, 10),
  ...overrides,
});

const createDefaultLatest = (): LatestStore => ({
  updatedAt: null,
  data: [],
  diagnostics: createDiagnostics('synthetic_engine'),
});

const ensureBootstrapped = async (): Promise<void> => {
  if (bootstrapped) {
    return;
  }

  await ensureDataFiles(createDefaultLatest());
  bootstrapped = true;
};

const mapWithConcurrency = async <T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = [];
  let index = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]);
    }
  });

  await Promise.all(runners);
  return results;
};

const readLatestAndHistory = async (): Promise<{ latest: LatestStore; history: MuseumHistory[] }> => {
  const latest = await readLatestStore(createDefaultLatest());
  const history = await readHistory();
  return { latest, history };
};

export const shouldSkipByThrottle = (lastSyncAt: string | null, reason: RefreshReason, force: boolean): boolean => {
  if (force || reason !== 'page_load' || !lastSyncAt) {
    return false;
  }

  const delta = Date.now() - new Date(lastSyncAt).getTime();
  return Number.isFinite(delta) && delta >= 0 && delta < SYNC_MIN_INTERVAL_MS;
};

const toDateKey = (date = new Date()): string => date.toISOString().slice(0, 10);

const buildFallbackResult = (
  latest: LatestStore,
  history: MuseumHistory[],
  reason: RefreshReason,
  message: string,
  warnings: string[] = []
): SyncResult => ({
  data: latest.data,
  history,
  updatedAt: latest.updatedAt,
  diagnostics: createDiagnostics(latest.diagnostics.provider, {
    ...latest.diagnostics,
    refreshAttempted: true,
    refreshSkipped: false,
    refreshReason: reason,
    stale: true,
    partial: true,
    warnings: [...(latest.diagnostics.warnings ?? []), ...warnings],
    message,
  }),
});

const refreshMuseumsFromPlaces = async (
  targets: MuseumTarget[],
  previous: MuseumData[]
): Promise<{ data: MuseumData[]; warnings: string[] }> => {
  const warnings: string[] = [];
  const previousByName = new Map(previous.map((museum) => [museum.name, museum]));

  const fetched = await mapWithConcurrency(targets, MAX_CONCURRENCY, async (target) => {
    try {
      const { museum, resolvedPlaceId, warning } = await placesClient.fetchMuseum(target, target.placeId);

      if (resolvedPlaceId && resolvedPlaceId !== target.placeId) {
        await upsertTargetPlaceId(target.name, resolvedPlaceId);
      }

      if (warning) {
        warnings.push(warning);
      }

      if (!museum) {
        return previousByName.get(target.name) ?? null;
      }

      return museum;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed ${target.name}: ${message}`);
      return previousByName.get(target.name) ?? null;
    }
  });

  return {
    data: fetched.filter((museum): museum is MuseumData => museum !== null),
    warnings,
  };
};

const runSyntheticSync = async (
  latest: LatestStore,
  reason: RefreshReason,
  fetchedAt: string
): Promise<{ nextLatest: LatestStore; nextHistory: MuseumHistory[] }> => {
  const seed = await readSyntheticSeed();
  const generated = generateSyntheticSnapshot(seed, new Date(fetchedAt), 365);

  const nextLatest: LatestStore = {
    updatedAt: fetchedAt,
    data: generated.data.map((museum) => ({ ...museum, fetchedAt })),
    diagnostics: createDiagnostics('synthetic_engine', {
      lastSyncAt: fetchedAt,
      refreshAttempted: true,
      refreshSkipped: false,
      refreshReason: reason,
      stale: false,
      partial: false,
      warnings: [],
      message: 'Synthetic data mode active. Data generated from deterministic baseline model.',
      generatorVersion: SYNTHETIC_GENERATOR_VERSION,
      seedDate: generated.seedDate,
    }),
  };

  return {
    nextLatest,
    nextHistory: generated.history,
  };
};

const runGoogleSync = async (
  latest: LatestStore,
  history: MuseumHistory[],
  reason: RefreshReason,
  fetchedAt: string
): Promise<{ nextLatest: LatestStore; nextHistory: MuseumHistory[] }> => {
  const targets = await readTargets();
  const { data, warnings } = await refreshMuseumsFromPlaces(targets, latest.data);

  if (!data.length && latest.data.length) {
    throw new Error(`All Google Places fetches failed: ${warnings.join(' | ')}`);
  }

  if (!data.length) {
    throw new Error('Google Places fetch returned no data.');
  }

  const sorted = [...data].sort((a, b) => b.rating - a.rating).map((museum) => ({ ...museum, fetchedAt }));
  const dayKey = toDateKey(new Date(fetchedAt));

  const nextLatest: LatestStore = {
    updatedAt: fetchedAt,
    data: sorted,
    diagnostics: createDiagnostics('google_places_api', {
      lastSyncAt: fetchedAt,
      refreshAttempted: true,
      refreshSkipped: false,
      refreshReason: reason,
      stale: false,
      partial: warnings.length > 0,
      warnings,
      message: warnings.length
        ? 'Google Places sync completed with partial fallback.'
        : 'Google Places sync completed successfully.',
      generatorVersion: PLACES_GENERATOR_VERSION,
      seedDate: dayKey,
    }),
  };

  return {
    nextLatest,
    nextHistory: upsertDailyHistory(history, dayKey, sorted),
  };
};

const runSync = async ({ reason, force = false }: SyncOptions): Promise<SyncResult> => {
  await ensureBootstrapped();

  const startedAt = Date.now();
  const { latest, history } = await readLatestAndHistory();

  if (shouldSkipByThrottle(latest.updatedAt, reason, force)) {
    const diagnostics = createDiagnostics(latest.diagnostics.provider, {
      ...latest.diagnostics,
      lastSyncAt: latest.updatedAt,
      refreshAttempted: true,
      refreshSkipped: true,
      refreshReason: reason,
      stale: false,
      message: 'Refresh skipped: synced within the last 30 minutes.',
    });

    return {
      data: latest.data,
      history,
      diagnostics,
      updatedAt: latest.updatedAt,
    };
  }

  const fetchedAt = new Date().toISOString();

  try {
    const { nextLatest, nextHistory } = shouldUseGooglePlaces()
      ? await runGoogleSync(latest, history, reason, fetchedAt)
      : await runSyntheticSync(latest, reason, fetchedAt);

    await writeLatestStore(nextLatest);
    await writeHistory(nextHistory);
    await writeJobStatus({
      lastRunAt: fetchedAt,
      lastSuccessAt: fetchedAt,
      lastReason: reason,
      lastDurationMs: Date.now() - startedAt,
      lastError: nextLatest.diagnostics.partial ? nextLatest.diagnostics.warnings.join(' | ') : null,
    });

    memoryCache = {
      at: Date.now(),
      latest: nextLatest,
      history: nextHistory,
    };

    return {
      data: nextLatest.data,
      history: nextHistory,
      diagnostics: nextLatest.diagnostics,
      updatedAt: nextLatest.updatedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (latest.data.length) {
      return buildFallbackResult(latest, history, reason, message);
    }

    throw error;
  }
};

export const syncService = {
  async getLatest(): Promise<LatestStore> {
    await ensureBootstrapped();

    if (memoryCache && Date.now() - memoryCache.at < MEMORY_CACHE_TTL_MS) {
      return memoryCache.latest;
    }

    const latest = await readLatestStore(createDefaultLatest());
    const history = await readHistory();

    if (!latest.data.length && !latest.updatedAt && !shouldUseGooglePlaces()) {
      const synced = await syncService.refresh({ reason: 'page_load', force: true });
      return {
        updatedAt: synced.updatedAt,
        data: synced.data,
        diagnostics: synced.diagnostics,
      };
    }

    memoryCache = {
      at: Date.now(),
      latest,
      history,
    };

    return latest;
  },

  async getHistory(days = 365): Promise<MuseumHistory[]> {
    await ensureBootstrapped();

    const history = memoryCache && Date.now() - memoryCache.at < MEMORY_CACHE_TTL_MS ? memoryCache.history : await readHistory();

    if (!days || days <= 0) {
      return history;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return history.filter((entry) => new Date(entry.date) >= cutoff);
  },

  async refresh(options: SyncOptions): Promise<SyncResult> {
    if (inFlight) {
      return inFlight;
    }

    inFlight = runSync(options)
      .catch(async (error) => {
        const message = error instanceof Error ? error.message : String(error);
        await writeJobStatus({
          lastRunAt: new Date().toISOString(),
          lastSuccessAt: null,
          lastReason: options.reason,
          lastDurationMs: 0,
          lastError: message,
        });
        throw error;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  },
};

export const diagnosticsFactory = {
  createDiagnostics,
};
