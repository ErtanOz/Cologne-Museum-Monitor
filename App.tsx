import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MuseumData, MuseumHistory } from './types';
import { fetchMuseumData } from './services/geminiService';
import { Sidebar } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { MuseumTable } from './components/MuseumTable';
import { RankingChart, TrendChart } from './components/Charts';
import { WordCloud } from './components/WordCloud';
import { SentimentAnalysis } from './components/SentimentAnalysis';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';

// Initial list of museums to track
const TARGET_MUSEUMS = [
  "Museum Ludwig",
  "Römisch-Germanisches Museum",
  "Schokoladenmuseum Köln",
  "Wallraf-Richartz-Museum",
  "Museum für Angewandte Kunst Köln",
  "NS-Dokumentationszentrum",
  "Duftmuseum im Farina-Haus",
  "Kölnisches Stadtmuseum",
  "Museum Schnütgen",
  "Odysseum",
  "Rautenstrauch-Joest-Museum",
  "Kolumba",
  "Cologne Cathedral Treasury"
];

const LOADING_MESSAGES = [
  "Initializing AI Maps Grounding...",
  "Searching for Cologne museums...",
  "Fetching ratings and review counts...",
  "Analyzing review sentiment...",
  "Extracting key topics for word clouds...",
  "Aggregating dashboard metrics..."
];

const App: React.FC = () => {
  const [data, setData] = useState<MuseumData[]>([]);
  const [history, setHistory] = useState<MuseumHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<string>('1y');

  const [selectedMuseumId, setSelectedMuseumId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Cycle through loading messages to give user feedback on the process
    let msgIndex = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[msgIndex]);
    }, 2500);

    try {
      const fetchedData = await fetchMuseumData(TARGET_MUSEUMS);

      // Sort by rating descending by default
      const sortedData = fetchedData.sort((a, b) => b.rating - a.rating);

      setData(sortedData);
      setLastUpdated(new Date());

      // Simulate history for the trend chart
      const mockHistory = generateMockHistory(sortedData);
      setHistory(mockHistory);

      if (sortedData.length > 0) {
        setSelectedMuseumId(sortedData[0].name);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred fetching data.');
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter data (Main Table)
  const filteredData = data.filter(m => m.rating >= minRatingFilter);

  // Filter History Data based on Time Range
  const filteredHistory = useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date();

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

    return history.filter(h => new Date(h.date) >= cutoffDate);
  }, [history, timeRange]);

  // Get top 3 for metrics
  const top3 = [...data].sort((a, b) => b.rating - a.rating).slice(0, 3);

  // Prepare data for details view
  const selectedMuseum = data.find(m => m.name === selectedMuseumId);
  const selectedMuseumHistory = filteredHistory.filter(h => h.name === selectedMuseumId);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Mobile Menu Button */}
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

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          minRating={minRatingFilter}
          onFilterChange={setMinRatingFilter}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onRefresh={loadData}
          loading={loading}
        />
      </div>

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <Header lastUpdated={lastUpdated} title="Cologne Museum Monitor" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {error && <ErrorDisplay message={error} onRetry={loadData} />}

          {loading && !data.length ? (
            <Loader message={loadingMessage} />
          ) : (
            <>
              <MetricCards topMuseums={top3} />

              {/* Main Dashboard: Selected Museum Focus */}
              <div className="space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-500 animate-slideUp">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        History: {selectedMuseumId || 'Select a Museum'}
                      </h2>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full shadow-sm border border-indigo-100">
                      Last {timeRange === '1y' ? '1 Year' : timeRange === '6m' ? '6 Months' : timeRange === '3m' ? '3 Months' : '1 Month'}
                    </span>
                  </div>

                  <div className="h-[400px]">
                    <TrendChart data={selectedMuseumHistory} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sentiment Card */}
                  <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-500 animate-slideUp" style={{ animationDelay: '100ms' }}>
                    {selectedMuseum ? (
                      <SentimentAnalysis sentiment={selectedMuseum.sentiment} />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400 text-sm italic">Select a museum to view sentiment</div>
                    )}
                  </div>

                  {/* Review Topics Card */}
                  <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-500 animate-slideUp" style={{ animationDelay: '200ms' }}>
                    {selectedMuseum ? (
                      <WordCloud keywords={selectedMuseum.keywords} />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400 text-sm italic">Select a museum to view topics</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary View: Global Rankings & All Data */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-6">
                {/* Ranking Chart */}
                <div className="xl:col-span-1 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col hover:shadow-xl transition-all duration-300 animate-slideUp" style={{ animationDelay: '300ms' }}>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Top Ratings Ranking
                  </h3>
                  <div className="flex-1">
                    <RankingChart data={filteredData} />
                  </div>
                </div>

                {/* Museum Data Table */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 animate-slideUp" style={{ animationDelay: '400ms' }}>
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      All Museums Data
                    </h3>
                  </div>
                  <MuseumTable
                    data={filteredData}
                    onSelect={setSelectedMuseumId}
                    selectedId={selectedMuseumId}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper to generate realistic-looking mock history based on the *actual* current data
function generateMockHistory(currentData: MuseumData[]): MuseumHistory[] {
  const history: MuseumHistory[] = [];
  const today = new Date();

  currentData.forEach(museum => {
    // Generate 12 months of history
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);

      // Ratings are usually very stable, only shifting by 0.1 at most over a year
      const variance = (Math.random() * 0.1) - 0.05;
      let pastRating = museum.rating + variance;
      pastRating = Math.max(1, Math.min(5, pastRating));

      // Review growth is typically 5-15% per year for established museums
      // We'll simulate a steady monthly growth
      const yearlyGrowthRate = 0.05 + (Math.random() * 0.1); // 5% to 15%
      const monthlyGrowthRate = yearlyGrowthRate / 12;

      // Calculate past reviews based on current count and distance in months
      // Formula: past = current / (1 + rate)^months
      const pastReviews = Math.floor(museum.reviewCount / Math.pow(1 + monthlyGrowthRate, i));

      history.push({
        name: museum.name,
        date: date.toISOString().split('T')[0],
        rating: Number(pastRating.toFixed(1)),
        reviewCount: pastReviews
      });
    }
  });
  return history;
}

export default App;