import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FetchDiagnostics, FetchStatus, MuseumData, MuseumHistory } from './types';
import { fetchMuseumsWithHistory } from './services/museumApiClient';
import { Sidebar } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { MuseumTable } from './components/MuseumTable';
import { SentimentAnalysis } from './components/SentimentAnalysis';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ReviewSamples } from './components/ReviewSamples';

const RankingChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.RankingChart })));
const TrendChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.TrendChart })));
const WordCloud = lazy(() => import('./components/WordCloud').then((m) => ({ default: m.WordCloud })));

const LOADING_MESSAGES = [
  'Connecting to museum backend...',
  'Checking synthetic engine status...',
  'Generating latest museum simulation...',
  'Loading daily snapshots and trends...',
  'Rendering dashboard widgets...',
];

const CHART_FALLBACK = <div className="h-full min-h-[320px] w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 animate-pulse" />;

const INITIAL_DIAGNOSTICS: FetchDiagnostics = {
  provider: 'synthetic_engine',
  lastSyncAt: null,
  refreshAttempted: false,
  refreshSkipped: false,
  refreshReason: null,
  stale: true,
  partial: false,
  warnings: [],
  message: 'Synthetic data mode active.',
  generatorVersion: 'synthetic-engine-v1',
  seedDate: new Date().toISOString().slice(0, 10),
};

interface LoadDataOptions {
  refreshReason?: 'manual' | 'page_load' | 'daily';
  forceRefresh?: boolean;
}

