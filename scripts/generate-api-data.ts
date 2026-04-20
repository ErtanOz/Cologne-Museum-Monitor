import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateSyntheticSnapshot } from '../server/syntheticGenerator.ts';
import type { SyntheticSeedEntry } from '../server/types.ts';

const seed: SyntheticSeedEntry[] = JSON.parse(readFileSync(resolve('data/syntheticSeed.json'), 'utf-8'));
const now = new Date();
const fetchedAt = now.toISOString();
const snapshot = generateSyntheticSnapshot(seed, now, 365);

mkdirSync(resolve('public/api'), { recursive: true });

writeFileSync(
  resolve('public/api/museums.json'),
  JSON.stringify({
    data: snapshot.data.map((m) => ({ ...m, fetchedAt })),
    diagnostics: {
      provider: 'synthetic_engine',
      lastSyncAt: fetchedAt,
      refreshAttempted: false,
      refreshSkipped: false,
      refreshReason: null,
      stale: false,
      partial: false,
      warnings: [],
      message: 'Synthetic data mode active. Data generated from deterministic baseline model.',
      generatorVersion: 'synthetic-engine-v1',
      seedDate: snapshot.seedDate,
    },
  }),
);

writeFileSync(resolve('public/api/history.json'), JSON.stringify({ history: snapshot.history }));

writeFileSync(resolve('public/api/health.json'), JSON.stringify({ ok: true, lastSyncAt: fetchedAt, provider: 'synthetic_engine' }));

console.log(`[generate-api-data] Done — ${snapshot.data.length} museums, ${snapshot.history.length} history entries, seed date ${snapshot.seedDate}`);
