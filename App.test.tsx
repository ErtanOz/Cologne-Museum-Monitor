import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { fetchMuseumsWithHistory } from './services/museumApiClient';

vi.mock('./services/museumApiClient', () => ({
  fetchMuseumsWithHistory: vi.fn(),
}));

const mockedFetchMuseumsWithHistory = vi.mocked(fetchMuseumsWithHistory);

describe('App', () => {
  beforeEach(() => {
    mockedFetchMuseumsWithHistory.mockReset();
  });

  it('shows stale data banner when diagnostics mark data as stale', async () => {
    mockedFetchMuseumsWithHistory.mockResolvedValue({
      museumsPayload: {
        data: [
          {
            name: 'Museum Ludwig',
            placeId: 'place-1',
            rating: 4.6,
            reviewCount: 10000,
            address: 'Heinrich-Boell-Platz',
            url: 'https://maps.google.com',
            reviewsSample: [],
            keywords: [{ text: 'art', value: 8 }],
            sentiment: { positive: 80, neutral: 15, negative: 5 },
            source: 'synthetic_engine',
            fetchedAt: '2026-03-02T10:00:00.000Z',
          },
        ],
        diagnostics: {
          provider: 'synthetic_engine',
          lastSyncAt: '2026-03-02T10:00:00.000Z',
          refreshAttempted: true,
          refreshSkipped: false,
          refreshReason: 'page_load',
          stale: true,
          partial: false,
          warnings: ['sync failed'],
          message: 'Using stale snapshot.',
          generatorVersion: 'synthetic-engine-v1',
          seedDate: '2026-03-02',
        },
      },
      historyPayload: {
        history: [{ name: 'Museum Ludwig', date: '2026-03-02', rating: 4.6, reviewCount: 10000 }],
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Data mode:/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Stale')).toBeInTheDocument();
    expect(screen.getByText(/Data source: Synthetic Engine/i)).toBeInTheDocument();
  });
});
