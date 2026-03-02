import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchMuseumsWithHistory, refreshMuseums } from './museumApiClient';

describe('museumApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends manual refresh reason to refresh endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], diagnostics: {} }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await refreshMuseums('manual', true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/museums/refresh?reason=manual&force=true');
  });

  it('loads museums and history together', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], diagnostics: { stale: false } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ history: [] }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMuseumsWithHistory({ refreshReason: 'page_load' });

    expect(result.museumsPayload).toBeDefined();
    expect(result.historyPayload.history).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