const App: React.FC = () => {
  const [data, setData] = useState<MuseumData[]>([]);
  const [history, setHistory] = useState<MuseumHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('idle');
  const [diagnostics, setDiagnostics] = useState<FetchDiagnostics>(INITIAL_DIAGNOSTICS);

  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<string>('1y');

  const [selectedMuseumId, setSelectedMuseumId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const dataCountRef = useRef(0);

  useEffect(() => {
    dataCountRef.current = data.length;
  }, [data.length]);

  const loadData = useCallback(async (options: LoadDataOptions = {}) => {
    setLoading(true);
    setError(null);
    setFetchStatus('loading');

    let msgIndex = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);

    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[msgIndex]);
    }, 2200);

    try {
      const { museumsPayload, historyPayload } = await fetchMuseumsWithHistory({
        refreshReason: options.refreshReason,
        forceRefresh: options.forceRefresh,
        historyDays: 365,
      });

      const sortedData = [...museumsPayload.data].sort((a, b) => b.rating - a.rating);
      setData(sortedData);
      setHistory(historyPayload.history);
      setDiagnostics(museumsPayload.diagnostics);
      setFetchStatus(museumsPayload.diagnostics.stale ? 'degraded' : 'success');

      if (museumsPayload.diagnostics.lastSyncAt) {
        setLastUpdated(new Date(museumsPayload.diagnostics.lastSyncAt));
      }

      setSelectedMuseumId((current) => {
        if (current && sortedData.some((museum) => museum.name === current)) {
          return current;
        }

        return sortedData.length > 0 ? sortedData[0].name : null;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred fetching data.';
      setError(message);
      setDiagnostics((prev) => ({ ...prev, message, stale: true }));
      setFetchStatus(dataCountRef.current ? 'degraded' : 'error');
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = data.filter((museum) => museum.rating >= minRatingFilter);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now);

    switch (timeRange) {
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
      default:
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return history.filter((entry) => new Date(entry.date) >= cutoffDate);
  }, [history, timeRange]);

  const top3 = [...data].sort((a, b) => b.rating - a.rating).slice(0, 3);

  const selectedMuseum = data.find((museum) => museum.name === selectedMuseumId);
  const selectedMuseumHistory = filteredHistory.filter((entry) => entry.name === selectedMuseumId);

  const dashboardMessage = useMemo(() => {
    if (diagnostics.provider === 'synthetic_engine' && fetchStatus !== 'error') {
      return diagnostics.message || 'Synthetic data mode active.';
    }

    if (fetchStatus === 'degraded' && diagnostics.stale) {
      return diagnostics.message || 'Showing stale snapshot because live sync is unavailable.';
    }

    if (diagnostics.refreshSkipped) {
      return diagnostics.message || 'Refresh skipped due to throttle policy.';
    }

    if (diagnostics.partial) {
      return diagnostics.message || 'Sync completed with partial fallback.';
    }

    if (fetchStatus === 'success') {
      return diagnostics.message;
    }

    return '';
  }, [diagnostics, fetchStatus]);

  const handleMuseumSelect = (museumName: string) => {
    setSelectedMuseumId(museumName);

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const hasBanner = Boolean(
    dashboardMessage &&
      (diagnostics.provider === 'synthetic_engine' ||
        diagnostics.refreshSkipped ||
        diagnostics.partial ||
        fetchStatus === 'degraded')
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-all duration-200 hover:scale-105"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity animate-fadeIn" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar
          minRating={minRatingFilter}
          onFilterChange={setMinRatingFilter}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={() => loadData({ refreshReason: 'manual', forceRefresh: true })}
          loading={loading}
        />
      </div>

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <Header title="Cologne Museum Monitor" lastUpdated={lastUpdated} fetchStatus={fetchStatus} diagnostics={diagnostics} />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {error && !data.length && (
            <ErrorDisplay message={error} onRetry={() => loadData({ refreshReason: 'manual', forceRefresh: true })} />
          )}

          {hasBanner && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
                fetchStatus === 'degraded'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : diagnostics.provider === 'synthetic_engine'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : diagnostics.refreshSkipped
                    ? 'border-blue-200 bg-blue-50 text-blue-900'
                    : 'border-orange-200 bg-orange-50 text-orange-900'
              }`}
              role="status"
              aria-live="polite"
            >
              <span className="font-semibold">Data mode:</span> {dashboardMessage}
            </div>
          )}

          {loading && !data.length ? (
            <Loader message={loadingMessage} />
          ) : (
            <>
              <MetricCards topMuseums={top3} />

              <div className="space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-500 animate-slideUp">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">History: {selectedMuseumId || 'Select a Museum'}</h2>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full shadow-sm border border-indigo-100">
                      Last {timeRange === '1y' ? '1 Year' : timeRange === '6m' ? '6 Months' : timeRange === '3m' ? '3 Months' : '1 Month'}
                    </span>
                  </div>

                  <div className="h-[400px]">
                    <Suspense fallback={CHART_FALLBACK}>
                      <TrendChart data={selectedMuseumHistory} />
                    </Suspense>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-500 animate-slideUp" style={{ animationDelay: '100ms' }}>
                    {selectedMuseum ? (
                      <SentimentAnalysis sentiment={selectedMuseum.sentiment} />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400 text-sm italic">Select a museum to view sentiment</div>
                    )}
                  </div>

                  <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-500 animate-slideUp" style={{ animationDelay: '200ms' }}>
                    {selectedMuseum ? (
                      <Suspense fallback={CHART_FALLBACK}>
                        <WordCloud keywords={selectedMuseum.keywords} />
                      </Suspense>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400 text-sm italic">Select a museum to view topics</div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-500 animate-slideUp" style={{ animationDelay: '300ms' }}>
                    <h3 className="text-base font-bold text-slate-800 mb-4">Recent Reviews</h3>
                    {selectedMuseum ? (
                      <ReviewSamples reviews={selectedMuseum.reviewsSample} />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400 text-sm italic">Select a museum to view reviews</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-6">
                <div className="xl:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col hover:shadow-xl transition-all duration-300 animate-slideUp" style={{ animationDelay: '400ms' }}>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Top Ratings Ranking
                  </h3>
                  <div className="flex-1">
                    <Suspense fallback={CHART_FALLBACK}>
                      <RankingChart data={filteredData} />
                    </Suspense>
                  </div>
                </div>

                <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 animate-slideUp" style={{ animationDelay: '500ms' }}>
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      All Museums Data
                    </h3>
                  </div>
                  <MuseumTable data={filteredData} onSelect={handleMuseumSelect} selectedId={selectedMuseumId} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
