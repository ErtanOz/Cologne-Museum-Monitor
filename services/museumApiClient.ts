import { MuseumHistoryPayload, MuseumsPayload, RefreshReason } from '../types';

interface FetchMuseumsOptions {
  refreshReason?: RefreshReason;
  forceRefresh?: boolean;
  historyDays?: number;
}

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    let message = response.statusText;

    try {
      const payload = await response.json();
      message = String(payload?.message || message);
    } catch {
      // ignore json parsing failures
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const getMuseums = async (): Promise<MuseumsPayload> => requestJson<MuseumsPayload>('/api/museums');

export const refreshMuseums = async (reason: RefreshReason, forceRefresh = false): Promise<MuseumsPayload> => {
  const query = new URLSearchParams({ reason });

  if (forceRefresh) {
    query.set('force', 'true');
  }

  return requestJson<MuseumsPayload>(`/api/museums/refresh?${query.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason, force: forceRefresh }),
  });
};

export const getMuseumHistory = async (days = 365): Promise<MuseumHistoryPayload> =>
  requestJson<MuseumHistoryPayload>(`/api/museums/history?days=${days}`);

export const fetchMuseumsWithHistory = async (
  options: FetchMuseumsOptions = {}
): Promise<{ museumsPayload: MuseumsPayload; historyPayload: MuseumHistoryPayload }> => {
  const { refreshReason, forceRefresh = false, historyDays = 365 } = options;

  const museumsPayload = refreshReason
    ? await refreshMuseums(refreshReason, forceRefresh)
    : await getMuseums();

  const historyPayload = await getMuseumHistory(historyDays);

  return {
    museumsPayload,
    historyPayload,
  };
};
