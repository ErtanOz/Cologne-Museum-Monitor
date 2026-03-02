/** @vitest-environment node */

import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const importSyncService = async () => {
  vi.resetModules();
  return import('./syncService');
};

describe('syncService integration (synthetic primary)', () => {
  let originalCwd = process.cwd();
  let tempDir = '';

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'museum-sync-'));
    process.chdir(tempDir);
    process.env.DATA_PROVIDER = 'synthetic_engine';
    delete process.env.GOOGLE_MAPS_API_KEY;
    vi.resetModules();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    delete process.env.DATA_PROVIDER;
    await rm(tempDir, { recursive: true, force: true });
    vi.resetModules();
  });

  it('returns synthetic data on manual refresh', async () => {
    const { syncService } = await importSyncService();
    const result = await syncService.refresh({ reason: 'manual', force: true });

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.history.length).toBeGreaterThan(0);
    expect(result.diagnostics.provider).toBe('synthetic_engine');
    expect(result.diagnostics.generatorVersion).toBeTruthy();
  });

  it('skips page_load refresh inside throttle window', async () => {
    const { syncService } = await importSyncService();
    await syncService.refresh({ reason: 'manual', force: true });
    const result = await syncService.refresh({ reason: 'page_load', force: false });

    expect(result.diagnostics.refreshSkipped).toBe(true);
    expect(result.diagnostics.refreshReason).toBe('page_load');
  });

  it('bootstraps data when latest is empty', async () => {
    const { syncService } = await importSyncService();
    const latest = await syncService.getLatest();

    expect(latest.data.length).toBeGreaterThan(0);
    expect(latest.diagnostics.provider).toBe('synthetic_engine');
  });
});
