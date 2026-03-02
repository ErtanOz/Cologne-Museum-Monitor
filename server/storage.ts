import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MuseumData, MuseumHistory } from '../types';
import { JobStatus, LatestStore, MuseumTarget, SyntheticSeedEntry } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TARGETS_FILE = path.join(DATA_DIR, 'museumTargets.json');
const LATEST_FILE = path.join(DATA_DIR, 'latest.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const JOB_STATUS_FILE = path.join(DATA_DIR, 'job-status.json');
const SYNTHETIC_SEED_FILE = path.join(DATA_DIR, 'syntheticSeed.json');

const DEFAULT_TARGETS: MuseumTarget[] = [
  { name: 'Museum Ludwig', textQuery: 'Museum Ludwig Cologne' },
  { name: 'Roemisch-Germanisches Museum', textQuery: 'Roemisch-Germanisches Museum Cologne' },
  { name: 'Schokoladenmuseum Koeln', textQuery: 'Schokoladenmuseum Cologne' },
  { name: 'Wallraf-Richartz-Museum', textQuery: 'Wallraf-Richartz-Museum Cologne' },
  { name: 'Museum fuer Angewandte Kunst Koeln', textQuery: 'Museum fuer Angewandte Kunst Koeln Cologne' },
  { name: 'NS-Dokumentationszentrum', textQuery: 'NS-Dokumentationszentrum Cologne' },
  { name: 'Duftmuseum im Farina-Haus', textQuery: 'Duftmuseum im Farina-Haus Cologne' },
  { name: 'Koelnisches Stadtmuseum', textQuery: 'Koelnisches Stadtmuseum Cologne' },
  { name: 'Museum Schnuetgen', textQuery: 'Museum Schnuetgen Cologne' },
  { name: 'Odysseum', textQuery: 'Odysseum Cologne' },
  { name: 'Rautenstrauch-Joest-Museum', textQuery: 'Rautenstrauch-Joest-Museum Cologne' },
  { name: 'Kolumba', textQuery: 'Kolumba Cologne' },
  { name: 'Cologne Cathedral Treasury', textQuery: 'Cologne Cathedral Treasury Cologne' },
];

const DEFAULT_JOB_STATUS: JobStatus = {
  lastRunAt: null,
  lastSuccessAt: null,
  lastReason: null,
  lastDurationMs: 0,
  lastError: null,
};

const DEFAULT_SYNTHETIC_SEED: SyntheticSeedEntry[] = DEFAULT_TARGETS.map((target, index) => ({
  name: target.name,
  placeId: `synthetic-${index + 1}`,
  address: 'Cologne, Germany',
  url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target.textQuery)}`,
  baseRating: 4.2 + (index % 4) * 0.12,
  baseReviewCount: 900 + index * 550,
  baseDailyReviews: 2 + (index % 6),
  volatility: 0.35 + (index % 3) * 0.15,
  seasonality: 0.08 + (index % 4) * 0.02,
  themeKeywords: ['architecture', 'exhibitions', 'collection', 'history', 'staff', 'family'],
  reviewTemplates: [
    'Great exhibitions and a very engaging visit.',
    'Interesting collection and well curated rooms.',
    'Worth visiting when exploring Cologne museums.',
    'Good atmosphere with informative displays.',
    'Solid museum experience with helpful staff.',
  ],
}));

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const writeJsonAtomic = async (filePath: string, data: unknown): Promise<void> => {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
};

const readJsonWithFallback = async <T>(filePath: string, fallback: T): Promise<T> => {
  if (!(await fileExists(filePath))) {
    return fallback;
  }

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const ensureDataFiles = async (defaultLatest: LatestStore): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });

  if (!(await fileExists(TARGETS_FILE))) {
    await writeJsonAtomic(TARGETS_FILE, DEFAULT_TARGETS);
  }

  if (!(await fileExists(LATEST_FILE))) {
    await writeJsonAtomic(LATEST_FILE, defaultLatest);
  }

  if (!(await fileExists(HISTORY_FILE))) {
    await writeJsonAtomic(HISTORY_FILE, [] as MuseumHistory[]);
  }

  if (!(await fileExists(JOB_STATUS_FILE))) {
    await writeJsonAtomic(JOB_STATUS_FILE, DEFAULT_JOB_STATUS);
  }

  if (!(await fileExists(SYNTHETIC_SEED_FILE))) {
    await writeJsonAtomic(SYNTHETIC_SEED_FILE, DEFAULT_SYNTHETIC_SEED);
  }
};

export const readTargets = async (): Promise<MuseumTarget[]> => readJsonWithFallback(TARGETS_FILE, DEFAULT_TARGETS);

export const writeTargets = async (targets: MuseumTarget[]): Promise<void> => {
  await writeJsonAtomic(TARGETS_FILE, targets);
};

export const upsertTargetPlaceId = async (targetName: string, placeId: string): Promise<void> => {
  const targets = await readTargets();
  const next = targets.map((target) =>
    target.name === targetName && target.placeId !== placeId ? { ...target, placeId } : target
  );
  await writeTargets(next);
};

export const readLatestStore = async (defaultLatest: LatestStore): Promise<LatestStore> =>
  readJsonWithFallback(LATEST_FILE, defaultLatest);

export const writeLatestStore = async (store: LatestStore): Promise<void> => {
  await writeJsonAtomic(LATEST_FILE, store);
};

export const readHistory = async (): Promise<MuseumHistory[]> => readJsonWithFallback(HISTORY_FILE, [] as MuseumHistory[]);

export const writeHistory = async (history: MuseumHistory[]): Promise<void> => {
  await writeJsonAtomic(HISTORY_FILE, history);
};

export const upsertDailyHistory = (history: MuseumHistory[], day: string, data: MuseumData[]): MuseumHistory[] => {
  const byKey = new Map<string, MuseumHistory>();

  for (const entry of history) {
    byKey.set(`${entry.name}::${entry.date}`, entry);
  }

  for (const museum of data) {
    byKey.set(`${museum.name}::${day}`, {
      name: museum.name,
      date: day,
      rating: museum.rating,
      reviewCount: museum.reviewCount,
    });
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    return a.name.localeCompare(b.name);
  });
};

export const readJobStatus = async (): Promise<JobStatus> => readJsonWithFallback(JOB_STATUS_FILE, DEFAULT_JOB_STATUS);

export const writeJobStatus = async (status: JobStatus): Promise<void> => {
  await writeJsonAtomic(JOB_STATUS_FILE, status);
};

export const readSyntheticSeed = async (): Promise<SyntheticSeedEntry[]> =>
  readJsonWithFallback(SYNTHETIC_SEED_FILE, DEFAULT_SYNTHETIC_SEED);

export const getDataFilePaths = () => ({
  targets: TARGETS_FILE,
  latest: LATEST_FILE,
  history: HISTORY_FILE,
  jobStatus: JOB_STATUS_FILE,
  syntheticSeed: SYNTHETIC_SEED_FILE,
});
